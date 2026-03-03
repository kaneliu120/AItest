/**
 * 简化版data库servervice
 * 用于Test和dev environment
 */

// 内存data库模拟
export class SimpleDatabase {
  private data: Record<string, any[]> = {};

  // Initialize表
  createTable(tableName: string): void {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
      console.log(`表 ${tableName} alreadyCreate`);
    }
  }

  // insertdata
  insert<T extends Record<string, any>>(tableName: string, data: T): string {
    this.createTable(tableName);
    
    const id = this.generateId();
    const record = { id, ...data, created_at: new Date().toISOString() };
    this.data[tableName].push(record);
    
    return id;
  }

  // 查询data
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

  // Updatedata
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

  // Deletedata
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

  // batchinsert
  batchInsert<T extends Record<string, any>>(tableName: string, data: T[]): void {
    this.createTable(tableName);
    
    data.forEach(item => {
      this.insert(tableName, item);
    });
  }

  // Fetch表Statistics
  getTableStats(tableName: string): { count: number; size: number } {
    if (!this.data[tableName]) {
      return { count: 0, size: 0 };
    }

    const count = this.data[tableName].length;
    const size = JSON.stringify(this.data[tableName]).length;
    
    return { count, size };
  }

  // Clear表
  clearTable(tableName: string): void {
    if (this.data[tableName]) {
      this.data[tableName] = [];
    }
  }

  // Exportdata
  exportData(): Record<string, any[]> {
    return { ...this.data };
  }

  // Importdata
  importData(data: Record<string, any[]>): void {
    this.data = { ...data };
  }

  // GenerateID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Global实例
export const simpleDb = new SimpleDatabase();

// Toolfunction
export const dbUtils = {
  serializeJson(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('JSONserializefailed:', error);
      return '{}';
    }
  },
  
  parseJson<T = any>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.error('JSONdeserializefailed:', error);
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