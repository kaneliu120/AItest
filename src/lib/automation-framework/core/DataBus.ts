// 数据总线 - 模块间数据通信
import { EventEmitter } from 'events';

export interface DataMessage {
  id: string;
  type: string;
  source: string;
  destination?: string; // if empty, broadcast to all modules
  timestamp: string;
  payload: unknown;
  metadata?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number; // time-to-live (ms)
    retryCount?: number;
    correlationId?: string;
  };
}

export interface DataChannel {
  name: string;
  description: string;
  subscribers: string[]; // module ID array
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
  private moduleConnections: Map<string, Set<string>>; // module ID -> subscribed channels
  
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
    
    // 创建默认频道
    this.createChannel('system', 'System messages channel');
    this.createChannel('module-events', 'Module events channel');
    this.createChannel('task-events', 'Task events channel');
    this.createChannel('error-events', 'Error events channel');
  }
  
  // 创建新频道
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
  
  // 删除频道
  deleteChannel(name: string): boolean {
    const channel = this.channels.get(name);
    if (!channel) return false;
    
    // 通知所有订阅者
    for (const moduleId of channel.subscribers) {
      this.unsubscribe(moduleId, name);
    }
    
    this.channels.delete(name);
    this.stats.activeChannels = this.channels.size;
    
    return true;
  }
  
  // 模块订阅频道
  subscribe(moduleId: string, channelName: string): boolean {
    const channel = this.channels.get(channelName);
    if (!channel) return false;
    
    // 检查是否已订阅
    if (channel.subscribers.includes(moduleId)) {
      return true; // already subscribed
    }
    
    // 添加订阅者
    channel.subscribers.push(moduleId);
    
    // 更新模块连接
    if (!this.moduleConnections.has(moduleId)) {
      this.moduleConnections.set(moduleId, new Set());
    }
    this.moduleConnections.get(moduleId)!.add(channelName);
    this.stats.moduleConnections = this.moduleConnections.size;
    
    return true;
  }
  
  // 模块取消订阅
  unsubscribe(moduleId: string, channelName: string): boolean {
    const channel = this.channels.get(channelName);
    if (!channel) return false;
    
    // 移除订阅者
    const index = channel.subscribers.indexOf(moduleId);
    if (index === -1) return false;
    
    channel.subscribers.splice(index, 1);
    
    // 更新模块连接
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
  
  // 发送消息
  sendMessage(message: Omit<DataMessage, 'id' | 'timestamp'>): string {
    const fullMessage: DataMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    // 存储消息
    this.messages.set(fullMessage.id, fullMessage);
    
    // 更新统计
    this.stats.totalMessages++;
    this.stats.messagesByType[fullMessage.type] = 
      (this.stats.messagesByType[fullMessage.type] || 0) + 1;
    
    // 发送到指定频道或广播
    if (fullMessage.destination) {
      // 点对点消息
      this.emitter.emit(`message:${fullMessage.destination}`, fullMessage);
    } else {
      // 广播消息
      this.emitter.emit('message:broadcast', fullMessage);
      
      // 同时发送到特定类型的事件
      this.emitter.emit(`message:type:${fullMessage.type}`, fullMessage);
    }
    
    // 更新频道统计
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
  
  // 接收消息（回调方式）
  onMessage(moduleId: string, callback: (message: DataMessage) => void): void {
    this.emitter.on(`message:${moduleId}`, callback);
    this.emitter.on('message:broadcast', callback);
  }
  
  // 接收特定类型消息
  onMessageType(type: string, callback: (message: DataMessage) => void): void {
    this.emitter.on(`message:type:${type}`, callback);
  }
  
  // 移除消息监听器
  offMessage(moduleId: string, callback: (message: DataMessage) => void): void {
    this.emitter.off(`message:${moduleId}`, callback);
    this.emitter.off('message:broadcast', callback);
  }
  
  // 移除特定类型消息监听器
  offMessageType(type: string, callback: (message: DataMessage) => void): void {
    this.emitter.off(`message:type:${type}`, callback);
  }
  
  // 请求-响应模式
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
      
      // 设置响应监听器
      const responseHandler = (response: DataMessage) => {
        if (response.metadata?.correlationId === correlationId) {
          clearTimeout(timeoutId);
          this.offMessage(source, responseHandler);
          resolve(response.payload as T);
        }
      };
      
      // 设置超时
      timeoutId = setTimeout(() => {
        this.offMessage(source, responseHandler);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
      
      // 监听响应
      this.onMessage(source, responseHandler);
      
      // 发送请求
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
  
  // 响应请求
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
  
  // 获取消息历史
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
    
    // 按时间倒序排序
    messages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // 限制数量
    return messages.slice(0, limit);
  }
  
  // 获取频道信息
  getChannel(name: string): DataChannel | undefined {
    return this.channels.get(name);
  }
  
  // 获取所有频道
  getAllChannels(): DataChannel[] {
    return Array.from(this.channels.values());
  }
  
  // 获取模块订阅的频道
  getModuleChannels(moduleId: string): string[] {
    const channels = this.moduleConnections.get(moduleId);
    return channels ? Array.from(channels) : [];
  }
  
  // Get statistics信息
  getStats(): DataBusStats {
    // 计算平均延迟（模拟）
    const totalMessages = this.stats.totalMessages;
    if (totalMessages > 0) {
      this.stats.averageLatency = 5 + Math.random() * 10; // 5-15ms simulated latency
      this.stats.errorRate = 0.1 + Math.random() * 0.5; // 0.1-0.6% error rate
    }
    
    return { ...this.stats };
  }
  
  // 清理旧消息
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
  
  // 导出数据总线状态
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
  
  // 导入数据总线状态
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
      
      // 验证数据格式
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
      
      // 导入频道
      for (const channel of state.channels) {
        try {
          this.createChannel(channel.name, channel.description);
          importedChannels++;
        } catch (error) {
          errors.push(`Failed to import channel ${channel.name}: ${error}`);
        }
      }
      
      // 导入模块连接
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
      
      // 导入消息（可选）
      if (state.recentMessages && Array.isArray(state.recentMessages)) {
        for (const message of state.recentMessages) {
          try {
            this.messages.set(message.id, message);
            importedMessages++;
          } catch (error) {
            // 忽略消息导入错误
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