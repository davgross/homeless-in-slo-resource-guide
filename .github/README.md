# GitHub Configuration

This directory contains GitHub Actions workflows and optional Git hooks for the Resource Guide project.

## Workflows

### pr-checks.yml

Automated checks that run on all pull requests to the `main` branch. These checks help maintain quality without blocking merges.

#### What it checks:

1. **Translation Sync** (Warning only)
   - Detects when English files (`About.md`, `Directory.md`, `Resource guide.md`) are modified without corresponding changes to Spanish versions (`*_es.md`)
   - Provides a warning to remind you to update translations
   - Does NOT block the merge

2. **Broken Internal Links** (Warning only)
   - Detects removed or renamed `<a id="...">` anchors
   - Warns that saved/shared links may break
   - Suggests keeping old anchors or documenting changes
   - Does NOT block the merge

3. **Markdown Lint** (Fails on error)
   - Runs `npm run lint:sources` using remark
   - Checks markdown formatting and style
   - WILL block merge if errors are found (should be fixed)

4. **Spell Check** (Fails on error)
   - Runs `node spell-check.cjs`
   - Checks for spelling errors
   - WILL block merge if errors are found (should be fixed)

#### How to interpret results:

- ✅ **Green checkmarks**: All good
- ⚠️ **Warnings**: Review but won't block merge
- ❌ **Red X**: Failures that should be fixed before merging

You can see detailed results in:
- The "Checks" tab on your pull request
- The "Summary" section of each workflow run

#### Configuring the workflow:

To modify which files trigger the workflow, edit the `paths:` section in `.github/workflows/pr-checks.yml`.

To adjust translation pairs, edit the `check-translation-sync` job.

## Optional Local Pre-Commit Hook

For catching issues before you even push, you can install a local pre-commit hook:

```bash
# From the repo root:
cp .github/pre-commit-hook .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

This hook will:
- Check translation sync
- Run markdown lint
- Run spell check
- Prompt you to continue or abort if issues are found

To skip the hook for a specific commit:
```bash
git commit --no-verify -m "your message"
```

## Testing Locally

You can run the same checks locally before pushing:

```bash
# Translation sync (manual check)
git diff --name-only main...HEAD | grep -E "^(About|Directory|Resource guide)"

# Markdown lint
npm run lint:sources

# Spell check
node spell-check.cjs

# Check for anchor changes (manual)
git diff main...HEAD | grep '<a id='
```

## Disabling Checks

If you need to temporarily disable a check:

1. **For a specific PR**: Add `[skip ci]` to your commit message
2. **Permanently**: Comment out or delete the relevant job in `pr-checks.yml`
3. **For local hook**: Use `git commit --no-verify`

## Troubleshooting

**"npm ci" fails**: Make sure `package.json` and `package-lock.json` are committed

**Spell check fails unexpectedly**: Check that your custom dictionary is up to date

**Anchor check gives false positives**: The check is case-sensitive and whitespace-sensitive. Ensure exact matches.

**Translation warnings on non-content changes**: Adjust which types of changes trigger warnings by modifying the git diff parameters in the workflow.
