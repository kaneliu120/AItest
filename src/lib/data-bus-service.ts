import { logger } from './logger';
/**
 * 数据总线服务
 * 标准化模块间数据传递
 */

export interface DataEvent {
  type: string;
  source: string;
  timestamp: string;
  data: any;
  metadata?: {
    correlationId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    ttl?: number; // time-to-live (ms)
    retryCount?: number;
  };
}

export interface EventHandler {
  (event: DataEvent): Promise<void> | void;
}

export interface Subscription {
  unsubscribe: () => void;
  eventType: string;
  handlerId: string;
}

export interface DataBusConfig {
  maxQueueSize: number;
  defaultTTL: number; // default TTL (ms)
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

export interface DataBusMetrics {
  eventsPublished: number;
  eventsProcessed: number;
  eventsFailed: number;
  activeSubscriptions: number;
  queueSize: number;
  averageProcessingTime: number;
}

class DataBusService {
  private handlers: Map<string, Map<string, EventHandler>> = new Map();
  private eventQueue: DataEvent[] = [];
  private metrics: DataBusMetrics;
  private config: DataBusConfig;
  private processorIntervalId?: ReturnType<typeof setInterval>;

  constructor(config: Partial<DataBusConfig> = {}) {
    this.config = {
      maxQueueSize: 1000,
      defaultTTL: 60000, // 1 minute
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      enableLogging: true,
      enableMetrics: true,
      ...config,
    };

    this.metrics = {
      eventsPublished: 0,
      eventsProcessed: 0,
      eventsFailed: 0,
      activeSubscriptions: 0,
      queueSize: 0,
      averageProcessingTime: 0,
    };

    // 启动事件处理器
    this.startEventProcessor();
  }

  /**
   * 发布事件
   */
  async publish(event: Omit<DataEvent, 'timestamp'>): Promise<void> {
    const fullEvent: DataEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      metadata: {
        ttl: this.config.defaultTTL,
        ...event.metadata,
      },
    };

    // 检查事件是否过期
    if (this.isEventExpired(fullEvent)) {
      if (this.config.enableLogging) {
        logger.warn(`Event expired, skipping publish: ${fullEvent.type}`);
      }
      return;
    }

    // 添加到队列
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      // 移除最旧的事件
      this.eventQueue.shift();
    }

    this.eventQueue.push(fullEvent);
    this.metrics.eventsPublished++;
    this.metrics.queueSize = this.eventQueue.length;

    if (this.config.enableLogging) {
      logger.info(`📤 Publishing event: ${fullEvent.type} (source: ${fullEvent.source})`);
    }
  }

  /**
   * 订阅事件
   */
  subscribe(eventType: string, handler: EventHandler): Subscription {
    const handlerId = `handler-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Map());
    }

    this.handlers.get(eventType)!.set(handlerId, handler);
    this.metrics.activeSubscriptions++;

    if (this.config.enableLogging) {
      logger.info(`📥 Subscribed event: ${eventType} (handler: ${handlerId})`);
    }

    return {
      unsubscribe: () => {
        const handlers = this.handlers.get(eventType);
        if (handlers && handlers.has(handlerId)) {
          handlers.delete(handlerId);
          this.metrics.activeSubscriptions--;
          
          if (handlers.size === 0) {
            this.handlers.delete(eventType);
          }

          if (this.config.enableLogging) {
            logger.info(`📭 Unsubscribed: ${eventType} (handler: ${handlerId})`);
          }
        }
      },
      eventType,
      handlerId,
    };
  }

  /**
   * 请求-响应模式
   */
  async request<T = any>(
    eventType: string,
    data: any,
    options: {
      timeout?: number;
      correlationId?: string;
      source?: string;
    } = {}
  ): Promise<T> {
    const correlationId = options.correlationId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const source = options.source || 'data-bus-client';
    const timeout = options.timeout || 10000; // default 10s timeout

    return new Promise((resolve, reject) => {
      const responseEventType = `${eventType}:response:${correlationId}`;
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error(`Request timeout: ${eventType}`));
      }, timeout);

      // 订阅响应事件
      const subscription = this.subscribe(responseEventType, (responseEvent) => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        
        if (responseEvent.data?.error) {
          reject(new Error(responseEvent.data.error));
        } else {
          resolve(responseEvent.data);
        }
      });

      // 发布请求事件
      this.publish({
        type: eventType,
        source,
        data,
        metadata: {
          correlationId,
          priority: 'high',
        },
      }).catch(reject);
    });
  }

  /**
   * 响应请求
   */
  async respond(
    eventType: string,
    handler: (request: DataEvent) => Promise<any> | any
  ): Promise<Subscription> {
    return this.subscribe(eventType, async (requestEvent) => {
      const correlationId = requestEvent.metadata?.correlationId;
      
      if (!correlationId) {
        logger.warn(`Request event missing correlationId: ${eventType}`);
        return;
      }

      try {
        const responseData = await handler(requestEvent);
        
        await this.publish({
          type: `${eventType}:response:${correlationId}`,
          source: 'data-bus-service',
          data: responseData,
          metadata: {
            correlationId,
          },
        });
      } catch (error) {
        await this.publish({
          type: `${eventType}:response:${correlationId}`,
          source: 'data-bus-service',
          data: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          metadata: {
            correlationId,
          },
        });
      }
    });
  }

  /**
   * 获取指标数据
   */
  getMetrics(): DataBusMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取配置
   */
  getConfig(): DataBusConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<DataBusConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.eventQueue = [];
    this.metrics.queueSize = 0;
  }

  /**
   * 获取活跃订阅
   */
  getActiveSubscriptions(): Array<{ eventType: string; count: number }> {
    const result: Array<{ eventType: string; count: number }> = [];
    
    for (const [eventType, handlers] of this.handlers.entries()) {
      result.push({
        eventType,
        count: handlers.size,
      });
    }
    
    return result;
  }

  /**
   * 私有方法：启动事件处理器
   */
  private startEventProcessor(): void {
    this.processorIntervalId = setInterval(() => {
      this.processEventQueue();
    }, 100); // process every 100ms
  }

  stopEventProcessor(): void {
    if (this.processorIntervalId !== undefined) {
      clearInterval(this.processorIntervalId);
      this.processorIntervalId = undefined;
    }
  }

  /**
   * 私有方法：处理事件队列
   */
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const event = this.eventQueue.shift()!;
    this.metrics.queueSize = this.eventQueue.length;

    // 检查事件是否过期
    if (this.isEventExpired(event)) {
      if (this.config.enableLogging) {
        logger.warn(`Skipping expired event: ${event.type}`);
      }
      return;
    }

    const startTime = Date.now();
    const handlers = this.handlers.get(event.type);

    if (!handlers || handlers.size === 0) {
      if (this.config.enableLogging) {
        logger.warn(`No handlers subscribed to event: ${event.type}`);
      }
      return;
    }

    // 并行执行所有处理器
    const handlerPromises = Array.from(handlers.values()).map(async (handler, index) => {
      try {
        await handler(event);
        return { success: true, index };
      } catch (error) {
        logger.error(`Event handler error (${event.type}):`, error);
        return { success: false, index, error };
      }
    });

    const results = await Promise.all(handlerPromises);
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // 更新指标
    this.metrics.eventsProcessed++;
    this.metrics.averageProcessingTime = (
      (this.metrics.averageProcessingTime * (this.metrics.eventsProcessed - 1) + processingTime) / 
      this.metrics.eventsProcessed
    );

    const failedCount = results.filter(r => !r.success).length;
    if (failedCount > 0) {
      this.metrics.eventsFailed += failedCount;
    }

    if (this.config.enableLogging) {
      logger.info(`📨 Processing event: ${event.type} (${handlers.size} handlers, ${processingTime}ms)`);
    }
  }

  /**
   * 私有方法：检查事件是否过期
   */
  private isEventExpired(event: DataEvent): boolean {
    const ttl = event.metadata?.ttl || this.config.defaultTTL;
    const eventTime = new Date(event.timestamp).getTime();
    const currentTime = Date.now();
    
    return currentTime - eventTime > ttl;
  }
}

// 创建全局数据总线实例
export const dataBusService = new DataBusService({
  enableLogging: true,
  enableMetrics: true,
  maxQueueSize: 500,
  defaultTTL: 30000, // 30 seconds
});

// 标准事件类型定义
export const StandardEventTypes = {
  // 系统事件
  SYSTEM_START: 'system:start',
  SYSTEM_STOP: 'system:stop',
  SYSTEM_HEALTH_CHECK: 'system:health-check',
  
  // 项目事件
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_COMPLETED: 'project:completed',
  
  // 开发事件
  DEVELOPMENT_STARTED: 'development:started',
  CODE_GENERATED: 'code:generated',
  CODE_REVIEWED: 'code:reviewed',
  
  // 测试事件
  TEST_STARTED: 'test:started',
  TEST_COMPLETED: 'test:completed',
  TEST_FAILED: 'test:failed',
  
  // 部署事件
  DEPLOYMENT_STARTED: 'deployment:started',
  DEPLOYMENT_COMPLETED: 'deployment:completed',
  DEPLOYMENT_FAILED: 'deployment:failed',
  
  // 故障事件
  FAULT_DETECTED: 'fault:detected',
  FAULT_REPAIRED: 'fault:repaired',
  ALERT_TRIGGERED: 'alert:triggered',
  
  // 监控事件
  METRICS_UPDATED: 'metrics:updated',
  HEALTH_STATUS_CHANGED: 'health:status-changed',
  
  // 工具事件
  TOOL_CONNECTED: 'tool:connected',
  TOOL_DISCONNECTED: 'tool:disconnected',
  TOOL_STATUS_CHANGED: 'tool:status-changed',
};

// 工具函数：创建标准事件
export function createStandardEvent(
  type: string,
  data: any,
  options: {
    source?: string;
    correlationId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    ttl?: number;
  } = {}
): Omit<DataEvent, 'timestamp'> {
  return {
    type,
    source: options.source || 'unknown',
    data,
    metadata: {
      correlationId: options.correlationId,
      priority: options.priority || 'medium',
      ttl: options.ttl,
    },
  };
}

// 工具函数：记录事件
export function logEvent(event: DataEvent, level: 'info' | 'warn' | 'error' = 'info'): void {
  const logLevels = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };
  
  logger.info(`${logLevels[level]} Event log: ${event.type}`);
  logger.info(`   Source: ${event.source}`);
  logger.info(`   Time: ${event.timestamp}`);
  
  if (event.metadata?.correlationId) {
    logger.info(`   Correlation ID: ${event.metadata.correlationId}`);
  }
  
  if (level === 'error' && event.data?.error) {
    logger.info(`   Error: ${event.data.error}`);
  }
}