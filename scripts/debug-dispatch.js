#!/usr/bin/env node

const http = require('http');

const postData = JSON.stringify({
  action: 'dispatch',
  query: '如何创建一个React组件？',
  priority: 'medium',
  context: {
    queryType: 'frontend',
    source: 'debug-test'
  },
  useCache: true
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v2/dispatcher',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应状态码:', res.statusCode);
    console.log('响应头:', res.headers);
    console.log('响应数据:', data);
    
    try {
      const json = JSON.parse(data);
      console.log('\n解析后的JSON:');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.data?.data) {
        console.log('\n响应数据详情:');
        console.log('success:', json.data.success);
        console.log('system:', json.data.data?.system);
        console.log('cached:', json.data.data?.cached);
        console.log('dispatchDecision:', json.data.data?.dispatchDecision);
      }
    } catch (e) {
      console.log('JSON解析失败:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.log('请求失败:', e.message);
});

req.write(postData);
req.end();