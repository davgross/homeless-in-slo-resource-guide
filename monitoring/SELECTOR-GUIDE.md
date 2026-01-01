# CSS/XPath Selector Customization Guide

This guide explains how to fine-tune what parts of web pages Changedetection.io monitors using CSS selectors and XPath expressions.

## Why Customize Selectors?

By default, Changedetection.io monitors the entire page body. This can lead to false positives when:
- Navigation menus, headers, or footers change
- Advertisements rotate
- "Last updated" timestamps change
- Social media widgets update
- Analytics or tracking scripts change

Using CSS/XPath selectors, you can monitor only the relevant content sections (like contact info, hours of operation, or service descriptions).

## Basic Workflow

1. **Open the watch** in Changedetection.io web interface (http://localhost:5000)
2. **Click "Edit"** on any watch
3. **Scroll to "Filters & Triggers"** section
4. **Add your selector** in either:
   - **"CSS/JSON/XPath Filter"** field for CSS selectors
   - **"XPath"** option for XPath expressions

## CSS Selector Examples

### Common Patterns for Resource Guide Sources

#### Example 1: Main Content Area
Most websites have a main content area that excludes headers/footers:

```css
main
```
or
```css
#content
```
or
```css
.main-content
```

#### Example 2: Specific Sections
Target specific content sections by ID or class:

```css
#contact-info
```
```css
.hours-of-operation
```
```css
.services-list
```

#### Example 3: Multiple Elements
Monitor multiple sections (comma-separated):

```css
#contact, #hours, #services
```

#### Example 4: Exclude Elements
Monitor main content but exclude certain elements:

```css
main :not(nav):not(footer):not(.ads)
```

### Finding the Right Selector

**Using Browser Developer Tools:**

1. Visit the source website in your browser
2. Right-click on the content you want to monitor
3. Select **"Inspect"** or **"Inspect Element"**
4. In the developer tools, right-click the highlighted HTML element
5. Choose **"Copy → Copy selector"** (Chrome) or **"Copy → CSS Selector"** (Firefox)
6. Paste this into Changedetection.io's filter field

**Example:** For CAPSLO hours of operation:
```css
div.field--name-field-hours-of-operation
```

### Testing Your Selector

In the Edit Watch screen:
1. Add your CSS selector
2. Click **"Preview"** button at the bottom
3. Changedetection.io will show you what content matches your selector
4. Adjust if needed

## XPath Expression Examples

XPath is more powerful but more complex than CSS selectors.

### Basic XPath Patterns

#### Example 1: Select by Text Content
Find elements containing specific text:

```xpath
//*[contains(text(), 'Contact Us')]
```

#### Example 2: Select by Heading
Find content under a specific heading:

```xpath
//h2[contains(text(), 'Hours')]/following-sibling::*
```

#### Example 3: Select by Attributes
Find elements with specific attributes:

```xpath
//div[@class='contact-info']
```

#### Example 4: Complex Selection
Select paragraphs within a specific section:

```xpath
//section[@id='services']//p
```

### Finding the Right XPath

**Using Browser Developer Tools:**

1. Visit the source website
2. Right-click the content you want to monitor
3. Select **"Inspect"**
4. In the developer tools, right-click the highlighted HTML element
5. Choose **"Copy → Copy XPath"** or **"Copy → Copy full XPath"**
6. Paste into Changedetection.io

**Note:** "Copy full XPath" gives you an absolute path (like `/html/body/div[2]/main/div[1]/...`) which is fragile and breaks if the page structure changes. "Copy XPath" usually gives a shorter, more robust expression.

## Practical Examples for Common Resource Types

### Non-Profit Organizations

Most non-profits have similar page structures. Here are patterns that often work:

```css
/* Contact information */
.contact-info, #contact

/* Hours of operation */
.hours, .business-hours, #hours-of-operation

/* Services section */
.services, #services, .programs

/* Main content excluding navigation */
main article
```

### Government Websites (.gov domains)

Government sites often use semantic HTML:

```css
/* Main content area */
main

/* Service descriptions */
.service-description

/* Contact information */
.contact, .agency-contact
```

### Directory/Listing Pages

For directory pages (like 211 databases):

```css
/* Individual listing */
.listing-item

/* Organization details */
.organization-details

/* Exclude search form and filters */
main :not(form):not(.filters)
```

## Advanced Techniques

### 1. Ignore Dynamic Elements

Exclude elements that change frequently but aren't important:

```css
/* Monitor main content but ignore timestamps and ads */
main :not(.timestamp):not(.last-updated):not(.ad):not(footer)
```

### 2. Monitor Only Text Content

Use the **"Text only"** option in Changedetection.io (under Fetching settings) to:
- Ignore HTML structure changes
- Focus only on text content changes
- Reduce false positives from formatting updates

### 3. Use Regular Expressions

In the **"Trigger text"** field under **"Filters & Triggers"**, add regex patterns to trigger only on specific changes:

```
(?i)(closed|shut down|discontinued|no longer available)
```

This alerts you if words like "closed" or "discontinued" appear.

### 4. Ignore Specific Text Patterns

In the **"Ignore text"** field, use regex to ignore certain changes:

```
(?i)(last updated|copyright 20\d{2})
```

This ignores "last updated" timestamps and copyright year changes.

## Testing Workflow

1. **Start broad:** Begin with a simple selector like `main` or `#content`
2. **Check the preview:** Use the Preview button to see what's captured
3. **Refine:** Add exclusions or make the selector more specific
4. **Monitor for a week:** See what changes trigger false alerts
5. **Adjust:** Add ignore patterns for recurring false positives
6. **Document:** Note your selectors for similar sites

## Selector Templates by Website Type

### Template: Social Service Agency

```css
/* Good starting point */
main article, .program-details, #services

/* Or more specific */
.contact-info, .hours-of-operation, .eligibility, .services-offered
```

### Template: Government Service Page

```css
/* Main content only */
main

/* With exclusions */
main :not(nav):not(footer):not(.breadcrumb):not(.share-buttons)
```

### Template: Healthcare Provider

```css
/* Services and contact */
.services, .hours, .contact, .locations

/* Exclude rotating elements */
main :not(.testimonials):not(.news):not(.events)
```

## Troubleshooting

### "No content matched"
- Your selector is too specific or incorrect
- Try a broader selector like `main` or `body`
- Check spelling and case-sensitivity
- Use browser dev tools to verify the selector works

### "Too many false positives"
- Add exclusions with `:not()` for dynamic elements
- Enable "Text only" mode
- Add ignore patterns for timestamps, copyright notices
- Use a more specific selector to narrow the scope

### "Missing important changes"
- Your selector might be too narrow
- Check if the content you want is inside your selected area
- Try expanding the selector or using multiple selectors

## Quick Reference Card

| Task | CSS Selector | XPath |
|------|--------------|-------|
| Main content | `main` | `//main` |
| By ID | `#contact` | `//*[@id='contact']` |
| By class | `.hours` | `//*[@class='hours']` |
| Multiple sections | `#contact, #hours` | `//div[@id='contact'] \| //div[@id='hours']` |
| Exclude element | `main :not(footer)` | `//main/*[not(self::footer)]` |
| Contains text | N/A | `//*[contains(text(), 'Hours')]` |
| Child elements | `main > article` | `//main/article` |
| Descendant elements | `main article` | `//main//article` |

## Next Steps

1. Start with simple selectors for a few test URLs
2. Monitor them for a week to see what changes
3. Refine selectors based on false positives
4. Document successful patterns for similar sites
5. Gradually apply refined selectors to all monitored URLs

## Resources

- [CSS Selector Reference](https://www.w3schools.com/cssref/css_selectors.asp)
- [XPath Tutorial](https://www.w3schools.com/xml/xpath_intro.asp)
- [Changedetection.io Documentation](https://github.com/dgtlmoon/changedetection.io/wiki)
