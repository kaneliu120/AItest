module.exports = {
  apps: [{
    name: 'mission-control',
    script: 'npx',
    args: 'next dev --port 3001',
    cwd: '/Users/kane/mission-control',
    interpreter: 'none',
    env: {
      NODE_ENV: 'development',
      NODE_OPTIONS: '--max-old-space-size=512 --expose-gc'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/Users/kane/mission-control/logs/pm2-error.log',
    out_file: '/Users/kane/mission-control/logs/pm2-out.log',
    merge_logs: true,
    time: true,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '600M',
    restart_delay: 10000,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // 健康检查配置
    health_check: {
      url: 'http://localhost:3001/api/health',
      interval: 30000, // 30秒检查一次
      timeout: 5000,
      retries: 3
    },
    
    // 环境特定配置
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001
    }
  }]
};