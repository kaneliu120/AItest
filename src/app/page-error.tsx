export default function PageError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-2">🚨 Mission Control - 系统错误</h1>
          <p className="text-gray-400">检测到系统配置问题，需要立即修复</p>
        </header>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="bg-red-500/20 p-4 rounded-xl">
              <div className="text-3xl">⚠️</div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">检测到的问题</h2>
              <div className="space-y-4">
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-400">API路由配置错误</h3>
                  <p className="text-gray-400 mt-1">部分API路由文件存在语法错误或缺少依赖</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-400">类型检查失败</h3>
                  <p className="text-gray-400 mt-1">TypeScript类型定义不完整或存在冲突</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-400">构建配置问题</h3>
                  <p className="text-gray-400 mt-1">生产构建过程中检测到未处理的错误</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-4">🛠️ 修复步骤</h3>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                <span>检查所有API路由文件的语法错误</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                <span>修复TypeScript类型定义问题</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                <span>确保所有服务依赖正确导入</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                <span>重新运行生产构建命令</span>
              </li>
            </ol>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-4">✅ 系统状态</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">前端界面</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">正常</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">数据库连接</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">正常</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">API服务</span>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">部分异常</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">生态系统</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">运行正常</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Mission Control 版本 2.0.0 | 错误检测时间: {new Date().toLocaleString()}</p>
          <p className="mt-1">如需帮助，请检查控制台输出或联系系统管理员</p>
        </div>
      </div>
    </div>
  );
}