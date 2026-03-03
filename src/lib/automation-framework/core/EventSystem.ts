// 事件系统 - 模块间事件通信
import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

export interface AutomationEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: unknown;
  metadata?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    correlationId?: string;
    parentEventId?: string;
    tags?: string[];
  };
}

export interface EventHandler {
  id: string;
  eventType: string;
  moduleId: string;
  handler: (event: AutomationEvent) => void | Promise<void>;
  priority: number; // 1-10, 1 is highest priority
  enabled: boolean;
  metadata: {
    registeredAt: string;
    lastFired?: string;
    fireCount: number;
    successCount: number;
  };
}

export interface EventRule {
  id: string;
  name: string;
  description: string;
  condition: {
    eventType: string;
    filters?: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'matches' | 'greaterThan' | 'lessThan';
      value: unknown;
    }>;
  };
  actions: Array<{
    type: 'emit' | 'call' | 'log' | 'notify';
    target: string;
    parameters?: Record<string, unknown>;
  }>;
  enabled: boolean;
  metadata: {
    created: string;
    updated: string;
    lastTriggered?: string;
    triggerCount: number;
  };
}

export interface EventSystemStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  activeHandlers: number;
  activeRules: number;
  handlerSuccessRate: number;
  ruleTriggerRate: number;
}

export class EventSystem {
  private emitter: EventEmitter;
  private events: Map<string, AutomationEvent>;
  private handlers: Map<string, EventHandler>;
  private rules: Map<string, EventRule>;
  private stats: EventSystemStats;
  
  constructor() {
    this.emitter = new EventEmitter();
    this.events = new Map();
    this.handlers = new Map();
    this.rules = new Map();
    
    this.stats = {
      totalEvents: 0,
      eventsByType: {},
      activeHandlers: 0,
      activeRules: 0,
      handlerSuccessRate: 100,
      ruleTriggerRate: 0
    };
    
    // 注册内置事件处理器
    this.registerBuiltInHandlers();
  }
  
  // 注册内置事件处理器
  private registerBuiltInHandlers(): void {
    // 事件日志处理器
    this.registerHandler({
      eventType: '*', // listen to all events
      moduleId: 'system',
      handler: (event) => {
        logger.info('Event fired', { module: 'EventSystem', type: event.type, source: event.source });
      },
      priority: 10, // lowest priority
      enabled: true
    });
    
    // 错误事件处理器
    this.registerHandler({
      eventType: 'error',
      moduleId: 'system',
      handler: (event) => {
        logger.error('Error event', event.data, { module: 'EventSystem' });
      },
      priority: 1, // highest priority
      enabled: true
    });
  }
  
  // 触发事件
  emit(eventData: Omit<AutomationEvent, 'id' | 'timestamp'>): string {
    const event: AutomationEvent = {
      ...eventData,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    // 存储事件
    this.events.set(event.id, event);
    
    // 更新统计
    this.stats.totalEvents++;
    this.stats.eventsByType[event.type] = 
      (this.stats.eventsByType[event.type] || 0) + 1;
    
    // 触发事件
    this.emitter.emit('event', event);
    this.emitter.emit(`event:${event.type}`, event);
    
    // 处理事件规则
    this.processEventRules(event);
    
    return event.id;
  }
  
  // 注册事件处理器
  registerHandler(handlerData: Omit<EventHandler, 'id' | 'metadata'>): string {
    const handler: EventHandler = {
      ...handlerData,
      id: `hdl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        registeredAt: new Date().toISOString(),
        fireCount: 0,
        successCount: 0
      }
    };
    
    // 存储处理器
    this.handlers.set(handler.id, handler);
    
    // 注册到事件发射器
    const eventListener = async (event: AutomationEvent) => {
      if (!handler.enabled) return;
      
      // 检查事件类型匹配
      if (handler.eventType !== '*' && handler.eventType !== event.type) {
        return;
      }
      
      // 更新处理器统计
      handler.metadata.lastFired = new Date().toISOString();
      handler.metadata.fireCount++;
      
      try {
        // 执行处理器
        await handler.handler(event);
        handler.metadata.successCount++;
      } catch (error) {
        logger.error('Handler failed', error, { module: 'EventSystem', handlerId: handler.id });
        
        // 触发错误事件
        this.emit({
          type: 'handler-error',
          source: 'event-system',
          data: {
            handlerId: handler.id,
            eventId: event.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          metadata: {
            priority: 'high',
            parentEventId: event.id
          }
        });
      }
    };
    
    // 根据事件类型注册监听器
    if (handler.eventType === '*') {
      this.emitter.on('event', eventListener);
    } else {
      this.emitter.on(`event:${handler.eventType}`, eventListener);
    }
    
    // 更新统计
    this.stats.activeHandlers = this.handlers.size;
    
    return handler.id;
  }
  
  // 移除事件处理器
  unregisterHandler(handlerId: string): boolean {
    const handler = this.handlers.get(handlerId);
    if (!handler) return false;
    
    // 从事件发射器移除监听器
    // 注意：由于我们无法直接获取eventListener引用，这里简化处理
    // 在实际应用中，需要存储eventListener引用
    
    this.handlers.delete(handlerId);
    this.stats.activeHandlers = this.handlers.size;
    
    return true;
  }
  
  // 创建事件规则
  createRule(ruleData: Omit<EventRule, 'id' | 'metadata'>): string {
    const rule: EventRule = {
      ...ruleData,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        triggerCount: 0
      }
    };
    
    this.rules.set(rule.id, rule);
    this.stats.activeRules = this.rules.size;
    
    return rule.id;
  }
  
  // 处理事件规则
  private processEventRules(event: AutomationEvent): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      
      // 检查事件类型匹配
      if (rule.condition.eventType !== event.type) {
        continue;
      }
      
      // 检查过滤器
      if (rule.condition.filters) {
        let matches = true;
        
        for (const filter of rule.condition.filters) {
          const value = this.getEventFieldValue(event, filter.field);
          
          switch (filter.operator) {
            case 'equals':
              if (value !== filter.value) matches = false;
              break;
            case 'contains':
              if (typeof value === 'string' && typeof filter.value === 'string') {
                if (!value.includes(filter.value)) matches = false;
              } else {
                matches = false;
              }
              break;
            case 'matches':
              if (typeof value === 'string' && typeof filter.value === 'string') {
                const regex = new RegExp(filter.value);
                if (!regex.test(value)) matches = false;
              } else {
                matches = false;
              }
              break;
            case 'greaterThan':
              if (typeof value === 'number' && typeof filter.value === 'number') {
                if (value <= filter.value) matches = false;
              } else {
                matches = false;
              }
              break;
            case 'lessThan':
              if (typeof value === 'number' && typeof filter.value === 'number') {
                if (value >= filter.value) matches = false;
              } else {
                matches = false;
              }
              break;
          }
          
          if (!matches) break;
        }
        
        if (!matches) continue;
      }
      
      // 触发规则
      this.triggerRule(rule, event);
    }
  }
  
  // 触发规则
  private triggerRule(rule: EventRule, event: AutomationEvent): void {
    // 更新规则统计
    rule.metadata.lastTriggered = new Date().toISOString();
    rule.metadata.triggerCount++;
    rule.metadata.updated = new Date().toISOString();
    
    // 执行规则动作
    for (const action of rule.actions) {
      try {
        this.executeRuleAction(action, event, rule);
      } catch (error) {
        logger.error('Rule action failed', error, { module: 'EventSystem', ruleId: rule.id });
        
        // 触发错误事件
        this.emit({
          type: 'rule-action-error',
          source: 'event-system',
          data: {
            ruleId: rule.id,
            actionType: action.type,
            eventId: event.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          metadata: {
            priority: 'high',
            parentEventId: event.id
          }
        });
      }
    }
    
    // 更新统计
    this.stats.ruleTriggerRate = 
      (this.stats.totalEvents > 0) 
        ? (Object.values(this.rules).reduce((sum, r) => sum + r.metadata.triggerCount, 0) / this.stats.totalEvents) * 100
        : 0;
  }
  
  // 执行规则动作
  private executeRuleAction(action: EventRule['actions'][0], event: AutomationEvent, rule: EventRule): void {
    switch (action.type) {
      case 'emit':
        // 触发新事件
        this.emit({
          type: action.target,
          source: `rule:${rule.id}`,
          data: {
            originalEvent: event,
            ruleData: rule,
            parameters: action.parameters
          },
          metadata: {
            priority: 'normal',
            parentEventId: event.id
          }
        });
        break;
        
      case 'call':
        // 调用函数（模拟）
        console.log(`[EventSystem] Rule ${rule.id} calling: ${action.target}`);
        // 在实际应用中，这里会调用注册的函数
        break;
        
      case 'log':
        // 记录日志
        console.log(`[EventSystem] Rule ${rule.id} log:`, {
          message: action.target,
          event: event,
          parameters: action.parameters
        });
        break;
        
      case 'notify':
        // 发送通知（模拟）
        console.log(`[EventSystem] Rule ${rule.id} notification:`, {
          target: action.target,
          message: action.parameters?.message || 'Event triggered',
          event: event
        });
        break;
    }
  }
  
  // 获取事件字段值
  private getEventFieldValue(event: AutomationEvent, fieldPath: string): unknown {
    const parts = fieldPath.split('.');
    let value: unknown = event;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  // 获取事件历史
  getEventHistory(options: {
    type?: string;
    source?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
  } = {}): AutomationEvent[] {
    const {
      type,
      source,
      startTime,
      endTime,
      limit = 100
    } = options;
    
    let events = Array.from(this.events.values());
    
 // filter
    if (type) {
      events = events.filter(evt => evt.type === type);
    }
    if (source) {
      events = events.filter(evt => evt.source === source);
    }
    if (startTime) {
      const start = new Date(startTime);
      events = events.filter(evt => new Date(evt.timestamp) >= start);
    }
    if (endTime) {
      const end = new Date(endTime);
      events = events.filter(evt => new Date(evt.timestamp) <= end);
    }
    
    // 按时间倒序排序
    events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // 限制数量
    return events.slice(0, limit);
  }
  
  // 获取处理器信息
  getHandler(handlerId: string): EventHandler | undefined {
    return this.handlers.get(handlerId);
  }
  
  // 获取所有处理器
  getAllHandlers(): EventHandler[] {
    return Array.from(this.handlers.values());
  }
  
  // 获取规则信息
  getRule(ruleId: string): EventRule | undefined {
    return this.rules.get(ruleId);
  }
  
  // 获取所有规则
  getAllRules(): EventRule[] {
    return Array.from(this.rules.values());
  }
  
  // 启用/禁用规则
  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    rule.enabled = enabled;
    rule.metadata.updated = new Date().toISOString();
    
    return true;
  }
  
  // Get statistics信息
  getStats(): EventSystemStats {
    // 计算处理器成功率
    let totalFires = 0;
    let totalSuccess = 0;
    
    for (const handler of this.handlers.values()) {
      totalFires += handler.metadata.fireCount;
      totalSuccess += handler.metadata.successCount;
    }
    
    if (totalFires > 0) {
      this.stats.handlerSuccessRate = (totalSuccess / totalFires) * 100;
    }
    
    return { ...this.stats };
  }
  
  // 清理旧事件
  cleanupOldEvents(maxAgeHours: number = 24): {
    deleted: number;
    kept: number;
  } {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);
    
    let deleted = 0;
    let kept = 0;
    
    for (const [id, event] of this.events.entries()) {
      const eventTime = new Date(event.timestamp);
      
      if (eventTime < cutoffTime) {
        this.events.delete(id);
        deleted++;
      } else {
        kept++;
      }
    }
    
    return { deleted, kept };
  }
  
  // 导出事件系统状态
  exportState(): string {
    const state = {
      handlers: this.getAllHandlers(),
      rules: this.getAllRules(),
      stats: this.getStats(),
      recentEvents: this.getEventHistory({ limit: 100 }),
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };
    
    return JSON.stringify(state, null, 2);
  }
  
  // 导入事件系统状态
  importState(stateJson: string): {
    success: boolean;
    imported: {
      handlers: number;
      rules: number;
      events: number;
    };
    errors?: string[];
  } {
    try {
      const state = JSON.parse(stateJson);
      
      let importedHandlers = 0;
      let importedRules = 0;
      let importedEvents = 0;
      const errors: string[] = [];
      
      // 导入处理器（注意：无法导入handler函数，需要重新注册）
      if (state.handlers && Array.isArray(state.handlers)) {
        for (const handlerData of state.handlers) {
          try {
            // 在实际应用中，需要重新注册处理器函数
            // 这里只导入元数据
            importedHandlers++;
          } catch (error) {
            errors.push(`Failed to import handler ${handlerData.id}: ${error}`);
          }
        }
      }
      
      // 导入规则
      if (state.rules && Array.isArray(state.rules)) {
        for (const ruleData of state.rules) {
          try {
            this.createRule(ruleData);
            importedRules++;
          } catch (error) {
            errors.push(`Failed to import rule ${ruleData.id}: ${error}`);
          }
        }
      }
      
      // 导入事件（可选）
      if (state.recentEvents && Array.isArray(state.recentEvents)) {
        for (const event of state.recentEvents) {
          try {
            this.events.set(event.id, event);
            importedEvents++;
          } catch (error) {
            // 忽略事件导入错误
          }
        }
      }
      
      return {
        success: errors.length === 0,
        imported: {
          handlers: importedHandlers,
          rules: importedRules,
          events: importedEvents
        },
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        imported: { handlers: 0, rules: 0, events: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  // 监听事件（Promise方式）
  waitForEvent(options: {
    type: string;
    timeout?: number;
    filter?: (event: AutomationEvent) => boolean;
  }): Promise<AutomationEvent> {
    return new Promise((resolve, reject) => {
      const { type, timeout = 30000, filter } = options;
      let timeoutId: NodeJS.Timeout;
      
      // 创建事件处理器
      const handler = (event: AutomationEvent) => {
        if (event.type !== type) return;
        if (filter && !filter(event)) return;
        
        clearTimeout(timeoutId);
        this.emitter.off(`event:${type}`, handler);
        resolve(event);
      };
      
      // 设置超时
      timeoutId = setTimeout(() => {
        this.emitter.off(`event:${type}`, handler);
        reject(new Error(`Timeout waiting for event: ${type}`));
      }, timeout);
      
      // 注册监听器
      this.emitter.on(`event:${type}`, handler);
    });
  }
}