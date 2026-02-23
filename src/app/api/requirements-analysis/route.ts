import { NextRequest, NextResponse } from 'next/server';
import { SimpleDocumentParser, ParsedDocument } from '@/lib/requirements-analysis/simple-document-parser';
import { RequirementsAnalyzer, RequirementAnalysis } from '@/lib/requirements-analysis/requirements-analyzer';
import { DocumentGenerator, TechnicalDocument } from '@/lib/requirements-analysis/document-generator';

/**
 * 安全解析日期字符串
 */
const parseDate = (dateString: string): Date => {
  const timestamp = Date.parse(dateString);
  if (isNaN(timestamp)) {
    console.warn('Invalid date string:', dateString);
    return new Date();
  }
  return new Date(timestamp);
};


const documentParser = new SimpleDocumentParser();
const requirementsAnalyzer = new RequirementsAnalyzer();
const documentGenerator = new DocumentGenerator();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const textContent = formData.get('text') as string;
    const generateDocs = formData.get('generateDocs') === 'true';
    
    if (!file && !textContent) {
      return NextResponse.json(
        { error: '请提供文件或文本内容' },
        { status: 400 }
      );
    }
    
    let parsedDocument: ParsedDocument;
    
    if (file) {
      // 处理文件上传
      const buffer = Buffer.from(await file.arrayBuffer());
      parsedDocument = await documentParser.parseFile(buffer, file.name);
    } else {
      // 处理文本内容
      parsedDocument = await documentParser.parseFile(
        Buffer.from(textContent),
        'text-input.txt',
        textContent
      );
    }
    
    // 分析需求
    const analysis = await requirementsAnalyzer.analyzeDocument(parsedDocument);
    
    // 生成技术文档（如果请求）
    let documents: Record<string, TechnicalDocument> = {};
    if (generateDocs) {
      documents = documentGenerator.generateAllDocuments(analysis);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        document: parsedDocument,
        analysis: analysis,
        documents: generateDocs ? documents : undefined,
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        documentSize: parsedDocument.metadata.size,
        wordCount: parsedDocument.metadata.wordCount,
        documentsGenerated: generateDocs,
      },
    });
    
  } catch (error) {
    console.error('需求分析错误:', error);
    return NextResponse.json(
      { 
        error: '需求分析失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  if (action === 'status') {
    return NextResponse.json({
      success: true,
      data: {
        service: 'requirements-analysis',
        status: 'healthy',
        version: '1.0.0',
        capabilities: ['document-parsing', 'requirement-analysis', 'tech-stack-recommendation'],
        supportedFormats: ['txt', 'md', 'html', 'docx', 'pdf', 'text'],
      },
    });
  }
  
  return NextResponse.json({
    success: true,
    data: {
      message: '需求分析API',
      endpoints: {
        POST: '/api/requirements-analysis - 分析需求文档',
        GET: '/api/requirements-analysis?action=status - 获取服务状态',
      },
      usage: '上传文件或提供文本内容进行需求分析',
    },
  });
}