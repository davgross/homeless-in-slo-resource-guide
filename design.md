# SLO County Homeless Resource Guide

This progressive web app has three main sections:

1. **Resources:** Category-specific pages with descriptive paragraphs explaining available resources, with links to relevant Directory entries
1. **Directory:** Detailed contact information, hours, and specifics for each agency
1. **About:** How to report errors or improvement suggestions, about-us stuff, disclaimers

There are also a few map pages that show the locations of little free pantries, little free libraries, and naloxboxes.

## Navigation

The user starts in the **Resources** section.

It has an Index.
Index links lead to **Resource** sections with explanatory content.
Resource descriptions contain links to **Directory** entries that open in a visually-distinctive **Directory** modal.

## User Experience Priorities

- Mobile-first design (phones, tablets, desktops); assume most users access via phones
- Accessibility-aware (color blindness, cognitive challenges, limited literacy)
- Simple, intuitive interface with clear visual section distinctions
- Fast loading with few or no server requests during operation
- Cross-browser compatible
- State persistence: Return users to their previous location within each section
- Visual link distinction: Internal vs. external URLs clearly marked, icons indicate click actions (phone, email, location)
- Smart hyperlinks: Phone numbers, emails, URLs, and physical addresses all clickable
- Map integration: Addresses open user's preferred map app with location centered
- Searchable
- Easy for users to give useful feedback to developers (about e.g. outdated information)

## Content Structure

- Structured **Directory** entries mostly have standardized information (website/phone/email/location/hours/etc.)
- **Resources** mostly in paragraph form, maybe with occasional tables and lists
- Integrated internal comments system for things like verification dates and methods, agency contacts, and data quality notes, visible to developers but not to the end user

## Development Features

- Easy data editing interface for quick onboarding of editors and fact-checkers
- Automated validation: Pre-build checks for broken internal links and data syntax
- Easy deployment: Simple rebuild/redeploy process for frequent data updates

## Hosting

- Standalone deployment with dedicated, memorable URL (vivaslo.org).
- Independent of existing Shower the People WordPress site.
- Optimized for frequent content updates.

Currently hosted at Cloudflare as homeless-in-slo-resource-guide.pages.dev and vivaslo.org.
Deployments are automatic based on the state of the git repo https://github.com/davgross/homeless-in-slo-resource-guide.

## Branding

- This is a project of the "Shower the People" nonprofit.
- This nonprofit uses Monserrat Alternates Bold as its brand font
- Its brand colors are white (#ffffff), blue (#3877ff), and orange (#e75e13)
- It would be nice if the colors used in this project harmonize with the Shower the People brand colors, but prioritize legibility and accessibility (to e.g. the colorblind) even if this means disregarding brand colors
