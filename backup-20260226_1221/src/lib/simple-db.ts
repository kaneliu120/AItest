/**
 * 简化版数据库服务
 * 用于测试和开发环境
 */

// 内存数据库模拟
export class SimpleDatabase {
  private data: Record<string, any[]> = {};

  // 初始化表
  createTable(tableName: string): void {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
      console.log(`表 ${tableName} 已创建`);
    }
  }

  // 插入数据
  insert<T extends Record<string, any>>(tableName: string, data: T): string {
    this.createTable(tableName);
    
    const id = this.generateId();
    const record = { id, ...data, created_at: new Date().toISOString() };
    this.data[tableName].push(record);
    
    return id;
  }

  // 查询数据
  query<T = any>(tableName: string, where?: Record<string, any>): T[] {
    if (!this.data[tableName]) {
      return [];
    }

    let results = [...this.data[tableName]];

    if (where) {
      results = results.filter(record => {
        return Object.entries(where).every(([key, value]) => {
          return record[key] === value;
        });
      });
    }

    return results as T[];
  }

  // 更新数据
  update(tableName: string, data: Record<string, any>, where: Record<string, any>): number {
    if (!this.data[tableName]) {
      return 0;
    }

    let updatedCount = 0;
    this.data[tableName] = this.data[tableName].map(record => {
      const matches = Object.entries(where).every(([key, value]) => record[key] === value);
      
      if (matches) {
        updatedCount++;
        return { 
          ...record, 
          ...data, 
          updated_at: new Date().toISOString() 
        };
      }
      
      return record;
    });

    return updatedCount;
  }

  // 删除数据
  delete(tableName: string, where: Record<string, any>): number {
    if (!this.data[tableName]) {
      return 0;
    }

    const initialLength = this.data[tableName].length;
    this.data[tableName] = this.data[tableName].filter(record => {
      return !Object.entries(where).every(([key, value]) => record[key] === value);
    });

    return initialLength - this.data[tableName].length;
  }

  // 批量插入
  batchInsert<T extends Record<string, any>>(tableName: string, data: T[]): void {
    this.createTable(tableName);
    
    data.forEach(item => {
      this.insert(tableName, item);
    });
  }

  // 获取表统计
  getTableStats(tableName: string): { count: number; size: number } {
    if (!this.data[tableName]) {
      return { count: 0, size: 0 };
    }

    const count = this.data[tableName].length;
    const size = JSON.stringify(this.data[tableName]).length;
    
    return { count, size };
  }

  // 清空表
  clearTable(tableName: string): void {
    if (this.data[tableName]) {
      this.data[tableName] = [];
    }
  }

  // 导出数据
  exportData(): Record<string, any[]> {
    return { ...this.data };
  }

  // 导入数据
  importData(data: Record<string, any[]>): void {
    this.data = { ...data };
  }

  // 生成ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// 全局实例
export const simpleDb = new SimpleDatabase();

// 工具函数
export const dbUtils = {
  serializeJson(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('JSON序列化失败:', error);
      return '{}';
    }
  },
  
  parseJson<T = any>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.error('JSON反序列化失败:', error);
      return defaultValue;
    }
  },
  
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  getTimestamp(): string {
    return new Date().toISOString();
  },
};