#!/usr/bin/env bash
# deploy-dist.sh —— 增量部署本地 dist/ 到 AICC 生产 ECS 的 /aicc/ 子路径。
# 见 SPEC §3.6 与 memory aicc-ecs-deploy。
#
# 前提：先用 `npm run build -- --base=/aicc/` 构建（否则 /aicc/assets 全 404）。
# 用法：SSHPASS='***' bash scripts/deploy-dist.sh
#
# 安全约定：
#   - 部署进 /opt/AI-33CC/dist/aicc/（路径式站点；root / 302→/aicc/），绝不动 dist 根的 weekly/
#   - 增量上传（assets/content/images 先，index.html 最后），不 rsync --delete
#   - 密码用 sshpass -e 从 SSHPASS 环境变量读（安全分类器禁止 -p 明文与写文件）；绝不入库
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="root@101.37.128.102"
DEST="/opt/AI-33CC/dist/aicc"
BASE_URL="http://101.37.128.102"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=25)

: "${SSHPASS:?需要设置环境变量 SSHPASS（ECS root 密码）；用 sshpass -e 读取，绝不写进文件}"
command -v sshpass >/dev/null || { echo "缺少 sshpass（brew install hudochenkov/sshpass/sshpass）"; exit 1; }
[ -f dist/index.html ] || { echo "dist/index.html 不存在，请先 npm run build -- --base=/aicc/"; exit 1; }
grep -q '/aicc/assets/' dist/index.html || {
  echo "⚠️ dist/index.html 未引用 /aicc/assets/——大概率漏了 --base=/aicc/。中止以免线上 404。"
  echo "   请改用：npm run build -- --base=/aicc/"
  exit 1
}

subdirs=()
for d in assets content images; do [ -d "dist/$d" ] && subdirs+=("$d"); done

echo "==> 1/3 上传 ${subdirs[*]} → $DEST（tar-pipe；不触碰 dist 根的 weekly/）"
COPYFILE_DISABLE=1 tar czf - -C dist "${subdirs[@]}" | \
  sshpass -e ssh "${SSH_OPTS[@]}" "$HOST" "mkdir -p $DEST && tar xzf - -C $DEST && echo '   解压完成'"

echo "==> 2/3 上传 index.html（入口，最后传）"
sshpass -e scp "${SSH_OPTS[@]}" dist/index.html "$HOST:$DEST/index.html"

echo "==> 3/3 验收"
home="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL/aicc/")"
js="$(grep -oE '/aicc/assets/[^"]+\.js' dist/index.html | head -1)"
jscode="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL$js")"
radar="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL/aicc/content/radar/index.json")"
echo "   /aicc/ → $home ; 入口 JS → $jscode ; /aicc/content/radar/index.json → $radar"
[ "$home" = "200" ] && [ "$jscode" = "200" ] && [ "$radar" = "200" ] && echo "✅ 部署完成（dist/weekly/ 未触碰）。" || echo "⚠️ 有非 200，请人工核对。"
