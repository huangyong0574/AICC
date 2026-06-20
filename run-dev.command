#!/bin/bash
# 开发服务器启动器（双击运行）：在 Mac 本机启动 Vite dev server。
# 由 Claude 通过 Finder 双击触发；窗口保留以便查看日志，关闭窗口即停止服务。
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
cd "$HOME/Desktop/AICC项目/AICC" || { echo "✗ 找不到工程目录"; exit 1; }

echo "=================================================="
echo " AICC 开发服务器启动  $(date '+%Y-%m-%d %H:%M:%S')"
echo " node: $(command -v node || echo '未找到!')"
echo " 目录: $(pwd)"
echo "=================================================="

if [ ! -d node_modules ]; then
  echo "未发现 node_modules，正在安装依赖..."
  npm install || { echo "✗ 依赖安装失败"; exit 1; }
fi

echo " 启动 Vite (http://localhost:5180) ..."
echo " 浏览器会自动打开；关闭此窗口即可停止服务。"
echo "=================================================="
( sleep 3; open "http://localhost:5180" ) &
npm run dev
