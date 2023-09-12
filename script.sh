#!/bin/bash

echo "VERCEL_ENV: $VERCEL_ENV"
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# Check if there are changes in the /apps or /packages/ directories
changed_apps=$(git diff --quiet HEAD^ HEAD ./apps/)
changed_packages=$(git diff --quiet HEAD^ HEAD ./packages/)

# If there are no changes in /apps and /packages/, then don't proceed with the build.
if [ -z "$changed_apps" ] && [ -z "$changed_packages" ]; then
  echo "🛑 - No changes in /apps or /packages/. Build cancelled."
  exit 0;
fi

if [[ "$VERCEL_ENV" == "production" ]] && [[ "$VERCEL_GIT_COMMIT_REF" == "release" || "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then
  # Proceed with the build
  echo "✅ - Build can proceed"
  exit 1;
else
  # Don't build
  echo "🛑 - Build cancelled"
  exit 0;
fi