#!/usr/bin/env bash
# weekly-radar.sh —— 每周「认知雷达」一键集成：外部成品 HTML → 应用 → 上线。
# 见 SPEC §3.6。供 Claude Desktop「本地」Scheduled Task / macOS launchd / 手动 调用。
#
# 用法：
#   SSHPASS='***' bash scripts/weekly-radar.sh                 # 自动取 AICC-Input 最新 HTML，跑完整链路
#   SSHPASS='***' bash scripts/weekly-radar.sh <html路径>       # 指定 HTML
#   bash scripts/weekly-radar.sh --no-deploy                   # 只到 commit/push，不 build/部署（无需 SSHPASS）
#
# 链路：定位 HTML → parse-radar-html → ingest-radar → git commit/push
#       → vite build --base=/aicc/ → deploy-dist.sh（部署到 /opt/AI-33CC/dist/aicc/）
set -euo pipefail
cd "$(dirname "$0")/.."

SRC_DIR="${AICC_RADAR_SRC:-/Users/huangyong/Documents/Obsidian Vault/AICC项目/AICC-Input}"
DEPLOY=1
HTML=""
for a in "$@"; do
  case "$a" in
    --no-deploy) DEPLOY=0 ;;
    -*) echo "未知参数：$a"; exit 1 ;;
    *) HTML="$a" ;;
  esac
done

# 1) 定位 HTML（参数优先，否则取 AICC-Input 里最新的 AI认知雷达-*.html）
if [ -z "$HTML" ]; then
  HTML="$(ls -t "$SRC_DIR"/AI认知雷达-*.html 2>/dev/null | head -1 || true)"
fi
[ -n "$HTML" ] && [ -f "$HTML" ] || { echo "✗ 找不到 HTML（$SRC_DIR/AI认知雷达-*.html）"; exit 1; }
echo "==> [1/5] HTML: $HTML"

# 2) 解析 HTML → RadarWeek JSON（parse 把进度打到 stderr，stdout 仅输出 JSON 路径）
JSON="$(node scripts/parse-radar-html.mjs "$HTML")"
echo "==> [2/5] 解析 → $JSON"

# 3) ingest：校验 + 纳入 public/content/radar + 重建 index
node scripts/ingest-radar.mjs "$JSON" >&2
echo "==> [3/5] 已 ingest"

# 4) 若 radar 有变化则提交并推送
if git diff --quiet -- public/content/radar; then
  echo "==> [4/5] public/content/radar 无变化，跳过提交"
else
  git add public/content/radar
  git commit -q -m "feat(radar): $(basename "$JSON" .json) 周报集成（weekly-radar）"
  git push origin main
  echo "==> [4/5] 已提交并推送"
fi

# 5) build（务必带 --base=/aicc/）+ 部署
if [ "$DEPLOY" = "1" ]; then
  npm run build -- --base=/aicc/ >&2
  bash scripts/deploy-dist.sh
  echo "==> [5/5] 已构建并部署到 /aicc/"
else
  echo "==> [5/5] --no-deploy：跳过 build/部署（记得稍后手动上线）"
fi
echo "✅ weekly-radar 完成。"
