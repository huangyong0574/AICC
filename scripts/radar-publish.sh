#!/usr/bin/env bash
# radar-publish.sh —— Mac 侧（有外网）自动发布后半程：取 AICC-Input 最新周 JSON
#   → ingest-radar（写 public/content/radar + 重建 index）→ git push → vite build(--base=/aicc/)
#   → deploy-dist.sh（SSH 密钥免密部署到 ECS /aicc/）。
# 设计：Claude 定时任务（沙箱、无外网）只负责采集并把 {weekId}.json 落到 AICC-Input；
#       本脚本由 macOS launchd 在稍后时刻（有外网）执行发布。全程不处理明文密码（用 SSH 密钥）。
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="${AICC_RADAR_SRC:-$HOME/Documents/Obsidian Vault/AICC项目/AICC-Input}"
export DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/aicc_deploy}"

# 取最新一周 JSON（形如 2026-W25.json；当周子文件夹优先，回退到 AICC-Input 根）
JSON="$(ls -t "$SRC"/*/[0-9][0-9][0-9][0-9]-W[0-9][0-9].json "$SRC"/[0-9][0-9][0-9][0-9]-W[0-9][0-9].json 2>/dev/null | head -1 || true)"
[ -n "$JSON" ] && [ -f "$JSON" ] || { echo "✗ 找不到周 JSON（$SRC/**/{YYYY-WNN}.json）"; exit 1; }
echo "==> [1/5] 周 JSON：$JSON"

echo "==> [2/5] ingest-radar 摄取"
node scripts/ingest-radar.mjs "$JSON" >&2

# 有新内容就提交（无新内容也不报错——可能上轮已提交但未推送）
if ! git diff --quiet -- public/content/radar; then
  git add public/content/radar
  git commit -q -m "feat(radar): $(basename "$JSON" .json) 自动发布（radar-publish）"
  echo "==> [3/5] 已提交 public/content/radar 变更"
else
  echo "==> [3/5] public/content/radar 无新变更（沿用已有提交）"
fi

# push 只在本地领先 origin 时执行；但构建+部署始终执行，保证线上与 dist 一致（幂等）。
git fetch -q origin main || true
AHEAD="$(git rev-list --count origin/main..main 2>/dev/null || echo 0)"
if [ "$AHEAD" != "0" ]; then
  echo "==> 本地领先 origin/main $AHEAD 个提交，推送。"
  git push origin main
else
  echo "==> origin/main 已最新，跳过 push（仍会构建并部署以确保线上一致）。"
fi

echo "==> [4/5] 构建（--base=/aicc/）"
npm run build -- --base=/aicc/ >&2

echo "==> [5/5] 部署到 ECS（密钥免密）"
bash scripts/deploy-dist.sh

echo "✅ radar-publish 完成。"
