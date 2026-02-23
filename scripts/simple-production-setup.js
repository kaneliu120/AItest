#!/usr/bin/env node

/**
 * 简化生产环境设置
 * 基于WORKFLOW_AUTO.md晚间主动推进授权
 * 使用现有开发服务器作为生产环境，配置生产优化
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('='.repeat(80));
console.log('🚀 简化生产环境设置');
console.log('='.repeat(80));
console.log('时间: ' + new Date().toLocaleString('zh-CN'));
console.log('授权: ✅ 基于WORKFLOW_AUTO.md晚间主动推进授权');
console.log('策略: 使用现有开发服务器 + 生产优化配置');
console.log('='.repeat(80));

// 检查当前运行的服务
function checkRunningServices() {
  console.log('\n🔍 检查当前运行的服务...');
  
  const services = [
    { name: 'Mission Control', port: 3001, url: 'http://localhost:3001' },
    { name: '知识管理系统前端', port: 3000, url: 'http://localhost:3000' },
    { name: '知识管理系统后端', port: 8000, url: 'http://localhost:8000' }
  ];
  
  const results = [];
  
  services.forEach(service => {
    try {
      execSync(`curl -s --connect-timeout 3 ${service.url} > /dev/null`, { stdio: 'pipe' });
      console.log(`   ✅ ${service.name}: 运行中 (端口: ${service.port})`);
      results.push({ ...service, status: 'running' });
    } catch (error) {
      console.log(`   ❌ ${service.name}: 未运行 (端口: ${service.port})`);
      results.push({ ...service, status: 'stopped' });
    }
  });
  
  return results;
}

// 创建生产优化配置
function createProductionOptimization() {
  console.log('\n🔧 创建生产优化配置...');
  
  // 1. Nginx反向代理配置
  const nginxConfig = `# 生产环境Nginx配置
events {
    worker_connections 1024;
}

http {
    # 基础设置
    include       mime.types;
    default_type  application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    # 访问日志
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss 
               application/json application/atom+xml image/svg+xml;
    
    # 上传限制
    client_max_body_size 50M;
    
    # Mission Control服务
    server {
        listen 80;
        server_name localhost;
        
        location / {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # API端点缓存
        location ~ ^/api/ {
            proxy_pass http://localhost:3001;
            proxy_cache api_cache;
            proxy_cache_key "$scheme$request_method$host$request_uri";
            proxy_cache_valid 200 302 10m;
            proxy_cache_valid 404 1m;
            add_header X-Cache-Status $upstream_cache_status;
        }
        
        # 静态文件缓存
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            proxy_pass http://localhost:3001;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 知识管理系统服务
    server {
        listen 8080;
        server_name knowledge.localhost;
        
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
        
        location /api/ {
            proxy_pass http://localhost:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    
    # 缓存配置
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m 
                     max_size=1g inactive=60m use_temp_path=off;
}`;

  const nginxPath = '/Users/kane/mission-control/nginx/production.conf';
  const nginxDir = path.dirname(nginxPath);
  if (!fs.existsSync(nginxDir)) {
    fs.mkdirSync(nginxDir, { recursive: true });
  }
  fs.writeFileSync(nginxPath, nginxConfig);
  console.log(`   ✅ Nginx配置: ${nginxPath}`);
  
  // 2. PM2生产进程管理配置
  const pm2Config = {
    apps: [
      {
        name: 'mission-control',
        script: 'npm',
        args: 'run start',
        cwd: '/Users/kane/mission-control',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
          NODE_ENV: 'production',
          PORT: 3001
        },
        max_memory_restart: '1G',
        watch: false,
        merge_logs: true,
        error_file: '/Users/kane/mission-control/logs/error.log',
        out_file: '/Users/kane/mission-control/logs/out.log',
        log_file: '/Users/kane/mission-control/logs/combined.log',
        time: true
      },
      {
        name: 'knowledge-frontend',
        script: 'npm',
        args: 'run dev',
        cwd: '/Users/kane/knowledge-management-system/frontend',
        instances: 1,
        env: {
          NODE_ENV: 'production',
          PORT: 3000
        },
        max_memory_restart: '500M',
        watch: false,
        error_file: '/Users/kane/knowledge-management-system/logs/frontend-error.log',
        out_file: '/Users/kane/knowledge-management-system/logs/frontend-out.log'
      },
      {
        name: 'knowledge-backend',
        script: 'python',
        args: 'main_fixed.py',
        cwd: '/Users/kane/knowledge-management-system/backend',
        interpreter: 'python3',
        instances: 1,
        env: {
          FASTAPI_ENV: 'production',
          PORT: 8000
        },
        max_memory_restart: '500M',
        watch: false,
        error_file: '/Users/kane/knowledge-management-system/logs/backend-error.log',
        out_file: '/Users/kane/knowledge-management-system/logs/backend-out.log'
      }
    ]
  };

  const pm2Path = '/Users/kane/mission-control/pm2.config.json';
  fs.writeFileSync(pm2Path, JSON.stringify(pm2Config, null, 2));
  console.log(`   ✅ PM2配置: ${pm2Path}`);
  
  // 3. 生产环境启动脚本
  const startupScript = `#!/bin/bash

# 生产环境启动脚本
# 基于WORKFLOW_AUTO.md晚间主动推进授权

echo "🚀 启动生产环境"
echo "时间: \$(date)"
echo "=".repeat(60)

# 创建日志目录
mkdir -p /Users/kane/mission-control/logs
mkdir -p /Users/kane/knowledge-management-system/logs

# 安装PM2（如果未安装）
if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    npm install -g pm2
fi

# 启动Mission Control
echo "启动Mission Control..."
cd /Users/kane/mission-control
pm2 start pm2.config.json --only mission-control

# 启动知识管理系统前端
echo "启动知识管理系统前端..."
cd /Users/kane/knowledge-management-system/frontend
pm2 start pm2.config.json --only knowledge-frontend

# 启动知识管理系统后端
echo "启动知识管理系统后端..."
cd /Users/kane/knowledge-management-system/backend
pm2 start pm2.config.json --only knowledge-backend

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "🔍 检查服务状态..."

SERVICES=(
    "Mission Control:3001"
    "知识管理前端:3000"
    "知识管理后端:8000"
)

for service in "\${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "\$service"
    
    if curl -s --connect-timeout 5 "http://localhost:\$port" > /dev/null 2>&1 || \\
       curl -s --connect-timeout 5 "http://localhost:\$port/health" > /dev/null 2>&1; then
        echo "✅ \$name 运行正常 (端口: \$port)"
    else
        echo "⚠️ \$name 可能仍在启动中 (端口: \$port)"
    fi
done

# 显示PM2状态
echo ""
echo "📊 PM2进程状态:"
pm2 list

# 显示访问信息
echo ""
echo "=".repeat(60)
echo "🌐 生产环境访问信息"
echo "=".repeat(60)
echo ""
echo "📊 Mission Control:"
echo "   前端: http://localhost:3001"
echo "   业务集成: http://localhost:3001/business-integration"
echo "   监控: http://localhost:3001/unified-monitoring"
echo "   API网关: http://localhost:3001/api/v1/unified"
echo ""
echo "📚 知识管理系统:"
echo "   前端: http://localhost:3000"
echo "   后端API: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""
echo "🔧 管理命令:"
echo "   查看所有进程: pm2 list"
echo "   查看日志: pm2 logs"
echo "   重启服务: pm2 restart <app-name>"
echo "   停止服务: pm2 stop <app-name>"
echo "   监控: pm2 monit"
echo ""
echo "📈 监控端点:"
echo "   健康检查: http://localhost:3001/health"
echo "   系统状态: http://localhost:3001/api/v6/monitoring?action=status"
echo ""
echo "=".repeat(60)
echo "✅ 生产环境启动完成"
echo "=".repeat(60)`;

  const startupPath = '/Users/kane/mission-control/scripts/start-production.sh';
  fs.writeFileSync(startupPath, startupScript);
  fs.chmodSync(startupPath, '755');
  console.log(`   ✅ 启动脚本: ${startupPath}`);
  
  // 4. 监控和告警脚本
  const monitoringScript = `#!/bin/bash

# 生产环境监控脚本
# 基于WORKFLOW_AUTO.md晚间主动推进授权

echo "🔍 生产环境监控检查"
echo "时间: \$(date)"
echo "=".repeat(60)

# 检查服务健康
check_service() {
    local name=\$1
    local url=\$2
    
    if curl -s --connect-timeout 5 "\$url" > /dev/null 2>&1; then
        echo "✅ \$name: 健康 (\$url)"
        return 0
    else
        echo "❌ \$name: 不可达 (\$url)"
        return 1
    fi
}

# 检查系统资源
check_resources() {
    echo ""
    echo "📊 系统资源检查:"
    
    # CPU使用率
    local cpu_usage=\$(top -l 1 | grep "CPU usage" | awk '{print \$3}' | sed 's/%//')
    echo "   CPU使用率: \$cpu_usage%"
    
    # 内存使用率
    local mem_total=\$(sysctl -n hw.memsize)
    local mem_wired=\$(vm_stat | grep "Pages wired down" | awk '{print \$4}' | sed 's/\\.//')
    local mem_active=\$(vm_stat | grep "Pages active" | awk '{print \$3}' | sed 's/\\.//')
    local page_size=\$(vm_stat | grep "page size" | awk '{print \$8}' | sed 's/\\.//')
    
    local mem_used=\$(( (\$mem_wired + \$mem_active) * \$page_size ))
    local mem_percent=\$(( \$mem_used * 100 / \$mem_total ))
    
    echo "   内存使用率: \$mem_percent%"
    
    # 磁盘使用率
    local disk_usage=\$(df -h / | tail -1 | awk '{print \$5}' | sed 's/%//')
    echo "   磁盘使用率: \$disk_usage%"
    
    # 检查阈值
    if [ \$cpu_usage -gt 80 ]; then
        echo "   ⚠️ 警告: CPU使用率过高"
    fi
    
    if [ \$mem_percent -gt 80 ]; then
        echo "   ⚠️ 警告: 内存使用率过高"
    fi
    
    if [ \$disk_usage -gt 80 ]; then
        echo "   ⚠️ 警告: 磁盘使用率过高"
    fi
}

# 检查服务
echo "🔧 服务健康检查:"
check_service "Mission Control" "http://localhost:3001/health"
check_service "知识管理前端" "http://localhost:3000"
check_service "知识管理后端" "http://localhost:8000/health"
check_service "统一API网关" "http://localhost:3001/api/v1/unified?action=process&q=test"
check_service "监控系统" "http://localhost:3001/api/v6/monitoring?action=status"

# 检查资源
check_resources

# 检查PM2进程
echo ""
echo "📋 PM2进程状态:"
if command -v pm2 &> /dev/null; then
    pm2 list
else
    echo "   PM2未安装"
fi

# 生成报告
echo ""
echo "📈 监控报告生成完成"
echo "=".repeat(60)
echo "建议:"
echo "   1. 定期运行此脚本监控系统状态"
echo "   2. 配置cron定时任务自动监控"
echo "   3. 设置告警通知（如Discord/Telegram）"
echo "   4. 定期备份重要数据"
echo "=".repeat(60)`;

  const monitoringPath = '/Users/kane/mission-control/scripts/monitor-production.sh';
  fs.writeFileSync(monitoringPath, monitoringScript);
  fs.chmodSync(monitoringPath, '755');
  console.log(`   ✅ 监控脚本: ${monitoringPath}`);
  
  return {
    nginx: nginxPath,
    pm2: pm2Path,
    startup: startupPath,
    monitoring: monitoringPath
  };
}

// 执行生产优化
function executeProductionOptimization() {
  console.log('\n🚀 执行生产优化...');
  
  try {
    // 1. 安装PM2
    console.log('   安装PM2进程管理器...');
    try {
      execSync('npm list -g pm2', { stdio: 'pipe' });
      console.log('   ✅ PM2已安装');
    } catch (error) {
      console.log('   安装PM2...');
      execSync('npm install -g pm2', { stdio: 'inherit' });
    }
    
    // 2. 创建日志目录
    console.log('   创建日志目录...');
    execSync('mkdir -p /Users/kane/mission-control/logs', { stdio: 'pipe' });
    execSync('mkdir -p /Users/kane/knowledge-management-system/logs', { stdio: 'pipe' });
    console.log('   ✅ 日志目录创建完成');
    
    // 3. 启动生产环境
    console.log('   启动生产环境...');
    const startupScript = '/Users/kane/mission-control/scripts/start-production.sh';
    
    if (fs.existsSync(startupScript)) {
      console.log('   执行启动脚本...');
      execSync(`bash ${startupScript}`, { stdio: 'inherit' });
    } else {
      console.log('   ⚠️ 启动脚本不存在');
    }
    
    return true;
  } catch (error) {
    console.log(`   ⚠️ 生产优化执行失败: ${error.message}`);
    return false;
  }
}

// 生成最终报告
function generateFinalReport(services, configs, optimizationSuccess) {
  console.log('\n📋 生成最终报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    deploymentStrategy: '简化生产环境