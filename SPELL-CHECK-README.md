# Spell Check Tool

A markdown-aware spell checker for the Resource Guide project.

## Usage

Run the spell checker:

```bash
node spell-check.cjs
```

This will check:
- `Directory.md`
- `Resource guide.md`
- `About.md`

## How It Works

The spell checker:

1. **Skips markdown syntax**: Code blocks, inline code, link URLs, HTML tags, etc.
2. **Uses a custom whitelist**: Domain-specific terms like place names, organization names, and common abbreviations
3. **Skips common patterns**: URLs, email addresses, phone numbers, dates, etc.
4. **Flags suspicious words**: Words with unusual letter patterns or not in the whitelist

## Maintaining the Whitelist

When the spell checker flags valid words, add them to the `WHITELIST` constant in `spell-check.cjs`:

```javascript
const WHITELIST = new Set([
  // Place names
  'SLO', 'Obispo', 'Atascadero', ...

  // Organizations and agencies
  'CAPSLO', 'ECHO', 'CHC', ...

  // ... etc
]);
```

The whitelist is organized into categories:
- **Place names**: Cities, neighborhoods, streets
- **Organizations and agencies**: Nonprofits, government agencies, programs
- **Common abbreviations**: Days, times, acronyms
- **Street types and common words**: Common address components
- **Program/service names**: Specific program names
- **Names**: People, buildings, facilities
- **Misc**: Other valid terms

## Understanding Results

The output shows:
- Number of potentially misspelled words in each file
- Each flagged word with:
  - Frequency count (e.g., `8x` = appears 8 times)
  - Line numbers where it appears

Example:
```
• "cfsslo" (3x) on line(s): 672, 1975, 2128
```

This means "cfsslo" appears 3 times, on lines 672, 1975, and 2128.

## What Gets Flagged

The spell checker is designed to be conservative and may flag:

1. **Parts of email addresses/URLs**: Sometimes domain parts get extracted as separate words
2. **Organization shorthand**: Website usernames like "frontporchslo" or "post66slo"
3. **Proper nouns**: Brand names, person names, unique facility names
4. **Technical terms**: Specialized vocabulary
5. **Actual typos**: The thing we're looking for!

## What Doesn't Get Flagged

The spell checker automatically skips:
- URLs (starting with http://, https://)
- Email addresses (contains @)
- Phone numbers (###-###-####)
- Path fragments (contains /)
- Pure numbers
- Date ranges (M/W/F, Tu/W/Th)
- Extension numbers (x123)
- HTML entities (&#...)
- Common domain extensions (.com, .org, .gov)
- All-caps acronyms (assumed to be valid)
- Words in the WHITELIST

## Adding to Skip Patterns

If you need to skip additional patterns, edit the `SKIP_PATTERNS` array in `spell-check.cjs`:

```javascript
const SKIP_PATTERNS = [
  /^https?:\/\//i,           // URLs
  /^mailto:/i,               // Email links
  // ... add your pattern here
];
```

## Tips for Using Results

1. **Review flagged words**: Not everything flagged is a typo
2. **Check context**: Use the line numbers to see the word in context
3. **Add to whitelist**: If a flagged word is valid and appears frequently, add it to the whitelist
4. **Fix typos**: When you find actual misspellings, fix them in the source files
5. **Re-run**: After making changes, run the spell checker again to verify

## Limitations

This is a basic spell checker that:
- Doesn't use a full English dictionary (relies on pattern matching)
- May miss some typos (false negatives)
- May flag valid words (false positives)
- Works best when the whitelist is well-maintained

For best results, combine with:
- Manual proofreading
- Editor spell checkers (which often have better dictionaries)
- Peer review

## Example Workflow

1. Run the spell checker: `node spell-check.cjs`
2. Review the output
3. For each flagged word:
   - If it's a typo → fix it in the source file
   - If it's valid and common → add to WHITELIST in spell-check.cjs
   - If it's valid but rare → leave as-is (optional: add a comment)
4. Re-run to verify: `node spell-check.cjs`
5. Repeat until satisfied

## Future Improvements

Possible enhancements:
- Use a real English dictionary (like Hunspell)
- Interactive mode to add words to whitelist
- Configuration file for whitelist (separate from code)
- Ignore specific line ranges or sections
- Output formats (JSON, CSV, etc.)
- Integration with CI/CD
