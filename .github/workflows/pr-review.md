---
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read

safe-outputs:
  add-comment:
    max: 1
---

# PR Review Agent — Aurotek Sales Portal

Review pull request changes for this Next.js + Supabase + TypeScript enterprise portal.

## Instructions

1. Review changed files for:
   - TypeScript type errors or unsafe patterns
   - SQL injection risks in Supabase queries
   - Authentication/authorization bypasses
   - Next.js App Router best practices
   - Missing error handling or loading states

2. Portal-specific rules:
   - Supabase queries must use parameterized values
   - API routes must validate authentication
   - No hardcoded credentials or API keys
   - Chinese UI text should be consistent

3. Post a comment with:
   - ✅ What looks good
   - ⚠️ Suggestions
   - ❌ Blocking issues (especially security)

Focus on security and data integrity — this handles business data.
