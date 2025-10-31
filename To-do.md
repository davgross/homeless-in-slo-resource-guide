# To-do list

1. ~~Fine-tune the styling of the web app to more closely match the Shower the People style (e.g. font). That font might not be appropriate to use everywhere (for readability reasons) but it can probably safely be used for headings and/or UI elements. See the "Branding" section of @design.md . If you do use the font in the app; adjust the licensing documentation appropriately.~~ ✓

1. ~~Audit the app for accessibility issues and make recommendations for how to make the app and its content better conform to accessibility best practices. There is a tentative Accessibility review in @web-app/README.md but I'm not sure I trust it.~~ ✓ (See @ACCESSIBILITY_AUDIT.md)

1. ~~Revisit decision to mark external links "noreferrer". What are the advantages of this? A disadvantage is that it reduces awareness of our app among the agencies and programs we refer people to.~~ ✓ (Removed `noreferrer` while keeping `noopener` for security. This allows agencies to see referrals from the resource guide in their analytics, building stronger partnerships and enabling impact measurement.)

1. Implement the map-opening feature. Consider the following:
   1. Not all resources will have a precise street address, so we need some way of embedding location data (e.g. coordinates) in the markdown source.
   1. Some resources will have more-or-less precise locations (e.g. a building) for which a single set of coordinates might suffice; others will be spread out (a park, a fitness court, a hiking trail) and may require more sophisticated dimensional locations. We should put some thought into how to handle that.
   1. Different resources will need a different zoom factor. For example, a little free library will want a "pin" at a very precise location, whereas a city park may need to be displayed at a different resolution so as to show the entire park and perhaps surrounding streets for context.
   1. Because of these things, it may not be possible or advisable to automatically generate map links from things that look like street addresses.
   1. We should whenever possible open the map using the app that the user prefers (if there is a way of knowing this). Google Maps and Apple Maps are probably reasonable fallbacks for Androids & iPhones respectively. Investigate non-commercial alternatives like OpenStreetMap as possible fallback options.
   1. If the browser/device supports "geo:" tags, those might be a good choice; but we probably need a fallback for browsers/devices that do not.

1. ~~Currently, anchors in the markdown source are set via HTML `<a id="foo" />` tags. If our markdown renderer allows for a more graceful markdown-native way to do this, let's switch to that.~~ ✓ (Investigated: Marked.js supports auto-generating IDs from headers, but explicit HTML anchors are preferable for this project because: (1) IDs are visible to human editors making linking easier, (2) IDs remain stable if header text changes, (3) supports custom short IDs like `40-Prado`, (4) supports multiple IDs per entry for aliases. Current approach is actually best practice for this use case.)
   1. I think I've seen some species of markdown that have an anchor-insertion mechanism (e.g. "`{anchor}`" or something like that). Is that an option for our current rendering engine?

1. There are still some notes in @Directory.md that really belong in "@Resource Guide.md" -- fix that.

1. A lot of "@Resource Guide.md" is still in the form of lists of raw notes; these need to be prosified for the end user.

1. ~~Flag any broken internal links (e.g. links to anchors that do not exist).~~ ✓ (Created `check-links.js` script and fixed 8 broken links: corrected anchor case for Catholic Charities, Restorative Partners, 40 Prado, and IDs section.)

1. Carefully fact check everything and add source code comments indicating the date of the fact check and the source of the verified information.

1. Consider which open-source license to use for the project.

1. ~~Consider adding a "share" button:~~ ✓ (Implemented share button with:
   - Fixed floating action button (bottom-left, orange, using Web Share API on mobile)
   - Fallback to copy-to-clipboard for browsers without Web Share API
   - Toast notification to confirm action
   - Accessible with proper ARIA labels and keyboard support)

1. Enhance the "share" feature by adding section-specific share buttons and share buttons within the Directory modal that link to specific Directory entries. (Can add these with the `createSectionShareButton()` function?)

1. Isolate the UI text in a way that makes it easier to swap-in alternative languages (e.g. a Spanish-language version of the site).

1. Consider ways to make pages, sections, subsections, and directory entries available for printing in a graceful way.

1. Replace "--" dashes, ' and " straight-quotes, and ' apostrophes with better unicode characters. (Claude struggles with such characters, so this may be a task for a human.)

1. Come up with a snappy name for the app that is brief, evocative, and inviting.

1. Ensure that icon designs have not been inadvertently copied without permission.

1. ~~Restyle nested ordered lists so that they do not all use arabic-numeral style (e.g. so they use 1.a.i as opposed to 1.1.1).~~ ✓ (Added CSS to style nested ordered lists: level 1 = decimal (1, 2, 3), level 2 = lower-alpha (a, b, c), level 3 = lower-roman (i, ii, iii), then repeating.)
