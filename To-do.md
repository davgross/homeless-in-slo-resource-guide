# To-do list

1. I think we can purge the various add-map-links...js files from the repo and the working directory.

1. Examine the current structure of @web-app/ and make some notes for Claude where Claude will find them so it is easier for Claude to hit the ground running when Claude is asked to make improvements to the app.

1. I've added some pictures of poison oak plants to the Poison Oak subsection. We need to add these to the @web-app/ distribution and adjust the links so that they'll display properly. They should also adjust sizes so they can appear side-by-side in a variety of screen sizes.
   - Licensing information for the new poison oak plant images is found in @Images/rights.txt. Move this information to the appropriate places in the repo (see e.g. @LICENSING_AUDIT.md, @LICENSE, and @THIRD_PARTY_LICENSES.md for example), format it appropriately, and honor whatever license conditions are appropriate.

1. At some screen sizes, the search bar of @web-app/ drops below the Resources/Directory/About link buttons. When this happens, the height of the nav bar increases, but the location of the go-to-TOC icon does not move down to adjust for that, causing it to overlap the search bar. The TOC button has a fixed top: 90px position, but when the search bar wraps below the navigation buttons, the header grows taller and the button doesn't adjust accordingly. Fix this.

1. The icon for "Self-Advocacy" in the TOC is the same as the Feedback button icon and the sms link icon (an ellipsis in a cartoon talk-bubble), which could be confusing. Pick a distinct icon for each of these.

1. The Feedback button, go-to-TOC button, and global Share button have different radii. Adjust them so that they are all the same size.

1. There are still some notes in @Directory.md that really belong in @"Resource Guide.md" -- fix that.

1. A lot of @"Resource Guide.md" is still in the form of lists of raw notes; these need to be prosified for the end user.

1. Carefully fact check everything and add source code comments indicating the date of the fact check and the source of the verified information.

1. Consider which open-source license to use for the project.

1. Add anchors to h2/h3 headings in @"Resource Guide.md" that currently lack them, and link to those anchors from the Resource Guide's TOC.

1. Consider ways to make pages, sections, subsections, and directory entries available for printing in a graceful way.

1. Replace "--" dashes, ' and " straight-quotes, and ' apostrophes with better unicode characters. (Claude struggles with such characters, so this may be a task for a human.)

1. Come up with a snappy name for the app that is brief, evocative, and inviting.

1. Ensure that icon designs have not been inadvertently copied without permission.

