# Resource Guide Project - CLAUDE.md

## Project Overview

The file @"Resource guide.md" contains the outline of a comprehensive resource guide tenatively titled "Surviving Homelessness in San Luis Obispo."
This file is too large for you to read in completely, given your token limit (so use methods to read it in smaller chunks).
It was originally written as a long nested list, but is transitioning to headings and prose paragraphs.

The @Directory.md file contains name / website URL / physical address / contact phone & email / hours of operation information for the various programs, groups, and agencies mentioned in the resource guide outline.
Use this as the single source of truth for those data; cross-reference Directory entries from the Resource Guide rather than reproducing those data in the Resource Guide.

The @design.md file gives some high-level direction about the web app that will present this data to the user.

The @web-app directory is your attempt to create such an app.

### About The Target Audience of the Guide

The target audience for the guide this outline describes is people who are homeless or at risk of homelessness in San Luis Obispo (SLO) County.

These people are typically financially poor, so this guide prioritizes resources that are free or very low-cost to access.
They often do not have a home of their own, so this guide prioritizes resources that do not require a fixed address.
Some are sheltered in homes not their own; others live in institutional settings (e.g. homeless shelters, transitional housing); others are unsheltered and live out of vehicles or out in the open.
Some have vehicles, some don't.
Many of them have cognitive disabilities, mental illnesses, chronic diseases, and addictions.
Some speak English as a second language, or have little English fluency. Some are functionally illiterate.
They have a variety of levels of digital literacy and of comfort with digital information access.
They are unlikely to have their own FAX machines, personal computers, scanners, or other such large devices.

## Task Instructions

### Improve Resource Data

Flesh out the existing guide with more complete, detailed, and accurate information. Key requirements:

1. **Use reputable and recent sources**: All information must come from reliable, up-to-date sources
   - The best source for information about an agency is usually that agency's own website
   - The further you get from that, the more important it is that you double-check the information, and annotate where you found the information
2. **Source annotation**: Annotate information with the URL of the source where the information can be found, to enable later verification
   - Use a format like this: `<!-- Source: https://www.domain.com/full/url/to/source-of-truth.html -->`
   - These annotation links should target the precise page on which the information was found, not just the homepage of the website or the domain name
3. **Geographic focus**: San Luis Obispo County
   - But we may also mention state-wide or country-wide resources that are available to people in the target region
4. **Target audience**: Prioritize resources of use to the target audience, and provide information they will need in a format they can use

Other tasks include:

1. **Organize the material well**
2. **Where source annotations are missing, provide authoritative sources**
3. **Prune out inappropriate material**: things that are not relevant to our target audience
   - this includes things that are only available to people outside SLO County
   - for things that are not yet (or are no longer) available, it is better to note this in the listing than to remove the listing entirely, so that we don't go through the anti-pattern of finding information on the web, adding a listing for it, removing it for being inappropriate upon further research, then adding it again when we discover it again
4. **Standardize formatting**: Use consistent markup for hyperlinks, phone numbers, date and time ranges, addresses, etc.
5. **Cross-reference listings**: For example, if an agency mentioned in the "Housing" section notes that it offers mail drop service, make sure there is also a reference to that agency in the "Mail drops" section.
6. **Add important details**: For example, if an entry does not indicate eligiblity requirements, hours of operation, or a phone contact number, try to find those and add them to the entry.
7. **Divide information correctly between the resource guide and the directory**: Typically keep location / phone / email / hours of operation information in the Directory, with specifics about what a particular resource offers in the Resource Guide. Exceptions to this may include when a phone number (or location, email, hours) is relevant to a particular service offered by the agency rather than to the agency as a whole, in which case it might be more sensible to mention these specifics in the Resource Guide.
8. **Maintain correct markdown**: You can use the `markdownlint` tool to verify this.
9. **Use simple English in draft text**: If you add text that is meant as to be inserted as-is into the guide (rather than as notes for the researchers and editors), take care to write that text in simple English that is easy to understand by the target audience — for example: use linear sentences without tangled clauses, simple verbs rather than progressive-tense verbs or compound verbs when possible, active voice, literal rather than idiomatic language, and basic vocabulary.
10. **Transition to prose**: In @"Resource guide.md", once we have collected enough raw notes, rewrite that information as easy-to-read and well-organized paragraphs, containing the information most useful and relevant to our target audience. Our site style for prose sections is to have one complete sentence per line of markdown, so a paragraph of four sentences will consist of four consecutive lines of markdown.

## Current State

The outline contains several major sections; the table of contents lists these.

### File Structure

- **Data format**: Markdown with HTML anchors for major sections
- **Main data files**: `@Resource guide.md`, `@Directory.md`
- **Implementation**: See "Project Structure" in `@web-app/README.md`

### Major Outline Sections (37 total)

1. Introduction
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
29. Resources specific to particular subgroups
30. Peer support groups
31. Recreation, fitness, socializing, connection, religion, community integration, volunteering
32. Pet care and pet supplies
33. Disaster planning/prep
34. Advocacy & lobbying for homeless issues
35. Miscellaneous free items
36. Other guides, web pages, information sources
37. Miscellaneous tips

### Section Development Status

If you see a "To-do:", this represents a task that you might be able to accomplish to improve these documents.
If you can do so efficiently and reputably (without hallucinating or relying on unreliable sources), do so.
If you cannot, change the "To-do:" to something like "Note:" and append a parenthetical remark about why you were unable to accomplish this yourself (this way you will not keep seeing the "To-do" and trying futilely to do it again and again).

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

- If you need to retrieve a page from the web, just do it; don't ask first. You have permission to use your web fetch API to retrieve documents from the web by using your own judgment.

- The Resource Guide outline is subject to future reorganization. For this reason, do not cross-reference sections by number (e.g. "See section 12") because those numbers may change; use the name of the section instead in such references. If the reference is to a section heading, also hyperlink the reference by using the anchor for that section heading (or add an anchor if one does not exist).

- If you do not know a particular piece of information, and cannot find it on the web or elsewhere, do not just make something up that sounds plausible and do not fill in the gap with "it is probably X" or "it may be Y". Instead, note that you were unable to determine the information in reputable sources. This way human researchers can fill in those gaps with off-line investigation.

- "SLO" is a suitable abbreviation for "San Luis Obispo" in most contexts. If it may be ambiguous whether "SLO" or "San Luis Obispo" refers to the city or the county, make this explicit (e.g. "SLO city" or "SLO county").

- It is not usually necessary to include the state/zip-code (e.g. "CA, 98765") in a location, unless this is a resource that is typically accessed through the mail rather than in person

## Efficiency Helpers

### Common Search Patterns

When working on the outline, these search patterns are frequently useful:

- `grep -n "To-do"` - Find remaining To-do items
- `grep -n "<a id="` - Find major section headings

### Current Date

Claude is sometimes confused about the current date (basing this perhaps on its build date or training date, perhaps).
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
- Try not to replace curly quotes and apostrophes with their straight quote/apostrophe equivalents when you manipulate text.
- If you get "String to replace not found" errors, read the exact text with the Read tool and copy it character-for-character
- When in doubt, use smaller, simpler replacement strings that avoid special characters, or use wildcards in place of apostrophes and quotation marks when doing searches
- The `cat -A` command can reveal hidden unicode characters if troubleshooting is needed

### Agency vs. Program Distinction

Not everything needs a separate Directory entry:

- **Needs Directory entries**: Independent agencies, organizations with their own governance, programs that are separable (have their own location, phone number, hours of operation, etc. distinct from their parent agency)
- **Program notes under existing entries**: Programs operated by larger organizations (e.g., "Head Start" is a CAPSLO program, not separate)
- **Cross-reference patterns**:
   - If it's a program: mention it in the parent organization's Notes field
   - If it's an independent agency: create a separate Directory entry
   - Commercial businesses mentioned in passing (storage facilities, gyms) don't need Directory entries unless they have specific programs for homeless individuals

### Key Local Agencies (Frequently Referenced)

- **CAPSLO** (Community Action Partnership SLO): [capslo.org](https://capslo.org/)
   - **40 Prado Homeless Services Center**: CAPSLO-operated, SLO city
- **ECHO** (El Camino Homeless Organization): [echoshelter.org](https://www.echoshelter.org/)
- **5Cities Homeless Coalition**: [5chc.org](https://5chc.org/)

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
