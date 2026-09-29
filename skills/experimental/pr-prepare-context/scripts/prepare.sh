#!/usr/bin/env bash

set -euo pipefail

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

require_command() {
  local command_name="$1"

  if command -v "$command_name" >/dev/null 2>&1; then
    return
  fi

  fail "Missing required command: $command_name"
}

require_github_auth() {
  if gh auth status >/dev/null 2>&1; then
    return
  fi

  fail "GitHub CLI is not authenticated. Run: gh auth login"
}

parse_pull_request_url() {
  local pull_request_url="$1"

  if [[ ! "$pull_request_url" =~ ^https://github\.com/([^/]+)/([^/]+)/pull/([0-9]+) ]]; then
    fail "Not a GitHub pull request URL: $pull_request_url"
  fi

  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
  PR_NUMBER="${BASH_REMATCH[3]}"
}

setup_context_paths() {
  ROOT="/tmp/$OWNER-$REPO-pr-$PR_NUMBER"
  SRC_DIR="$ROOT/src"
  CONTEXT_DIR="$ROOT/context"

  mkdir -p "$CONTEXT_DIR"
}

fetch_pull_request_metadata() {
  if ! gh pr view "$PR_NUMBER" --repo "$OWNER/$REPO" \
    --json title,body,author,baseRefName,headRefName,url,labels,state \
    > "$CONTEXT_DIR/pr.json"; then
    fail "Cannot read $OWNER/$REPO#$PR_NUMBER. Check the URL and your access to the repository."
  fi

  PR_TITLE="$(jq -r '.title' "$CONTEXT_DIR/pr.json")"
  BASE_BRANCH="$(jq -r '.baseRefName' "$CONTEXT_DIR/pr.json")"
}

ensure_clone() {
  if git -C "$SRC_DIR" rev-parse --git-dir >/dev/null 2>&1; then
    return
  fi

  rm -rf "$SRC_DIR"
  clone_repository
}

clone_repository() {
  if GIT_TERMINAL_PROMPT=0 git clone "https://github.com/$OWNER/$REPO.git" "$SRC_DIR" >&2; then
    return
  fi

  rm -rf "$SRC_DIR"
  gh repo clone "$OWNER/$REPO" "$SRC_DIR" >&2 || fail "Cannot clone $OWNER/$REPO."
}

checkout_pull_request_head() {
  git -C "$SRC_DIR" fetch --force origin \
    "refs/pull/$PR_NUMBER/head:refs/remotes/origin/pr/$PR_NUMBER" \
    "refs/heads/$BASE_BRANCH:refs/remotes/origin/$BASE_BRANCH" >&2

  HEAD_SHA="$(git -C "$SRC_DIR" rev-parse "refs/remotes/origin/pr/$PR_NUMBER")"
  BASE_SHA="$(git -C "$SRC_DIR" merge-base "$HEAD_SHA" "refs/remotes/origin/$BASE_BRANCH")"

  git -C "$SRC_DIR" checkout --force --detach "$HEAD_SHA" >&2
  git -C "$SRC_DIR" clean --force -d >&2
}

write_context_artifacts() {
  write_meta_file
  git -C "$SRC_DIR" diff "$BASE_SHA" "$HEAD_SHA" > "$CONTEXT_DIR/patch.diff"
  git -C "$SRC_DIR" diff --stat "$BASE_SHA" "$HEAD_SHA" > "$CONTEXT_DIR/diffstat.txt"
  git -C "$SRC_DIR" diff --name-only "$BASE_SHA" "$HEAD_SHA" > "$CONTEXT_DIR/changed-files.txt"
}

write_meta_file() {
  cat > "$CONTEXT_DIR/meta.env" <<META
OWNER=$OWNER
REPO=$REPO
PR_NUMBER=$PR_NUMBER
BASE_BRANCH=$BASE_BRANCH
BASE_SHA=$BASE_SHA
HEAD_SHA=$HEAD_SHA
META
}

print_summary() {
  printf '%s\n\n' "$ROOT"
  printf '%s#%s: %s\n' "$OWNER/$REPO" "$PR_NUMBER" "$PR_TITLE"
  printf '%s (%s) ... %s\n\n' "$BASE_BRANCH" "${BASE_SHA:0:8}" "${HEAD_SHA:0:8}"
  cat "$CONTEXT_DIR/diffstat.txt"
}

main() {
  local pull_request_url="${1:-}"

  if [ -z "$pull_request_url" ]; then
    fail "Usage: prepare.sh <pull-request-url>"
  fi

  require_command git
  require_command gh
  require_command jq
  require_github_auth

  parse_pull_request_url "$pull_request_url"
  setup_context_paths
  fetch_pull_request_metadata
  ensure_clone
  checkout_pull_request_head
  write_context_artifacts
  print_summary
}

main "$@"
