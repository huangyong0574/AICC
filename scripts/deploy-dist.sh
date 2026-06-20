#!/usr/bin/env bash
# deploy-dist.sh —— 增量部署本地 dist/ 到 AICC 生产 ECS 的 /aicc/ 子路径。
# 前提：先 `npm run build -- --base=/aicc/`（否则 /aicc/assets 全 404）。
# 认证：优先 SSH 密钥（DEPLOY_SSH_KEY，默认 ~/.ssh/aicc_deploy，免密码、可全自动）；
#       仅当显式设置 SSHPASS 时回退到 sshpass。两变量均用 := 绑定，set -u 不会触发未绑定。
# 注意：所有 ${DEPLOY_SSH_KEY} 一律加花括号，避免其后紧跟中文（多字节）时被并入变量名。
# 安全：部署进 /opt/AI-33CC/dist/aicc/，不 rsync --delete，不触碰 dist 根的 weekly/。
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="root@101.37.128.102"
DEST="/opt/AI-33CC/dist/aicc"
BASE_URL="http://101.37.128.102"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=25)

: "${DEPLOY_SSH_KEY:=$HOME/.ssh/aicc_deploy}"
: "${SSHPASS:=}"

if [ -n "$SSHPASS" ]; then
  command -v sshpass >/dev/null || { echo "缺少 sshpass（brew install hudochenkov/sshpass/sshpass）"; exit 1; }
  SSH=(sshpass -e ssh "${SSH_OPTS[@]}")
  SCP=(sshpass -e scp "${SSH_OPTS[@]}")
  echo "==> auth: sshpass (SSHPASS env)"
else
  [ -f "${DEPLOY_SSH_KEY}" ] || { echo "deploy key not found: ${DEPLOY_SSH_KEY} . Run ssh-keygen + ssh-copy-id, or set SSHPASS."; exit 1; }
  SSH=(ssh -i "${DEPLOY_SSH_KEY}" "${SSH_OPTS[@]}")
  SCP=(scp -i "${DEPLOY_SSH_KEY}" "${SSH_OPTS[@]}")
  echo "==> auth: SSH key (${DEPLOY_SSH_KEY})"
fi

[ -f dist/index.html ] || { echo "dist/index.html 不存在，请先 npm run build -- --base=/aicc/"; exit 1; }
grep -q '/aicc/assets/' dist/index.html || {
  echo "WARN: dist/index.html does not reference /aicc/assets/ (missing --base=/aicc/?). Abort to avoid 404."
  exit 1
}

subdirs=()
for d in assets content images; do [ -d "dist/$d" ] && subdirs+=("$d"); done

echo "==> 1/3 upload ${subdirs[*]} -> $DEST (tar-pipe; dist/weekly untouched)"
COPYFILE_DISABLE=1 tar czf - -C dist "${subdirs[@]}" | \
  "${SSH[@]}" "$HOST" "mkdir -p $DEST && tar xzf - -C $DEST && echo '   extracted'"

echo "==> 2/3 upload index.html (entry, last)"
"${SCP[@]}" dist/index.html "$HOST:$DEST/index.html"

echo "==> 3/3 verify"
home="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL/aicc/")"
js="$(grep -oE '/aicc/assets/[^\"]+\.js' dist/index.html | head -1)"
jscode="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL$js")"
radar="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL/aicc/content/radar/index.json")"
echo "   /aicc/ -> $home ; entry JS -> $jscode ; /aicc/content/radar/index.json -> $radar"
[ "$home" = "200" ] && [ "$jscode" = "200" ] && [ "$radar" = "200" ] && echo "OK: deploy done (dist/weekly untouched)." || echo "WARN: non-200 present, please check."
