# Development Workflow Guide

**Last Updated:** November 23, 2025
**Applies to:** All Claude Code sessions

---

## 🎯 Core Principle

**One Task = One Branch (Assigned by Team)**

Do not create new branches. Work on the branch assigned to you.

---

## 📋 Standard Workflow

### 1. Task Assignment
- You will be assigned a task with a **specific branch name**
- Branch naming convention: `claude/[task-description]-[session-id]`
- Example: `claude/fix-game-tracking-multi-server-01BgH8uq3xk8fnYkMHXB9E3W`

### 2. Development Process

**✅ DO:**
- Work exclusively on the assigned branch
- Commit regularly with clear, descriptive messages
- Push all changes to the same assigned branch
- Run tests before committing
- Notify when work is complete and ready for review

**❌ DON'T:**
- Create new branches unless explicitly instructed
- Work across multiple branches
- Push to different branches
- Skip testing
- Leave work uncommitted

### 3. Commit Message Format

Use clear, descriptive commit messages:

```
feat: Add multi-game tracking infrastructure (Phase 1)

PROBLEM SOLVED:
- Brief description of what problem this solves

CHANGES IMPLEMENTED:
- List key changes
- Be specific and concise

TESTING:
- Test results summary
```

### 4. Testing Requirements

Before any commit:
- ✅ Run relevant test suite
- ✅ Ensure all tests pass
- ✅ Fix any breaking changes
- ✅ Document test results in commit message

Quick test commands:
```bash
npm test                    # Run all tests
npm test [file-path]        # Run specific test file
npm run test:services       # Run service tests
npm run test:e2e            # Run E2E tests
```

### 5. Completion Notification

When work is complete, provide:
- ✅ Clear "READY FOR REVIEW" status
- ✅ Branch name
- ✅ Summary of what was delivered
- ✅ Test results
- ✅ Any known issues or follow-ups

Example:
```
🟢 READY FOR REVIEW

Branch: claude/fix-game-tracking-multi-server-01BgH8uq3xk8fnYkMHXB9E3W
Commits: 3 commits pushed
Tests: 760/760 passing
Status: All changes committed and pushed

Summary:
- Phase 1: Game tracking infrastructure
- Phase 2: Server with multi-game support
- Documentation: 3 comprehensive docs
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Branch Proliferation
```bash
# WRONG - Creating new branches
git checkout -b claude/new-feature
git checkout -b claude/another-feature

# RIGHT - Stay on assigned branch
# (Already on assigned branch, just keep working)
git add .
git commit -m "feat: implement feature"
git push origin claude/assigned-branch
```

### ❌ Scattered Work
```bash
# WRONG - Working across multiple branches
git checkout branch-A
# make changes
git checkout branch-B
# make more changes

# RIGHT - All work on one branch
git checkout claude/assigned-branch
# do all work here
git commit -m "complete implementation"
```

### ❌ Silent Completion
```bash
# WRONG - Push and disappear
git push origin claude/assigned-branch
# (no notification)

# RIGHT - Push and notify
git push origin claude/assigned-branch
# Then provide completion summary to user
```

---

## 📊 Quality Standards

### Code Quality
- ✅ All tests passing
- ✅ TypeScript compilation successful
- ✅ No linting errors (if applicable)
- ✅ No breaking changes to existing functionality

### Documentation
- ✅ Update relevant docs when adding features
- ✅ Add inline comments for complex logic
- ✅ Include usage examples for new APIs

### Testing
- ✅ Write tests for new functionality
- ✅ Update tests for modified functionality
- ✅ Achieve reasonable test coverage
- ✅ Include both unit and integration tests where appropriate

---

## 🔄 Session Continuity

### Starting a New Session

When a new Claude Code session starts:
1. ✅ Read this workflow document
2. ✅ Confirm the assigned branch
3. ✅ Review recent commits on that branch
4. ✅ Ask for any updates to requirements

### Resuming Work

If continuing previous work:
1. ✅ Check for any new commits from team
2. ✅ Pull latest changes: `git pull origin [branch-name]`
3. ✅ Review the task status
4. ✅ Continue from where you left off

---

## 🎯 Branch Lifecycle

```
Task Assigned
     ↓
Work on Assigned Branch
     ↓
Commit Regularly
     ↓
Push to Same Branch
     ↓
Run Tests
     ↓
Notify on Completion
     ↓
Code Review
     ↓
Merge (by team)
```

---

## 🛠️ Git Commands Reference

### Basic Workflow
```bash
# Check current branch
git status

# Make sure you're on assigned branch
git branch

# Commit changes
git add [files]
git commit -m "feat: description"

# Push to assigned branch
git push origin [assigned-branch-name]

# Check recent commits
git log --oneline -5
```

### If You Accidentally Create a Branch

```bash
# You're on wrong branch
git branch  # shows: claude/accidental-branch

# Move changes back to assigned branch
git stash
git checkout claude/assigned-branch
git stash pop

# Delete the accidental branch
git branch -D claude/accidental-branch
```

---

## 📞 When to Ask Questions

### Always Ask If:
- ❓ Branch name is unclear
- ❓ Requirements are ambiguous
- ❓ Multiple valid approaches exist
- ❓ Breaking changes are necessary
- ❓ Tests fail unexpectedly

### Don't Ask If:
- ✅ Workflow is clear from this document
- ✅ Standard coding decisions
- ✅ Bug fixes are straightforward
- ✅ Documentation updates are needed

---

## 📈 Success Metrics

A successful delivery includes:
- ✅ All work on assigned branch
- ✅ All tests passing
- ✅ Clear commit history
- ✅ Complete documentation
- ✅ Notification provided
- ✅ No new branches created

---

## 🔗 Related Documents

- `docs/project/TESTING_REQUIREMENTS.md` - Testing guidelines
- `docs/project/TECHNICAL_DEEP_DIVE.md` - Architecture overview
- `README.md` - Project overview

---

## 📝 Quick Checklist

Before notifying completion:

```
□ All work committed to assigned branch
□ All tests passing
□ Changes pushed to remote
□ Documentation updated
□ Commit messages clear
□ No new branches created
□ Ready for review notification prepared
```

---

**Questions?** Ask the team lead or refer to existing documentation.

**This document applies to all Claude Code sessions - read it at the start of each session!**
