#!/usr/bin/env bash
# deploy-dist.sh —— 把本地 dist/ 增量部署到 AICC 生产 ECS。
# 见 SPEC §3.6 与 .claude/skills/aicc-radar。
#
# 用法：
#   npm run build && AICC_ECS_PASS='***' bash scripts/deploy-dist.sh
#
# 安全约定：
#   - 增量上传（assets/content/images 先，index.html 最后），绝不 rsync --delete
#   - 保留服务器上的 weekly/（周报 HTML）与 demo/（独立子应用）——它们不在 dist/ 里
#   - 密码只从环境变量 AICC_ECS_PASS 读，绝不硬编码或入库
set -euo pipefail

HOST="root@101.37.128.102"
DEST="/opt/AI-33CC/dist"
BASE_URL="http://101.37.128.102"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=25)

cd "$(dirname "$0")/.."   # 切到仓库根

: "${AICC_ECS_PASS:?需要设置环境变量 AICC_ECS_PASS（ECS root 密码），不要写进文件}"
command -v sshpass >/dev/null || { echo "缺少 sshpass（brew install hudochenkov/sshpass/sshpass）"; exit 1; }
[ -f dist/index.html ] || { echo "dist/index.html 不存在，请先 npm run build"; exit 1; }

# 只打包实际存在的子目录（index.html 留到最后单独传）
subdirs=()
for d in assets content images; do [ -d "dist/$d" ] && subdirs+=("$d"); done

echo "==> 1/3 上传 ${subdirs[*]}（tar-pipe；保留服务器 weekly/ + demo/）"
COPYFILE_DISABLE=1 tar czf - -C dist "${subdirs[@]}" | \
  sshpass -p "$AICC_ECS_PASS" ssh "${SSH_OPTS[@]}" "$HOST" "tar xzf - -C $DEST && echo '   解压完成'"

echo "==> 2/3 上传 index.html（入口，最后传，避免半完成态指向缺失资源）"
sshpass -p "$AICC_ECS_PASS" scp "${SSH_OPTS[@]}" dist/index.html "$HOST:$DEST/index.html"

echo "==> 3/3 验收"
served="$(curl -s --max-time 20 "$BASE_URL/")"
if [ "$served" = "$(cat dist/index.html)" ]; then
  echo "   ✅ 线上 / 与本地 dist/index.html 一致"
else
  echo "   ⚠️ 线上 / 与本地 index.html 不一致（缓存或上传问题），请人工核对"
fi
js="$(grep -oE 'assets/[^"]+\.js' dist/index.html | head -1)"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL/$js")"
echo "   入口 JS（$js）HTTP $code"
echo "✅ 部署完成。weekly/ 与 demo/ 未触碰。"
