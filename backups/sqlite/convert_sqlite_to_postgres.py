#!/usr/bin/env python3
import sqlite3
import psycopg2
import json
from datetime import datetime

# 连接SQLite
sqlite_conn = sqlite3.connect('data/tasks.db')
sqlite_cursor = sqlite_conn.cursor()

# 连接PostgreSQL
pg_conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="mission_control",
    user="mission_user",
    password="MissionControl2026!"
)
pg_cursor = pg_conn.cursor()

# 读取SQLite数据
sqlite_cursor.execute("SELECT * FROM tasks")
rows = sqlite_cursor.fetchall()
columns = [desc[0] for desc in sqlite_cursor.description]

print(f"找到 {len(rows)} 条任务记录")

# 插入到PostgreSQL
inserted_count = 0
for row in rows:
    try:
        # 转换数据格式
        row_dict = dict(zip(columns, row))
        
        # 处理tags字段 (JSON字符串 -> JSONB)
        tags = row_dict.get('tags', '[]')
        if isinstance(tags, str):
            try:
                tags_json = json.loads(tags)
            except:
                tags_json = []
        else:
            tags_json = tags if tags else []
        
        # 构建插入语句
        insert_sql = """
        INSERT INTO tasks (id, title, description, priority, status, 
                          created_at, updated_at, due_date, assigned_to, tags, source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING
        """
        
        pg_cursor.execute(insert_sql, (
            row_dict.get('id'),
            row_dict.get('title'),
            row_dict.get('description', ''),
            row_dict.get('priority', 'medium'),
            row_dict.get('status', 'pending'),
            row_dict.get('created_at'),
            row_dict.get('updated_at'),
            row_dict.get('due_date'),
            row_dict.get('assigned_to'),
            json.dumps(tags_json),
            row_dict.get('source', 'manual')
        ))
        
        inserted_count += 1
    except Exception as e:
        print(f"错误插入记录 {row_dict.get('id')}: {e}")

# 提交事务
pg_conn.commit()

print(f"成功插入 {inserted_count} 条记录到PostgreSQL")

# 关闭连接
sqlite_cursor.close()
sqlite_conn.close()
pg_cursor.close()
pg_conn.close()
