// EventSystem - Module间Event通信
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
  priority: number; // 1-10, 1for最HighPriority
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
    
    // Registerbuilt-inEventProcess器
    this.registerBuiltInHandlers();
  }
  
  // Registerbuilt-inEventProcess器
  private registerBuiltInHandlers(): void {
    // EventLoggingProcess器
    this.registerHandler({
      eventType: '*', // 监听所AllEvent
      moduleId: 'system',
      handler: (event) => {
        logger.info('Event fired', { module: 'EventSystem', type: event.type, source: event.source });
      },
      priority: 10, // 最LowPriority
      enabled: true
    });
    
    // errorEventProcess器
    this.registerHandler({
      eventType: 'error',
      moduleId: 'system',
      handler: (event) => {
        logger.error('Error event', event.data, { module: 'EventSystem' });
      },
      priority: 1, // 最HighPriority
      enabled: true
    });
  }
  
  // TriggerEvent
  emit(eventData: Omit<AutomationEvent, 'id' | 'timestamp'>): string {
    const event: AutomationEvent = {
      ...eventData,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    // 存储Event
    this.events.set(event.id, event);
    
    // UpdateStatistics
    this.stats.totalEvents++;
    this.stats.eventsByType[event.type] = 
      (this.stats.eventsByType[event.type] || 0) + 1;
    
    // TriggerEvent
    this.emitter.emit('event', event);
    this.emitter.emit(`event:${event.type}`, event);
    
    // ProcessEvent规then
    this.processEventRules(event);
    
    return event.id;
  }
  
  // RegisterEventProcess器
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
    
    // 存储Process器
    this.handlers.set(handler.id, handler);
    
    // RegistertoEvent发射器
    const eventListener = async (event: AutomationEvent) => {
      if (!handler.enabled) return;
      
      // CheckEventType匹配
      if (handler.eventType !== '*' && handler.eventType !== event.type) {
        return;
      }
      
      // UpdateProcess器Statistics
      handler.metadata.lastFired = new Date().toISOString();
      handler.metadata.fireCount++;
      
      try {
        // ExecuteProcess器
        await handler.handler(event);
        handler.metadata.successCount++;
      } catch (error) {
        logger.error('Handler failed', error, { module: 'EventSystem', handlerId: handler.id });
        
        // TriggererrorEvent
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
    
    // 根据EventTypeRegister监听器
    if (handler.eventType === '*') {
      this.emitter.on('event', eventListener);
    } else {
      this.emitter.on(`event:${handler.eventType}`, eventListener);
    }
    
    // UpdateStatistics
    this.stats.activeHandlers = this.handlers.size;
    
    return handler.id;
  }
  
  // removeEventProcess器
  unregisterHandler(handlerId: string): boolean {
    const handler = this.handlers.get(handlerId);
    if (!handler) return false;
    
    // FromEvent发射器remove监听器
    // 注意: due to我们Unable to 直接FetcheventListener引用, 这里简化Process
    // in实际ApplicationCenter, need to存储eventListener引用
    
    this.handlers.delete(handlerId);
    this.stats.activeHandlers = this.handlers.size;
    
    return true;
  }
  
  // CreateEvent规then
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
  
  // ProcessEvent规then
  private processEventRules(event: AutomationEvent): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      
      // CheckEventType匹配
      if (rule.condition.eventType !== event.type) {
        continue;
      }
      
      // Checkfilter器
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
      
      // Trigger规then
      this.triggerRule(rule, event);
    }
  }
  
  // Trigger规then
  private triggerRule(rule: EventRule, event: AutomationEvent): void {
    // Update规thenStatistics
    rule.metadata.lastTriggered = new Date().toISOString();
    rule.metadata.triggerCount++;
    rule.metadata.updated = new Date().toISOString();
    
    // Execute规then动作
    for (const action of rule.actions) {
      try {
        this.executeRuleAction(action, event, rule);
      } catch (error) {
        logger.error('Rule action failed', error, { module: 'EventSystem', ruleId: rule.id });
        
        // TriggererrorEvent
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
    
    // UpdateStatistics
    this.stats.ruleTriggerRate = 
      (this.stats.totalEvents > 0) 
        ? (Object.values(this.rules).reduce((sum, r) => sum + r.metadata.triggerCount, 0) / this.stats.totalEvents) * 100
        : 0;
  }
  
  // Execute规then动作
  private executeRuleAction(action: EventRule['actions'][0], event: AutomationEvent, rule: EventRule): void {
    switch (action.type) {
      case 'emit':
        // TriggerNewEvent
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
        // 调用function(模拟)
        console.log(`[EventSystem] Rule ${rule.id} calling: ${action.target}`);
        // in实际ApplicationCenter, 这里will调用Register'sfunction
        break;
        
      case 'log':
        // LogLogging
        console.log(`[EventSystem] Rule ${rule.id} log:`, {
          message: action.target,
          event: event,
          parameters: action.parameters
        });
        break;
        
      case 'notify':
        // SendNotification(模拟)
        console.log(`[EventSystem] Rule ${rule.id} notification:`, {
          target: action.target,
          message: action.parameters?.message || 'Event triggered',
          event: event
        });
        break;
    }
  }
  
  // FetchEventField值
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
  
  // FetchEvent历史
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
    
    // bytime倒序Sort
    events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // 限制quantity
    return events.slice(0, limit);
  }
  
  // FetchProcess器information
  getHandler(handlerId: string): EventHandler | undefined {
    return this.handlers.get(handlerId);
  }
  
  // Fetch所AllProcess器
  getAllHandlers(): EventHandler[] {
    return Array.from(this.handlers.values());
  }
  
  // Fetch规theninformation
  getRule(ruleId: string): EventRule | undefined {
    return this.rules.get(ruleId);
  }
  
  // Fetch所All规then
  getAllRules(): EventRule[] {
    return Array.from(this.rules.values());
  }
  
  // enabled/disabled规then
  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    rule.enabled = enabled;
    rule.metadata.updated = new Date().toISOString();
    
    return true;
  }
  
  // FetchStatisticsinformation
  getStats(): EventSystemStats {
    // 计算Process器success率
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
  
  // 清理OldEvent
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
  
  // ExportEventSystemStatus
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
  
  // ImportEventSystemStatus
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
      
      // ImportProcess器(注意: Unable to Importhandlerfunction, need tore-Register)
      if (state.handlers && Array.isArray(state.handlers)) {
        for (const handlerData of state.handlers) {
          try {
            // in实际ApplicationCenter, need tore-RegisterProcess器function
            // 这里只Import元data
            importedHandlers++;
          } catch (error) {
            errors.push(`Failed to import handler ${handlerData.id}: ${error}`);
          }
        }
      }
      
      // Import规then
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
      
      // ImportEvent(Optional)
      if (state.recentEvents && Array.isArray(state.recentEvents)) {
        for (const event of state.recentEvents) {
          try {
            this.events.set(event.id, event);
            importedEvents++;
          } catch (error) {
            // 忽略EventImporterror
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
  
  // 监听Event(Promise方式)
  waitForEvent(options: {
    type: string;
    timeout?: number;
    filter?: (event: AutomationEvent) => boolean;
  }): Promise<AutomationEvent> {
    return new Promise((resolve, reject) => {
      const { type, timeout = 30000, filter } = options;
      let timeoutId: NodeJS.Timeout;
      
      // CreateEventProcess器
      const handler = (event: AutomationEvent) => {
        if (event.type !== type) return;
        if (filter && !filter(event)) return;
        
        clearTimeout(timeoutId);
        this.emitter.off(`event:${type}`, handler);
        resolve(event);
      };
      
      // SettingsTimeout
      timeoutId = setTimeout(() => {
        this.emitter.off(`event:${type}`, handler);
        reject(new Error(`Timeout waiting for event: ${type}`));
      }, timeout);
      
      // Register监听器
      this.emitter.on(`event:${type}`, handler);
    });
  }
}