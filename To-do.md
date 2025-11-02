# To-do list

1. Add the same pin icon we use in the Directory for our map links to the map links in the Resource Guide.

1. In the Directory, if part of a heading appears within the first `<a id="foo">` element, but a second part of it appears outside of that element, the first part will be left-justified, and the second part right-justified. E.g. `## <a id="Grace-Central-Coast">Grace Central Coast</a> “God’s Storehouse”`. It would appear better if instead the entire line remained intact, without any visible difference between:
   - `## <a id="Grace-Central-Coast">Grace Central Coast</a> “God’s Storehouse”`
   - `## <a id="Grace-Central-Coast">Grace Central Coast “God’s Storehouse”</a>`

1. There are still some notes in @Directory.md that really belong in @"Resource Guide.md" -- fix that.

1. A lot of @"Resource Guide.md" is still in the form of lists of raw notes; these need to be prosified for the end user.

1. Carefully fact check everything and add source code comments indicating the date of the fact check and the source of the verified information.

1. Consider which open-source license to use for the project.

1. Add anchors to h2/h3 headings in @"Resource Guide.md" that currently lack them.

1. Consider ways to make pages, sections, subsections, and directory entries available for printing in a graceful way.

1. Replace "--" dashes, ' and " straight-quotes, and ' apostrophes with better unicode characters. (Claude struggles with such characters, so this may be a task for a human.)

1. Come up with a snappy name for the app that is brief, evocative, and inviting.

1. Ensure that icon designs have not been inadvertently copied without permission.

1. Reduce the size of or change the location of the phone icon so that it is not intersected by the link underlining.

1. Consider not underlining links at all, but just using color to indicate clickable things. Check the accessibility ramifications of this first. It might necessitate changing other aspects of our color scheme (e.g. headings are currently blue but are not clickable, so that would probably need to change).

1. Consider redesigning the Resource Guide so that rather than being a TOC followed by sections, it uses an accordion structure where when the user selects a section title, it expands to show the content. What would be the ramifications of this for e.g. maintainability, accessibility, compatibility with existing tools, ability of the user to share or bookmark things inside of accordion folds, etc.?
