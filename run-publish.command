#!/bin/bash
# 一次性发布启动器（双击运行）：在 Mac 本机跑 radar-publish.sh（有网络/密钥）。
# 由 Claude 通过 Finder 双击触发；输出留在本窗口供截图。
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
export DEPLOY_SSH_KEY="$HOME/.ssh/aicc_deploy"
cd "$HOME/Desktop/AICC项目/AICC" || { echo "✗ 找不到工程目录"; exit 1; }

echo "=================================================="
echo " AICC 雷达 W25 一次性发布  $(date '+%Y-%m-%d %H:%M:%S')"
echo " node: $(command -v node || echo '未找到!')  git: $(command -v git || echo '未找到!')"
echo "=================================================="
bash scripts/radar-publish.sh
code=$?
echo "=================================================="
echo " 退出码: $code   （0=成功）"
echo " 窗口保留，截图后可关闭。"
echo "=================================================="
