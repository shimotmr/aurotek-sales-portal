#!/bin/bash
set -e

REPO="shimotmr/aurotek-sales-portal"
BASE_SHA="3e392db05874786d4734bee3e0884a71af2c8f7c"

echo "📦 Preparing to push transcript system files..."

# Get base tree
echo "🌳 Getting base tree..."
BASE_TREE=$(gh api repos/$REPO/git/commits/$BASE_SHA --jq '.tree.sha')
echo "   Base tree: $BASE_TREE"

# Files to push
declare -a FILES=(
  "app/page.tsx"
  "app/transcripts/page.tsx"
  "app/transcripts/new/page.tsx"
  "app/transcripts/[id]/page.tsx"
  "app/api/transcripts/upload/route.ts"
  "app/api/transcripts/[id]/status/route.ts"
  "app/api/transcripts/[id]/correct/route.ts"
)

# Build tree items array
TREE_ITEMS='['

FIRST=true
for file in "${FILES[@]}"; do
  echo "📄 Processing $file..."
  
  # Read file content and encode as base64
  CONTENT=$(base64 -i "$file")
  
  # Create blob
  BLOB_SHA=$(gh api repos/$REPO/git/blobs \
    -f content="$CONTENT" \
    -f encoding=base64 \
    --jq '.sha')
  
  echo "   ✓ Blob SHA: $BLOB_SHA"
  
  # Add to tree items
  if [ "$FIRST" = false ]; then
    TREE_ITEMS+=','
  fi
  FIRST=false
  
  TREE_ITEMS+="{\"path\":\"$file\",\"mode\":\"100644\",\"type\":\"blob\",\"sha\":\"$BLOB_SHA\"}"
done

TREE_ITEMS+=']'

# Create tree
echo "🌳 Creating tree..."
TREE_SHA=$(echo "{\"base_tree\":\"$BASE_TREE\",\"tree\":$TREE_ITEMS}" | \
  gh api repos/$REPO/git/trees --input - --jq '.sha')

echo "   ✓ Tree SHA: $TREE_SHA"

# Create commit
echo "💾 Creating commit..."
COMMIT_SHA=$(gh api repos/$REPO/git/commits \
  -f message="Add transcript system (列表/上傳/編輯器/API routes)" \
  -f tree="$TREE_SHA" \
  -f parents[]="$BASE_SHA" \
  --jq '.sha')

echo "   ✓ Commit SHA: $COMMIT_SHA"

# Update ref
echo "🚀 Updating main branch..."
gh api repos/$REPO/git/refs/heads/main \
  -X PATCH \
  -f sha="$COMMIT_SHA" > /dev/null

echo "✅ Successfully pushed to GitHub!"
echo "🔗 https://github.com/$REPO/commit/$COMMIT_SHA"
