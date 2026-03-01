/**
 * Next.js Instrumentation — 暂时禁用 OpenTelemetry
 * 原因：@opentelemetry/sdk-node 未安装，暂时注释掉以避免编译错误
 * 恢复：安装 npm i @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/sdk-trace-base
 */

export async function register() {
  // OpenTelemetry 已暂时禁用
  // 如需启用，请先安装相关依赖并取消注释
}
