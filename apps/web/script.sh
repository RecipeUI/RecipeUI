#!/bin/bash

echo "VERCEL_ENV: $VERCEL_ENV"
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# Check for changes in /apps or /packages/
GIT_DIFF=$(git diff --name-only HEAD^ HEAD)
echo "Changed files:"
echo "$GIT_DIFF"

if [[ "$GIT_DIFF" == *apps* ]] || [[ "$GIT_DIFF" == *packages* ]]; then
    CHANGES_FOUND=true
else
    CHANGES_FOUND=false
fi

echo "Changes found: $CHANGES_FOUND"

# If there are no changes in /apps and /packages/, then don't proceed with the build.
if [[ "$CHANGES_FOUND" == "true" && "$VERCEL_ENV" == "production" ]] && [[ "$VERCEL_GIT_COMMIT_REF" == "release" || "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then
  # Proceed with the build
  echo "✅ - Build can proceed"
  exit 1;
else
  # Don't build
  echo "🛑 - Build cancelled"
  exit 0;
fi