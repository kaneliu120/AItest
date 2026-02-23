/**
 * 简化版文档解析服务
 * 支持: TXT, MD, HTML (基础), 纯文本
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export interface ParsedDocument {
  id: string;
  filename: string;
  fileType: 'txt' | 'md' | 'html' | 'text';
  content: string;
  metadata: {
    size: number;
    wordCount: number;
    characters: number;
    extractedAt: string;
  };
  sections?: Array<{
    title: string;
    content: string;
    level: number;
  }>;
  rawText: string;
}

export class SimpleDocumentParser {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'requirements');
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * 解析上传的文件
   */
  async parseFile(fileBuffer: Buffer, filename: string, originalContent?: string): Promise<ParsedDocument> {
    const fileType = this.getFileType(filename);
    const fileSize = fileBuffer.length;
    const fileId = createHash('md5').update(fileBuffer).digest('hex');

    let content = '';
    let sections: Array<{ title: string; content: string; level: number }> = [];

    try {
      switch (fileType) {
        case 'txt':
        case 'md':
        case 'html':
          content = fileBuffer.toString('utf-8');
          sections = this.extractSectionsFromText(content);
          break;

        case 'text':
          content = originalContent || '';
          sections = this.extractSectionsFromText(content);
          break;

        default:
          // 对于不支持的类型，尝试作为文本处理
          content = fileBuffer.toString('utf-8').substring(0, 10000);
          sections = this.extractSectionsFromText(content);
      }
    } catch (error) {
      console.error(`Error parsing file ${filename}:`, error);
      // 如果解析失败，使用原始文本
      content = fileBuffer.toString('utf-8').substring(0, 10000);
    }

    // 计算文档统计信息
    const wordCount = this.countWords(content);
    const characters = content.length;

    return {
      id: fileId,
      filename,
      fileType,
      content,
      metadata: {
        size: fileSize,
        wordCount,
        characters,
        extractedAt: new Date().toISOString(),
      },
      sections,
      rawText: content,
    };
  }

  /**
   * 从文本中提取章节
   */
  private extractSectionsFromText(text: string): Array<{ title: string; content: string; level: number }> {
    const sections: Array<{ title: string; content: string; level: number }> = [];
    const lines = text.split('\n');
    
    let currentSection: { title: string; content: string; level: number } | null = null;
    let contentBuffer: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检测标题 (以#开头)
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        // 保存前一个章节
        if (currentSection) {
          currentSection.content = contentBuffer.join('\n').trim();
          sections.push(currentSection);
        }

        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();
        
        currentSection = { title, content: '', level };
        contentBuffer = [];
      } else if (currentSection) {
        contentBuffer.push(line);
      }
    }

    // 保存最后一个章节
    if (currentSection && contentBuffer.length > 0) {
      currentSection.content = contentBuffer.join('\n').trim();
      sections.push(currentSection);
    }

    // 如果没有检测到章节，创建单个章节
    if (sections.length === 0 && text.trim().length > 0) {
      sections.push({
        title: '主要内容',
        content: text.trim(),
        level: 1,
      });
    }

    return sections;
  }

  /**
   * 获取文件类型
   */
  private getFileType(filename: string): ParsedDocument['fileType'] {
    const ext = path.extname(filename).toLowerCase();
    
    switch (ext) {
      case '.txt':
        return 'txt';
      case '.md':
      case '.markdown':
        return 'md';
      case '.html':
      case '.htm':
        return 'html';
      default:
        // 如果没有扩展名或未知扩展名，作为文本处理
        return 'text';
    }
  }

  /**
   * 统计单词数
   */
  private countWords(text: string): number {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  /**
   * 保存上传的文件
   */
  async saveUploadedFile(buffer: Buffer, filename: string): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * 清理临时文件
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }
}