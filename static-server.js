/**
 * 静态文件服务器
 * 提供Mission Control前端界面
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME类型映射
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.md': 'text/markdown'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    
    // 解析URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // 默认页面
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // 构建文件路径
    const filePath = path.join(PUBLIC_DIR, pathname);
    const extname = path.extname(filePath).toLowerCase();
    
    // 设置Content-Type
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // 读取文件
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在，返回404
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>', 'utf8');
            } else {
                // 服务器错误
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // 成功返回文件
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`🚀 静态文件服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 静态文件目录: ${PUBLIC_DIR}`);
    console.log(`🔗 前端界面: http://localhost:${PORT}/index.html`);
    console.log(`🔗 API服务器: http://localhost:3001`);
    console.log(`📊 健康检查: http://localhost:3001/api/health`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});