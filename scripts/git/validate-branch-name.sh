#!/usr/bin/env sh
branch=$(git symbolic-ref -q --short HEAD 2>/dev/null) || exit 0
[ -z "$branch" ] && exit 0

case "$branch" in
main|master|develop) exit 0 ;;
feat/*|fix/*|chore/*|docs/*|release/*|hotfix/*) exit 0 ;;
*)
  echo "Invalid branch name: $branch"
  echo "Allowed: main, master, develop, feat/*, fix/*, chore/*, docs/*, release/*, hotfix/*"
  exit 1
  ;;
esac
