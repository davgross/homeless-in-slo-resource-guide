# Resource Guide Project - CLAUDE.md

## Project Overview

The file @"Resource guide possible outline.md" contains the outline of a to-be-written comprehensive resource guide titled "Surviving Homelessness in San Luis Obispo."
This file is too large for you to read in completely, given your token limit (so use methods to read it in smaller chunks).

The @Directory.md file contains name / website URL / physical address / contact phone & email / hours of operation information for the various programs, groups, and agencies mentioned in the resource guide outline.
This can be used as a single source of truth for those data, and can be cross-referenced as such from the resource guide outline.

### About The Target Audience of the Guide
Most of the text in this outline is intended for the researchers and editors of this guide.

The target audience for the guide this outline describes is people who are homeless or at risk of homelessness in San Luis Obispo city and the SLO County's five cities area.

These people are typically financially poor, so this guide prioritizes resources that are free or very low-cost to access.
They often do not have a home of their own, so this guide prioritizes resources that do not require a fixed address that is not a shelter.
Some are sheltered in homes not their own; others are unsheltered and live out of vehicles or out in the open.
Some have vehicles, some don't.
Many of them have cognitive disabilities, mental illnesses, chronic diseases, and addictions.
Some speak English as a second language, or have very little English fluency.
They have a variety of levels of digital literacy and of comfort with digital information access.
They are unlikely to have their own FAX machines, personal computers, scanners, or other such large devices.

## Task Instructions

The primary task is to flesh out the existing outline with more complete and detailed information. Key requirements:

1. **Use reputable and recent sources**: All information must come from reliable, up-to-date sources
   - The best source for information about an agency is usually that agency's own website
   - The further you get from that, the more important it is that you double-check the information, and annotate where you found the information
2. **Source annotation**: Annotate information with the URL of the source where the information can be found, to enable later verification
   - Use a format like this: `Source: [domain.com](https://www.domain.com/full/url/to/source-of-truth.html)`
   - These annotation links should target the precise page on which the information was found, not just the homepage of the website or the domain name
3. **Geographic focus**: San Luis Obispo city and SLO County's five cities area
   - But we may also mention state-wide, county-wide, or country-wide resources that are available to people in the target region
4. **Target audience**: Prioritize resources of use to the target audience, and provide information they will need in a format they can use

Other tasks include:

1. **Organize the material well** and remove redundancies
2. **Where source annotations are missing, provide and hyperlink to authoritative sources**
3. **Prune out inappropriate material**: things that are not relevant to our target audience
   - for things that are not yet (or are no longer) available, it is better to note this in the listing than to remove the listing entirely, so that we don't go through the anti-pattern of finding information on the web, adding a listing for it, removing it for being inappropriate upon further research, then adding it again when we discover it again
4. **Standardize formatting**: Use consistent markup for hyperlinks, phone numbers, date and time ranges, addresses, etc.
5. **Cross-reference listings**: For example, if an agency mentioned in the "Housing" section notes that it offers mail drop service, make sure there is also a reference to that agency in the "Mail drops" section.
6. **Use simple English in draft text**: If add text that is meant as draft text to be inserted into the guide (rather than as notes for the researchers and editors), take care to write that text in simple English that is easy to understand by the target audience — for example: use linear sentences without tangled clauses, simple verbs rather than progressive-tense verbs when possible, active voice, literal rather than idiomatic language, and basic vocabulary.
7. **Add important details**: For example, if an entry does not indicate eligiblity requirements, hours of operation, or a phone contact number, try to find those and add them to the entry.

## Current State

The outline contains several major sections; the opening table of contents lists these.

### File Structure
- **Total length**: over 3000 lines
- **Format**: Markdown with HTML anchors for major sections
- **Main files**: `Resource guide possible outline.md`, `Directory.md`

### Major Sections (37 total)
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
If you see a bullet-point marked "To-do", this represents a task that you might be able to accomplish to improve this outline.
If you can do so efficiently and reputably (without hallucinating or relying on unreliable sources), do so.
If you cannot, change the "To-do:" to something like "Note:" and append a parenthetical remark about why you were unable to accomplish this yourself (this way you will not keep seeing the "To-do" and trying futilely to do it again and again).

There is a separate health care / medical guide that is already well-researched and -maintained, so this outline will mostly just defer to that one for those topics, except for a few possible supplementary subsections which are listed in the outline.

There are guides produced by other agencies that do a good job of describing a variety of services for veterans and for seniors, so we don't have to pursue those resources in as much detail; we can just defer to those other guides.

## Working Guidelines

- Prioritize accuracy and up-to-dateness of information

- Focus on practical, actionable information of use to the target audience

- Always hyperlink URLs and email addresses using appropriate markdown syntax

- Update any outdated information found in the existing content

- Verify contact information, hours, eligibility requirements, and services offered

- Annotate your information changes or additions with the URL of the source where you found the new information, to enable later verification

- Use this kebab format for phone numbers: 123-456-7890; convert phone numbers that use different formats, like those that put the area code in parentheses, to the kebab format. Omit the initial "1-" or "+1-" from U.S. numbers.

- Use en-dashes for ranges, like $5–10, Monday–Friday, or 8am–5pm

- Prefer `*italicized*` markdown rather than all-caps for emphasis

- If you need to retrieve a resource from the web, just do it; don't ask first. For example, you have permission to use your web fetch API to retrieve documents from the web by using your own judgment; you do not have to ask permission before fetching a resource from the web. Do not ask permission if you can help it, but just execute the fetch.

- Note that this outline is subject to future reorganization. For this reason, do not cross-reference sections by number (e.g. "See section 12") because those numbers may change; use the name of the section instead in such references. If the reference is to a top-level section, also hyperlink the reference using the anchor for that section.

- If you do not know a particular piece of information, and cannot find it on the web or elsewhere, do not just make something up that sounds plausible and do not fill in the gap with "it is probably X" or "it may be Y". Instead, note that you were unable to determine the information in reputable sources. This way human researchers can fill in those gaps with off-line investigation.

- "SLO" is a suitable abbreviation for "San Luis Obispo" in most contexts. If it may be ambiguous whether "SLO" or "San Luis Obispo" refers to the city or the county, make this explicit (e.g. "SLO city" or "SLO county").

- It is not usually necessary to include the state/zip-code (e.g. "CA, 98765") in a location, unless this is a resource that is typically accessed through the mail rather than in person

## Efficiency Helpers

### Common Search Patterns
When working on the outline, these search patterns are frequently useful:
- `grep -n "To-do"` - Find remaining To-do items
- `grep -n "<a id="` - Find major section headings
- `grep -n "Source:"` - Find existing source annotations

### Key Local Agencies (Frequently Referenced)
- **CAPSLO** (Community Action Partnership SLO): [capslo.org](https://capslo.org/) - 805-544-4355
- **ECHO** (El Camino Homeless Organization): [echoshelter.org](https://www.echoshelter.org/) - 805-462-3663
- **5Cities Homeless Coalition**: [5chc.org](https://5chc.org/)
- **40 Prado Homeless Services Center**: CAPSLO-operated, SLO city

### Geographic Boundaries
The main regions to be covered by the guide this outline describes are the following:
- **SLO city**: San Luis Obispo city proper (plus California Polytechnic State University San Luis Obispo a.k.a. Cal Poly)
- **Five Cities**: Pismo Beach, Arroyo Grande, Oceano, Grover Beach, Shell Beach

Other county regions include:
- **SLO County**: All of San Luis Obispo County
- **Avila Beach**: between SLO and Five Cities
- **North County**: Atascadero, Paso Robles, Templeton, Santa Margarita, Shandon, Creston, etc. area
- **North Coast**: Cambria, Cayucos, Harmony, San Simeon
- **Estero Bay**: Morro Bay, Los Osos, Baywood Park
- **South County**: Los Berros, Nipomo, Woodlands, Callender

Santa Maria, Orcutt, Guadalupe, and Betteravia are just across the county's southern border in Santa Barbara county, and there is often some overlap between services offered there and in SLO's South County.

### Formatting Quick Reference
- Phone: `805-123-4567` (kebab format, no +1 or 1-)
- Time rangess: `8am–5pm` (en-dash, not hyphen)
- Price ranges: `$5–10` (en-dash)
- Day ranges: `Monday–Friday` (en-dash)
- Emphasis: `*italicized*` not ALL CAPS
- Source: `Source: [domain.com](https://domain.com/including/pagename.html)`

### Sections Often Needing Attention
Based on common patterns, these sections frequently need verification:
- **Contact information** - Phone numbers and/or email addresses and/or web forms
- **Eligibility requirements** - Is the program restricted to people of a certain region, age group, income level? to people with/without health insurance? does it screen out people with PC290 legal status? How can people demonstrate their eligibility (e.g. do they need certain documentation)?
- **Access** - Can people access the service directly, or do they need to be referred from another agency?
- **Pricing/costs** - Fees and assistance amounts change
- **Location** - Where people can access the service
- **Hours** - Days and hours of operation
- **URLs** - Websites reorganize, creating broken links

### Quick Tasks to Check Periodically
1. Verify all phone numbers are in kebab format (123-456-7890)
2. Ensure all URLs use https when the site supports it
3. Check that source annotations point to specific pages, not homepages (unless the home page is where the information is found)
4. Convert ALL CAPS text, when used for emphasis, to *italicized* text
5. Replace hyphens with en-dashes in ranges (8am–5pm, $5–10)
6. Verify internal cross-references use section names, not numbers (as the outline organization may change)
