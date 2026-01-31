# Resource Guide Project - CLAUDE.md

## Project Overview

The file "Resource guide.md" contains the outline of a comprehensive resource guide about Surviving Homelessness in San Luis Obispo.
This file is too large for you to read in completely, given your token limit (so use methods to read it in smaller chunks).
"Resource guide_es.md" is the same information, but in Spanish translation.

The Directory.md file contains name / website URL / physical address / contact phone & email / hours of operation information for the various programs, groups, and agencies mentioned in the resource guide.
Directory_es.md is the same information, but in Spanish translation.
Use this as the single source of truth for those data; cross-reference Directory entries from the Resource Guide rather than reproducing those data in the Resource Guide.

The About.md contains meta information about VivaSLO, its developers, and the underlying software.
It also contains some instructive material about how the site is organized and how its features work.
About_es.md is the same information, but in Spanish translation.

The web-app directory contains the progressive web app that displays this content to the user.

This project is being developed in a public GitHub repo.
It is deployed on Cloudflare.
The web app is available to the public at https://vivaslo.org/

### About The Target Audience of the Guide

The target audience for this guide is people who are homeless or at risk of homelessness in San Luis Obispo (SLO) County.

These people are typically financially poor, so this guide prioritizes resources that are free or very low-cost to access.
They often do not have a home of their own, so this guide prioritizes resources that do not require a fixed address.
Some are sheltered in homes not their own; others live in institutional settings (e.g. homeless shelters, transitional housing); others are unsheltered and live out of vehicles or out in the open.
Some have vehicles, some don't.
Many of them have cognitive disabilities, mental illnesses, chronic diseases, and addictions.
Some speak English as a second language, or have little English fluency. Some are functionally illiterate.
They have a variety of levels of digital literacy and of comfort with digital information access.
They are unlikely to have their own FAX machines, personal computers, scanners, or other such large devices.

## Task Instructions

### Improve Usability

1. **Make things maximally accessible to our target audience**
1. **Make the user interface intuitive and easy to use**
1. **Make it clear what things are interactive, and what those interactions will effect**
1. **Make it easy to find information (and to know where to look)**

### Improve Resource Data

1. **Where source annotations are missing, provide authoritative sources**
1. **Standardize formatting**: Use consistent markup for hyperlinks, phone numbers, date and time ranges, addresses, etc.
1. **Add important details**: For example, if an entry does not indicate eligiblity requirements, hours of operation, or a phone contact number, try to find those and add them to the entry.
1. **Maintain correct markdown**: You can use the `markdownlint` tool to verify this.
1. **Use simple English in draft text**: If you add text that is meant as to be inserted as-is into the guide (rather than as notes for the researchers and editors), take care to write that text in simple English that is easy to understand by the target audience — for example: use linear sentences without tangled clauses, simple verbs rather than progressive-tense verbs or compound verbs when possible, active voice, literal rather than idiomatic language, and basic vocabulary.
1. **Create Spanish translations as needed**: When contributors add or modify information in the English-language pages, make corresponding edits to the Spanish translations.

## Current State

### File Structure

- **Data format**: Markdown with HTML anchors for major sections and some specialized markup (e.g. map links)
- **Main data files**: `Resource guide.md`, `Directory.md`, `About.md` and their Spanish language `*_es.md` equivalents
- **Implementation**: Progressive Web App in `web-app/` directory

### Web App Documentation

The `web-app/` directory contains comprehensive documentation that you should refer to and keep up-to-date:

- **`web-app/README.md`**: User-facing documentation
  - Quick start guide for development
  - Build and deployment instructions
  - Feature list and browser support
  - Troubleshooting common issues
  - Update this when adding new features or changing user-facing functionality

- **`web-app/ARCHITECTURE.md`**: Technical architecture documentation
  - Detailed explanation of all modules and components
  - Data flow diagrams
  - Build process and scripts
  - State management and PWA features
  - Code style guidelines
  - **Important**: Update this document whenever you modify the codebase structure, add new modules, change the build process, or modify core functionality

When making changes to the web app code:
1. Update the relevant documentation files to reflect your changes
2. Keep the documentation accurate and thorough
3. Update version numbers and "last updated" dates in ARCHITECTURE.md
4. Ensure examples in documentation match actual code

### Major Resource Guide Sections (36 total)

1. Introduction (not part of TOC)
2. Hotlines and emergency contacts
3. Tips on self-advocacy and for communicating with service providers
4. Shelter / housing
5. Property storage options (short-term & long-term)
6. Food
7. Where to refill a water bottle
8. Transportation
9. Clothing
10. Laundry
11. Showers and hygiene
12. Health, medical care
13. Recovery, harm reduction, and other substance-related issues
14. Tattoo removal
15. End-of-life care, advance directives, hospice
16. Personal safety, deescalation, self-defense
17. Legal help & mediation, crime victim protection
18. IDs and other documents (how to obtain, replace, secure)
19. Mail drops, post office boxes, etc.
20. Banking and money management
21. Tax preparation
22. Acute financial needs
23. Navigating Social Security / SSDI / SSI / Survivors Benefits
24. Employment, job boards, etc.
25. Education, job skills training, certification, tutoring, literacy
26. Phones and phone service
27. Internet access / email / digital access assistance
28. Charging stations for devices
29. Resources for children, youth, and people with children
30. Peer support groups
31. Recreation, fitness, socializing, connection, religion, community integration, volunteering
32. Pet care and pet supplies
33. Disaster planning/prep
34. Advocacy & lobbying for homeless issues
35. Miscellaneous free items
36. Other guides, web pages, information sources

## Working Guidelines

- Prioritize accuracy and up-to-dateness of information

- Focus on practical, actionable information of use to the target audience

- Always hyperlink URLs, email addresses, and telephone numbers using appropriate markdown syntax and valid URLs

- Update any outdated information found in the existing content

- Verify contact information, hours, eligibility requirements, and services offered

- Annotate your information changes or additions with the URL of the source where you found the new information, to enable later verification

- Use this kebab format for phone numbers: 123-456-7890; convert phone numbers that use different formats, like those that put the area code in parentheses, to the kebab format. Omit the initial "1-" or "+1-" from U.S. numbers (but not from the tel URL).

- Use en-dashes for ranges, like $5–10, Monday–Friday, or 8am–5pm

- Prefer `*italicized*` markdown rather than all-caps for emphasis

- The Resource Guide outline is subject to future reorganization. For this reason, do not cross-reference sections by number (e.g. "See section 12") because those numbers may change; use the name of the section instead in such references. If the reference is to a section heading, also hyperlink the reference by using the anchor for that section heading (add an anchor if one does not exist).

- If you do not know a particular piece of information, and cannot find it on the web or elsewhere, do not just make something up that sounds plausible and do not fill in the gap with "it is probably X" or "it may be Y". Instead, note that you were unable to determine the information in reputable sources. This way human researchers can fill in those gaps with off-line investigation.

- "SLO" is a suitable abbreviation for "San Luis Obispo" in most contexts. If it may be ambiguous whether "SLO" or "San Luis Obispo" refers to the city or the county, make this explicit (e.g. "SLO city" or "SLO County").

- It is not usually necessary to include the state/zip-code (e.g. "CA, 98765") in a location, unless this is a resource that is typically accessed through the mail rather than in person

## Efficiency Helpers

### Current Date

Claude is sometimes confused about the current date (basing this perhaps on its build date or training date).
Claude can use the linux `date` command to determine the actual current date.

### Alphabetical Insertion in Directory.md

When adding new entries to Directory.md:

- Use `grep -n "^## <a id=" Directory.md` to see all agency anchors with line numbers
- Identify the correct alphabetical position by finding the entries immediately before and after
- Read a range of lines around the insertion point to verify exact placement: `sed -n '100,150p' Directory.md`
- Remember that entries starting with "The" are alphabetized by the word after "The" (e.g., "The Center" goes under C, not T)
- The abbreviation "St." is alphabetized as though it were the word "Saint"

### Unicode Character Pitfalls

When editing files with the Edit tool:

- Em-dashes (—), en-dashes (–), and hyphens (-) are different characters and won't match each other
- Curly quotes and apostrophes (“ ” ‘ ’) vs. straight quotes and apostrophes (" ') won't match
- Try not to replace curly quotes and apostrophes with their straight quote/apostrophe equivalents when you manipulate text. By default you may do this even if you do not explicitly intend to, so you may have to be especially intentional about this.
- If you get "String to replace not found" errors, read the exact text with the Read tool and copy it character-for-character
- When in doubt, use smaller, simpler replacement strings that avoid special characters, or use wildcards in place of apostrophes and quotation marks when doing searches
- The `cat -A` command can reveal hidden unicode characters if troubleshooting is needed

### Agency vs. Program Distinction

Not everything needs a separate Directory entry:

- **Needs Directory entries**: Independent agencies, organizations with their own governance, programs that are separable (have their own location, phone number, hours of operation, etc. distinct from their parent agency)
- **Program notes under existing entries**: Programs operated by larger organizations (e.g., "Head Start" is a CAPSLO program, not separate)
- **Cross-reference patterns**:
   - If it's a program: mention it in the parent organization's Note(s) field
   - If it's an independent agency: create a separate Directory entry
   - Commercial businesses mentioned in passing (storage facilities, gyms) don't need Directory entries unless they have specific programs for homeless individuals

### Geographic Boundaries

The main regions to be covered by the guide this outline describes are the following:

- **SLO city**: San Luis Obispo city proper (plus California Polytechnic State University San Luis Obispo a.k.a. Cal Poly)
- **Five Cities**: Pismo Beach, Arroyo Grande, Oceano, Grover Beach, Shell Beach
- **Avila Beach**: a town between SLO and Five Cities
- **SLO County**: All of San Luis Obispo County, including rural unincorporated areas
- **North County**: Atascadero, Paso Robles, Templeton, Santa Margarita, Shandon, Creston, San Miguel, etc. area
- **North Coast**: Cambria, Cayucos, Harmony, San Simeon
- **Estero Bay**: Morro Bay, Los Osos, Baywood Park
- **South County**: Los Berros, Nipomo, Woodlands, Callender

Santa Maria, Orcutt, Guadalupe, and Betteravia are just across the county's southern border in Santa Barbara county, and there is often some overlap between services offered there and in SLO's South County area.

### Formatting Quick Reference

- Phone: `805-123-4567` (kebab format, no +1 or 1-); append e.g. `&nbsp;x5` to indicate "extension 5"
- Time ranges: `8am–5pm` (en-dash, not hyphen)
- Price ranges: `$5–10` (en-dash)
- Day ranges: `Monday–Friday` (en-dash)
- Emphasis: `*italicized*` not ALL CAPS
- Source: `<!-- Source: https://domain.com/including/pagename.html -->`
- You can use the `markdownlint` tool to check that the markdown is formatted correctly

### Sections Often Needing Attention

Based on common patterns, these sections frequently need verification:

- **Contact information** - Phone numbers and/or email addresses and/or web forms
- **Eligibility requirements** - Is the program restricted to people of a certain region, age group, income level? to people with/without health insurance? does it screen out people with PC290 legal status? How can people demonstrate their eligibility (e.g. do they need certain documentation)?
- **Access** - Can people access the service directly, or do they need to be referred from another agency?
- **Pricing/costs** - Fees and assistance amounts change
- **Location** - Where people can access the service
- **Hours** - Days and hours of operation
- **URLs** - Websites reorganize, creating broken links (URLs should use https when the site supports it)

## Tools

- `wrangler` is available at the command line
