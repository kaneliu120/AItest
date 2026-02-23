#!/usr/bin/env node

/**
 * 监控故障诊断系统告警频率
 */

console.log('🔍 监控故障诊断系统告警频率\n');

const monitoringConfig = {
  checkInterval: 10000, // 10秒检查一次
  alertThreshold: 5, // 每分钟超过5个告警需要关注
  duration: 300000 // 监控5分钟
};

let alertCount = 0;
let startTime = Date.now();

console.log(`开始监控 (${new Date().toISOString()})`);
console.log(`监控时长: ${monitoringConfig.duration / 60000} 分钟\n`);

// 模拟监控（实际应该从日志或API获取）
const interval = setInterval(() => {
  const elapsed = Date.now() - startTime;
  const minutes = elapsed / 60000;
  
  // 模拟告警（实际应该从系统获取）
  const simulatedAlerts = Math.floor(Math.random() * 3); // 0-2个告警
  
  alertCount += simulatedAlerts;
  
  const alertsPerMinute = alertCount / minutes;
  
  console.log(`[${new Date().toISOString()}] 告警统计:`);
  console.log(`   总告警数: ${alertCount}`);
  console.log(`   每分钟告警: ${alertsPerMinute.toFixed(2)}`);
  console.log(`   状态: ${alertsPerMinute > monitoringConfig.alertThreshold ? '⚠️ 需要关注' : '✅ 正常'}\n`);
  
  if (elapsed >= monitoringConfig.duration) {
    clearInterval(interval);
    console.log('📊 监控结束统计:');
    console.log(`   总时长: ${minutes.toFixed(2)} 分钟`);
    console.log(`   总告警: ${alertCount}`);
    console.log(`   平均每分钟: ${(alertCount / minutes).toFixed(2)}`);
    console.log(`   评估: ${(alertCount / minutes) > 3 ? '告警频率偏高，建议进一步优化' : '告警频率正常'}`);
  }
}, monitoringConfig.checkInterval);
