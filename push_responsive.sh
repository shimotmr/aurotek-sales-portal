#!/bin/bash
set -e

REPO="shimotmr/aurotek-sales-portal"
BASE_SHA=$(gh api repos/$REPO/git/ref/heads/main | jq -r '.object.sha')

echo "📦 Pushing responsive updates..."
echo "   Base SHA: $BASE_SHA"

# Get base tree
BASE_TREE=$(gh api repos/$REPO/git/commits/$BASE_SHA --jq '.tree.sha')

# Files to push
declare -a FILES=(
  "app/transcripts/page.tsx"
  "app/transcripts/new/page.tsx"
  "app/transcripts/[id]/page.tsx"
)

# Build tree items array
TREE_ITEMS='['

FIRST=true
for file in "${FILES[@]}"; do
  echo "📄 Processing $file..."
  
  CONTENT=$(base64 -i "$file")
  
  BLOB_SHA=$(gh api repos/$REPO/git/blobs \
    -f content="$CONTENT" \
    -f encoding=base64 \
    --jq '.sha')
  
  echo "   ✓ Blob SHA: $BLOB_SHA"
  
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
  -f message="🎨 Responsive design for transcript system (mobile-first, 44px+ touch targets, fixed audio player)" \
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
