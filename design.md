# SLO County Homeless Resource Guide

The app has three sections:

1. **Resources:** Category-specific pages with descriptive paragraphs explaining available resources, with links to relevant Directory entries
1. **Directory:** Detailed contact information, hours, and specifics for each agency
1. **About:** How to report errors or improvement suggestions, about-us stuff, disclaimers

This resembles the structure of the existing [“Health and Medical Care Resources” PDF guide](https://showerthepeopleslo.org/wp-content/uploads/2025/08/Health-and-Medical-Care-Resources.pdf): TOC → introduction → resource descriptions → detailed directory.

## Navigation

The user starts in the **Resources** section, at something like [the table of contents here](https://github.com/davgross/homeless-in-slo-resource-guide/blob/main/Resource%20guide%20possible%20outline.md#table-of-contents).

ToC links lead to **Resource** pages with explanatory content.
Resource descriptions contain links to **Directory** entries that open in a visually-distinctive **Directory** frame.
**Directory** links either show specific entries or display the full directory with the relevant item highlighted and on-screen.
We might consider split-screen layout (**Resource** + **Directory**) when screen space permits.

## User Experience Priorities

- Mobile-first design (phones, tablets, desktops); assume most users access via phones
- Accessibility-aware (color blindness, cognitive challenges, limited literacy)
- Simple, intuitive interface with clear visual section distinctions
- Fast loading with few or no server requests during operation
- Cross-browser compatible
- State persistence: Return users to their previous location within each section
- Clear hierarchy navigation: Home/back/forward controls for **Resource** and **Directory** sections
- Visual link distinction: Internal vs. external URLs clearly marked, icons indicate click actions (phone, email, location)
- Smart hyperlinks: Phone numbers, emails, URLs, and physical addresses all clickable
- Map integration: Addresses open user's preferred map app with location centered
- Search feature of some sort?

## Content Structure

- Structured **Directory** entries mostly have standardized information (website/phone/email/location/hours/etc.)
- **Resources** mostly in paragraph form, maybe with occasional tables and lists
- Integrated internal comments system for things like verification dates and methods, agency contacts, and data quality notes, visible to us but not to the end user

## Development Features

- Easy data editing interface for quick onboarding of editors and fact-checkers
- Automated validation: Pre-build checks for broken internal links and data syntax
- Easy deployment: Simple rebuild/redeploy process for frequent data updates

## Hosting

- Standalone deployment with dedicated, memorable URL.
- Independent of existing WordPress site.
- Optimized for frequent content updates.
