#!/usr/bin/env bash

# Exercises prepare.sh against a local fixture repository with `gh` stubbed out.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="$(mktemp -d)"
ROOT="/tmp/acme-widgets-pr-7"
SRC_DIR="$ROOT/src"

trap 'rm -rf "$WORK_DIR" "$ROOT"' EXIT

assert() {
  if [ "$2" = "$3" ]; then
    printf 'ok   %s\n' "$1"
    return
  fi

  printf 'FAIL %s\n  expected: %s\n  actual:   %s\n' "$1" "$3" "$2" >&2
  exit 1
}

build_origin_repository() {
  git init -q -b main "$WORK_DIR/origin"
  git -C "$WORK_DIR/origin" config user.email self-check@example.com
  git -C "$WORK_DIR/origin" config user.name self-check

  commit_file main a.txt base
  git -C "$WORK_DIR/origin" checkout -qb feature
  commit_file feature a.txt changed
  publish_pull_request_head
}

commit_file() {
  local branch_name="$1"
  local file_name="$2"
  local file_content="$3"

  printf '%s\n' "$file_content" > "$WORK_DIR/origin/$file_name"
  git -C "$WORK_DIR/origin" add .
  git -C "$WORK_DIR/origin" commit -qm "$branch_name: $file_name"
}

publish_pull_request_head() {
  git -C "$WORK_DIR/origin" update-ref refs/pull/7/head refs/heads/feature
  git -C "$WORK_DIR/origin" checkout -q main
}

build_github_stub() {
  mkdir -p "$WORK_DIR/stub"

  cat > "$WORK_DIR/stub/gh" <<STUB
#!/usr/bin/env bash
case "\$1 \$2" in
  "auth status") exit 0 ;;
  "pr view") printf '{"title":"Fix the thing","baseRefName":"main","state":"OPEN"}\n' ;;
  "repo clone") git clone -q "$WORK_DIR/origin" "\$4" ;;
  *) exit 1 ;;
esac
STUB

  chmod +x "$WORK_DIR/stub/gh"
  PATH="$WORK_DIR/stub:$PATH"
  export PATH
}

prepare() {
  "$SCRIPT_DIR/prepare.sh" https://github.com/acme/widgets/pull/7 >/dev/null 2>&1
}

check_first_run_writes_artifacts() {
  prepare

  assert 'changed files listed' "$(tr '\n' ' ' < "$ROOT/context/changed-files.txt")" 'a.txt '
  assert 'base branch recorded' "$(grep BASE_BRANCH "$ROOT/context/meta.env")" 'BASE_BRANCH=main'
  assert 'head is detached' "$(git -C "$SRC_DIR" symbolic-ref -q HEAD || echo detached)" 'detached'
}

check_rerun_picks_up_new_commits_and_keeps_installed_deps() {
  mkdir -p "$SRC_DIR/vendor"
  printf 'dep\n' > "$SRC_DIR/vendor/package"
  printf 'vendor/\n' >> "$SRC_DIR/.git/info/exclude"
  printf 'tampered\n' > "$SRC_DIR/a.txt"

  git -C "$WORK_DIR/origin" checkout -q feature
  commit_file feature b.txt added
  publish_pull_request_head

  prepare

  assert 'new commit fetched' "$(tr '\n' ' ' < "$ROOT/context/changed-files.txt")" 'a.txt b.txt '
  assert 'installed deps survive' "$(cat "$SRC_DIR/vendor/package")" 'dep'
  assert 'tampered file restored' "$(cat "$SRC_DIR/a.txt")" 'changed'
}

check_broken_checkout_is_recloned() {
  rm -rf "$SRC_DIR/.git"
  prepare

  assert 'repository rebuilt' "$(git -C "$SRC_DIR" rev-parse --is-inside-work-tree)" 'true'
}

check_non_pull_request_url_fails() {
  local exit_code=0

  "$SCRIPT_DIR/prepare.sh" https://github.com/acme/widgets/issues/7 >/dev/null 2>&1 || exit_code=$?

  assert 'issue URL rejected' "$exit_code" '1'
}

main() {
  rm -rf "$ROOT"
  build_origin_repository
  build_github_stub

  check_first_run_writes_artifacts
  check_rerun_picks_up_new_commits_and_keeps_installed_deps
  check_broken_checkout_is_recloned
  check_non_pull_request_url_fails
}

main "$@"
