#!/usr/bin/env bash
# Goal-demo data sources per orchestrator issue (Parent win-predict-ai-orchestrator#N).
# Sourced by deploy/goal-preview-up.sh and .github/workflows/pr-preview.yml.

goal_preview_data_env() {
  local issue="${1:?issue number required}"

  case "$issue" in
    40)
      local data_branch="feature/espn-50-competitions"
      local raw_base="https://raw.githubusercontent.com/onlyzoran/win-predict-ai-data/${data_branch}/data"
      export VITE_LEAGUES_URL="${raw_base}/leagues.json"
      export VITE_DATA_BASE_URL="${raw_base}"
      ;;
    *)
      export VITE_LEAGUES_URL="${VITE_LEAGUES_URL:-https://win-predict-ai.com/api/leagues.json}"
      unset VITE_DATA_BASE_URL
      ;;
  esac

  export VITE_SPORTS_URL="${VITE_SPORTS_URL:-https://win-predict-ai.com/api/sports}"
}
