// Data Bus - Module间data通信
import { EventEmitter } from 'events';

export interface DataMessage {
  id: string;
  type: string;
  source: string;
  destination?: string; // iffornull, 广播给所AllModule
  timestamp: string;
  payload: unknown;
  metadata?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number; // 生存time(毫s)
    retryCount?: number;
    correlationId?: string;
  };
}

export interface DataChannel {
  name: string;
  description: string;
  subscribers: string[]; // ModuleIDArray
  messageCount: number;
  lastMessage?: string;
}

export interface DataBusStats {
  totalMessages: number;
  messagesByType: Record<string, number>;
  activeChannels: number;
  moduleConnections: number;
  errorRate: number;
  averageLatency: number;
}

export class DataBus {
  private emitter: EventEmitter;
  private channels: Map<string, DataChannel>;
  private messages: Map<string, DataMessage>;
  private stats: DataBusStats;
  private moduleConnections: Map<string, Set<string>>; // ModuleID -> 订阅'sChannel
  
  constructor() {
    this.emitter = new EventEmitter();
    this.channels = new Map();
    this.messages = new Map();
    this.moduleConnections = new Map();
    
    this.stats = {
      totalMessages: 0,
      messagesByType: {},
      activeChannels: 0,
      moduleConnections: 0,
      errorRate: 0,
      averageLatency: 0
    };
    
    // CreateDefaultChannel
    this.createChannel('system', 'SystemMessageChannel');
    this.createChannel('module-events', 'ModuleEventChannel');
    this.createChannel('task-events', 'TaskEventChannel');
    this.createChannel('error-events', 'errorEventChannel');
  }
  
  // CreateNewChannel
  createChannel(name: string, description: string): DataChannel {
    const channel: DataChannel = {
      name,
      description,
      subscribers: [],
      messageCount: 0,
      lastMessage: undefined
    };
    
    this.channels.set(name, channel);
    this.stats.activeChannels = this.channels.size;
    
    return channel;
  }
  
  // DeleteChannel
  deleteChannel(name: string): boolean {
    const channel = this.channels.get(name);
    if (!channel) return false;
    
    // Notification所All订阅者
    for (const moduleId of channel.subscribers) {
      this.unsubscribe(moduleId, name);
    }
    
    this.channels.delete(name);
    this.stats.activeChannels = this.channels.size;
    
    return true;
  }
  
  // Module订阅Channel
  subscribe(moduleId: string, channelName: string): boolean {
    const channel = this.channels.get(channelName);
    if (!channel) return false;
    
    // Checkwhether italready订阅
    if (channel.subscribers.includes(moduleId)) {
      return true; // already经订阅
    }
    
    // Add订阅者
    channel.subscribers.push(moduleId);
    
    // UpdateModuleConnect
    if (!this.moduleConnections.has(moduleId)) {
      this.moduleConnections.set(moduleId, new Set());
    }
    this.moduleConnections.get(moduleId)!.add(channelName);
    this.stats.moduleConnections = this.moduleConnections.size;
    
    return true;
  }
  
  // ModuleCancelled订阅
  unsubscribe(moduleId: string, channelName: string): boolean {
    const channel = this.channels.get(channelName);
    if (!channel) return false;
    
    // remove订阅者
    const index = channel.subscribers.indexOf(moduleId);
    if (index === -1) return false;
    
    channel.subscribers.splice(index, 1);
    
    // UpdateModuleConnect
    const moduleChannels = this.moduleConnections.get(moduleId);
    if (moduleChannels) {
      moduleChannels.delete(channelName);
      if (moduleChannels.size === 0) {
        this.moduleConnections.delete(moduleId);
      }
    }
    this.stats.moduleConnections = this.moduleConnections.size;
    
    return true;
  }
  
  // SendMessage
  sendMessage(message: Omit<DataMessage, 'id' | 'timestamp'>): string {
    const fullMessage: DataMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    // 存储Message
    this.messages.set(fullMessage.id, fullMessage);
    
    // UpdateStatistics
    this.stats.totalMessages++;
    this.stats.messagesByType[fullMessage.type] = 
      (this.stats.messagesByType[fullMessage.type] || 0) + 1;
    
    // Sendto指定Channelor广播
    if (fullMessage.destination) {
      // 点for点Message
      this.emitter.emit(`message:${fullMessage.destination}`, fullMessage);
    } else {
      // 广播Message
      this.emitter.emit('message:broadcast', fullMessage);
      
      // 同时Sendto特定Type'sEvent
      this.emitter.emit(`message:type:${fullMessage.type}`, fullMessage);
    }
    
    // UpdateChannelStatistics
    if (fullMessage.type.includes(':')) {
      const [channelType] = fullMessage.type.split(':');
      const channel = this.channels.get(channelType);
      if (channel) {
        channel.messageCount++;
        channel.lastMessage = fullMessage.timestamp;
      }
    }
    
    return fullMessage.id;
  }
  
  // ReceiveMessage(回调方式)
  onMessage(moduleId: string, callback: (message: DataMessage) => void): void {
    this.emitter.on(`message:${moduleId}`, callback);
    this.emitter.on('message:broadcast', callback);
  }
  
  // Receive特定TypeMessage
  onMessageType(type: string, callback: (message: DataMessage) => void): void {
    this.emitter.on(`message:type:${type}`, callback);
  }
  
  // removeMessage监听器
  offMessage(moduleId: string, callback: (message: DataMessage) => void): void {
    this.emitter.off(`message:${moduleId}`, callback);
    this.emitter.off('message:broadcast', callback);
  }
  
  // remove特定TypeMessage监听器
  offMessageType(type: string, callback: (message: DataMessage) => void): void {
    this.emitter.off(`message:type:${type}`, callback);
  }
  
  // Request-Response模式
  async request<T = unknown>(
    source: string,
    destination: string,
    type: string,
    payload: unknown,
    timeout: number = 30000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let timeoutId: NodeJS.Timeout;
      
      // SettingsResponse监听器
      const responseHandler = (response: DataMessage) => {
        if (response.metadata?.correlationId === correlationId) {
          clearTimeout(timeoutId);
          this.offMessage(source, responseHandler);
          resolve(response.payload as T);
        }
      };
      
      // SettingsTimeout
      timeoutId = setTimeout(() => {
        this.offMessage(source, responseHandler);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
      
      // 监听Response
      this.onMessage(source, responseHandler);
      
      // SendRequest
      this.sendMessage({
        type,
        source,
        destination,
        payload,
        metadata: {
          correlationId,
          priority: 'normal'
        }
      });
    });
  }
  
  // ResponseRequest
  respond(
    source: string,
    destination: string,
    correlationId: string,
    payload: unknown
  ): string {
    return this.sendMessage({
      type: 'response',
      source,
      destination,
      payload,
      metadata: {
        correlationId,
        priority: 'normal'
      }
    });
  }
  
  // 获Cancelled息历史
  getMessageHistory(options: {
    type?: string;
    source?: string;
    destination?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
  } = {}): DataMessage[] {
    const {
      type,
      source,
      destination,
      startTime,
      endTime,
      limit = 100
    } = options;
    
    let messages = Array.from(this.messages.values());
    
    // filter
    if (type) {
      messages = messages.filter(msg => msg.type === type);
    }
    if (source) {
      messages = messages.filter(msg => msg.source === source);
    }
    if (destination) {
      messages = messages.filter(msg => msg.destination === destination);
    }
    if (startTime) {
      const start = new Date(startTime);
      messages = messages.filter(msg => new Date(msg.timestamp) >= start);
    }
    if (endTime) {
      const end = new Date(endTime);
      messages = messages.filter(msg => new Date(msg.timestamp) <= end);
    }
    
    // bytime倒序Sort
    messages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // 限制quantity
    return messages.slice(0, limit);
  }
  
  // FetchChannelinformation
  getChannel(name: string): DataChannel | undefined {
    return this.channels.get(name);
  }
  
  // Fetch所AllChannel
  getAllChannels(): DataChannel[] {
    return Array.from(this.channels.values());
  }
  
  // FetchModule订阅'sChannel
  getModuleChannels(moduleId: string): string[] {
    const channels = this.moduleConnections.get(moduleId);
    return channels ? Array.from(channels) : [];
  }
  
  // FetchStatisticsinformation
  getStats(): DataBusStats {
    // 计算平均latency(模拟)
    const totalMessages = this.stats.totalMessages;
    if (totalMessages > 0) {
      this.stats.averageLatency = 5 + Math.random() * 10; // 5-15ms 模拟latency
      this.stats.errorRate = 0.1 + Math.random() * 0.5; // 0.1-0.6% error率
    }
    
    return { ...this.stats };
  }
  
  // 清理OldMessage
  cleanupOldMessages(maxAgeHours: number = 24): {
    deleted: number;
    kept: number;
  } {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);
    
    let deleted = 0;
    let kept = 0;
    
    for (const [id, message] of this.messages.entries()) {
      const messageTime = new Date(message.timestamp);
      
      if (messageTime < cutoffTime) {
        this.messages.delete(id);
        deleted++;
      } else {
        kept++;
      }
    }
    
    return { deleted, kept };
  }
  
  // ExportData BusStatus
  exportState(): string {
    const state = {
      channels: this.getAllChannels(),
      moduleConnections: Array.from(this.moduleConnections.entries()).map(
        ([moduleId, channels]) => ({
          moduleId,
          channels: Array.from(channels)
        })
      ),
      stats: this.getStats(),
      recentMessages: this.getMessageHistory({ limit: 100 }),
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };
    
    return JSON.stringify(state, null, 2);
  }
  
  // ImportData BusStatus
  importState(stateJson: string): {
    success: boolean;
    imported: {
      channels: number;
      connections: number;
      messages: number;
    };
    errors?: string[];
  } {
    try {
      const state = JSON.parse(stateJson);
      
      // ValidatedataFormat
      if (!state.channels || !Array.isArray(state.channels)) {
        return {
          success: false,
          imported: { channels: 0, connections: 0, messages: 0 },
          errors: ['Invalid state format: missing channels array']
        };
      }
      
      let importedChannels = 0;
      let importedConnections = 0;
      let importedMessages = 0;
      const errors: string[] = [];
      
      // ImportChannel
      for (const channel of state.channels) {
        try {
          this.createChannel(channel.name, channel.description);
          importedChannels++;
        } catch (error) {
          errors.push(`Failed to import channel ${channel.name}: ${error}`);
        }
      }
      
      // ImportModuleConnect
      if (state.moduleConnections && Array.isArray(state.moduleConnections)) {
        for (const connection of state.moduleConnections) {
          try {
            if (connection.moduleId && connection.channels) {
              for (const channelName of connection.channels) {
                this.subscribe(connection.moduleId, channelName);
              }
              importedConnections++;
            }
          } catch (error) {
            errors.push(`Failed to import connection for module ${connection.moduleId}: ${error}`);
          }
        }
      }
      
      // ImportMessage(Optional)
      if (state.recentMessages && Array.isArray(state.recentMessages)) {
        for (const message of state.recentMessages) {
          try {
            this.messages.set(message.id, message);
            importedMessages++;
          } catch (error) {
            // 忽略MessageImporterror
          }
        }
      }
      
      return {
        success: errors.length === 0,
        imported: {
          channels: importedChannels,
          connections: importedConnections,
          messages: importedMessages
        },
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        imported: { channels: 0, connections: 0, messages: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}