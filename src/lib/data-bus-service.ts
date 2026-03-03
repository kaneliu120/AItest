import { logger } from './logger';
/**
 * Data Busservervice
 * standard化Module间data传递
 */

export interface DataEvent {
  type: string;
  source: string;
  timestamp: string;
  data: any;
  metadata?: {
    correlationId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    ttl?: number; // 生存time(毫s)
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
  defaultTTL: number; // Default生存time(毫s)
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

class DataBusservervice {
  private handlers: Map<string, Map<string, EventHandler>> = new Map();
  private eventQueue: DataEvent[] = [];
  private metrics: DataBusMetrics;
  private config: DataBusConfig;
  private processorIntervalId?: ReturnType<typeof setInterval>;

  constructor(config: Partial<DataBusConfig> = {}) {
    this.config = {
      maxQueueSize: 1000,
      defaultTTL: 60000, // 1min
      retryAttempts: 3,
      retryDelay: 1000, // 1s
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

    // StartEventProcess器
    this.startEventProcessor();
  }

  /**
   * ReleaseEvent
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

    // CheckEventwhether itexpired
    if (this.isEventExpired(fullEvent)) {
      if (this.config.enableLogging) {
        logger.warn(`Eventalreadyexpired, 跳过Release: ${fullEvent.type}`);
      }
      return;
    }

    // AddtoQueue
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      // remove最Old'sEvent
      this.eventQueue.shift();
    }

    this.eventQueue.push(fullEvent);
    this.metrics.eventsPublished++;
    this.metrics.queueSize = this.eventQueue.length;

    if (this.config.enableLogging) {
      logger.info(`📤 ReleaseEvent: ${fullEvent.type} (来源: ${fullEvent.source})`);
    }
  }

  /**
   * 订阅Event
   */
  subscribe(eventType: string, handler: EventHandler): Subscription {
    const handlerId = `handler-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Map());
    }

    this.handlers.get(eventType)!.set(handlerId, handler);
    this.metrics.activeSubscriptions++;

    if (this.config.enableLogging) {
      logger.info(`📥 订阅Event: ${eventType} (Process器: ${handlerId})`);
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
            logger.info(`📭 Cancelled订阅: ${eventType} (Process器: ${handlerId})`);
          }
        }
      },
      eventType,
      handlerId,
    };
  }

  /**
   * Request-Response模式
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
    const timeout = options.timeout || 10000; // Default10sTimeout

    return new Promise((resolve, reject) => {
      const responseEventType = `${eventType}:response:${correlationId}`;
      
      // SettingsTimeout
      const timeoutId = setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error(`RequestTimeout: ${eventType}`));
      }, timeout);

      // 订阅ResponseEvent
      const subscription = this.subscribe(responseEventType, (responseEvent) => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        
        if (responseEvent.data?.error) {
          reject(new Error(responseEvent.data.error));
        } else {
          resolve(responseEvent.data);
        }
      });

      // ReleaseRequestEvent
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
   * ResponseRequest
   */
  async respond(
    eventType: string,
    handler: (request: DataEvent) => Promise<any> | any
  ): Promise<Subscription> {
    return this.subscribe(eventType, async (requestEvent) => {
      const correlationId = requestEvent.metadata?.correlationId;
      
      if (!correlationId) {
        logger.warn(`RequestEventMissing correlationId: ${eventType}`);
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
   * Fetchmetricsdata
   */
  getMetrics(): DataBusMetrics {
    return { ...this.metrics };
  }

  /**
   * FetchConfiguration
   */
  getConfig(): DataBusConfig {
    return { ...this.config };
  }

  /**
   * UpdateConfiguration
   */
  updateConfig(newConfig: Partial<DataBusConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * ClearQueue
   */
  clearQueue(): void {
    this.eventQueue = [];
    this.metrics.queueSize = 0;
  }

  /**
   * FetchActive订阅
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
   * Privatemethod: StartEventProcess器
   */
  private startEventProcessor(): void {
    this.processorIntervalId = setInterval(() => {
      this.processEventQueue();
    }, 100); // 每100毫sProcess一 times
  }

  stopEventProcessor(): void {
    if (this.processorIntervalId !== undefined) {
      clearInterval(this.processorIntervalId);
      this.processorIntervalId = undefined;
    }
  }

  /**
   * Privatemethod: ProcessEventQueue
   */
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const event = this.eventQueue.shift()!;
    this.metrics.queueSize = this.eventQueue.length;

    // CheckEventwhether itexpired
    if (this.isEventExpired(event)) {
      if (this.config.enableLogging) {
        logger.warn(`跳过expiredEvent: ${event.type}`);
      }
      return;
    }

    const startTime = Date.now();
    const handlers = this.handlers.get(event.type);

    if (!handlers || handlers.size === 0) {
      if (this.config.enableLogging) {
        logger.warn(`没AllProcess器订阅Event: ${event.type}`);
      }
      return;
    }

    // and行Execute所AllProcess器
    const handlerPromises = Array.from(handlers.values()).map(async (handler, index) => {
      try {
        await handler(event);
        return { success: true, index };
      } catch (error) {
        logger.error(`EventProcess器error (${event.type}):`, error);
        return { success: false, index, error };
      }
    });

    const results = await Promise.all(handlerPromises);
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Updatemetrics
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
      logger.info(`📨 ProcessEvent: ${event.type} (${handlers.size} Process器, ${processingTime}ms)`);
    }
  }

  /**
   * Privatemethod: CheckEventwhether itexpired
   */
  private isEventExpired(event: DataEvent): boolean {
    const ttl = event.metadata?.ttl || this.config.defaultTTL;
    const eventTime = new Date(event.timestamp).getTime();
    const currentTime = Date.now();
    
    return currentTime - eventTime > ttl;
  }
}

// CreateGlobalData Bus实例
export const dataBusservervice = new DataBusservervice({
  enableLogging: true,
  enableMetrics: true,
  maxQueueSize: 500,
  defaultTTL: 30000, // 30s
});

// standardEventType定义
export const StandardEventTypes = {
  // SystemEvent
  SYSTEM_START: 'system:start',
  SYSTEM_STOP: 'system:stop',
  SYSTEM_HEALTH_CHECK: 'system:health-check',
  
  // ProjectEvent
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_COMPLETED: 'project:completed',
  
  // DevelopmentEvent
  DEVELOPMENT_STARTED: 'development:started',
  CODE_GENERATED: 'code:generated',
  CODE_REVIEWED: 'code:reviewed',
  
  // TestEvent
  TEST_STARTED: 'test:started',
  TEST_COMPLETED: 'test:completed',
  TEST_FAILED: 'test:failed',
  
  // DeploymentEvent
  DEPLOYMENT_STARTED: 'deployment:started',
  DEPLOYMENT_COMPLETED: 'deployment:completed',
  DEPLOYMENT_FAILED: 'deployment:failed',
  
  // 故障Event
  FAULT_DETECTED: 'fault:detected',
  FAULT_REPAIRED: 'fault:repaired',
  ALERT_TRIGGERED: 'alert:triggered',
  
  // MonitoringEvent
  METRICS_UPDATED: 'metrics:updated',
  HEALTH_STATUS_CHANGED: 'health:status-changed',
  
  // ToolEvent
  TOOL_CONNECTED: 'tool:connected',
  TOOL_DISCONNECTED: 'tool:disconnected',
  TOOL_STATUS_CHANGED: 'tool:status-changed',
};

// Toolfunction: CreatestandardEvent
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

// Toolfunction: LogEvent
export function logEvent(event: DataEvent, level: 'info' | 'warn' | 'error' = 'info'): void {
  const logLevels = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };
  
  logger.info(`${logLevels[level]} EventLogging: ${event.type}`);
  logger.info(`   来源: ${event.source}`);
  logger.info(`   time: ${event.timestamp}`);
  
  if (event.metadata?.correlationId) {
    logger.info(`   Off联ID: ${event.metadata.correlationId}`);
  }
  
  if (level === 'error' && event.data?.error) {
    logger.info(`   error: ${event.data.error}`);
  }
}