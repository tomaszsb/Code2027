# Claude CLI - Lessons Learned

## November 14, 2025 - Branch and Work Verification

### Issue
Made incorrect assumptions TWICE during cleanup task:

1. **First mistake:** Assumed movement refactor work was in `movement-updates-temp` branch
   - **What I should have done:** `git fetch --all` FIRST, then searched ALL branches with `git branch -a | grep movement`
   - **What actually happened:** The work was in `claude/csv-based-space-movement-011CUwFMKQdAZGdEnEkpkf6u`

2. **Second mistake:** Assumed Claude Code web didn't complete cleanup work
   - **What I should have done:** `git fetch --all` and checked for NEW branches, not just master
   - **What actually happened:** Work was completed in `claude/post-refactor-cleanup-011CUwFMKQdAZGdEnEkpkf6u`

### Corrective Action - MANDATORY CHECKLIST

**When user mentions work by another AI (Claude Code web, Gemini, etc.):**

```bash
# STEP 1: Always fetch first
git fetch --all

# STEP 2: List ALL branches (not just what you expect)
git branch -a

# STEP 3: Look for recent branches
git for-each-branch --sort=-committerdate | head -20

# STEP 4: Check for branches matching keywords
git branch -a | grep -i <keyword>

# STEP 5: If still not found, check recent commits across all branches
git log --all --oneline --since="2 days ago" | head -20

# STEP 6: Only THEN check current branch
git status
git log --oneline -5
```

**NEVER assume work location based on:**
- Branch names that seem logical
- Current branch you're on
- What you expect to see

**ALWAYS verify by:**
- Fetching ALL remotes first
- Listing ALL branches
- Checking recent activity across ALL branches
- Searching for keywords in branch names

### Pattern to Remember

When user says "Claude Code web did X":
1. ✅ Fetch all remotes
2. ✅ List all branches
3. ✅ Search for new/recent branches
4. ✅ Check out and verify the actual branch
5. ❌ DON'T assume based on logical naming
6. ❌ DON'T just check master

### Cost of Mistakes
- Time wasted investigating wrong branches
- User frustration
- Incorrect status reports
- Redundant work

### Success Pattern
- Always start with `git fetch --all`
- Use `git branch -a` to see EVERYTHING
- Search broadly before narrowing
- Verify by checking out the actual branch
- Only then analyze and report

---

## Template for Future Similar Tasks

```bash
# User says another AI did work
echo "Fetching all remotes and branches..."
git fetch --all

echo "Listing all branches..."
git branch -a

echo "Searching for relevant branches..."
git branch -a | grep -i <keyword>

echo "Checking recent commits..."
git log --all --oneline --since="1 day ago" | head -20

echo "Now checking out suspected branch..."
git checkout <branch-name>

echo "Verifying work..."
git log --oneline -5
git diff master --stat
```

**Remember:** The extra 30 seconds of thorough checking saves 30 minutes of wrong assumptions!
