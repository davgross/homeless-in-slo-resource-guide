
# How to Contribute to VivaSLO

## Contributing Content

If you are interested in adding, correcting, or improving the content that is displayed on VivaSLO, you will be most interested in the following files:

- [About.md](./About.md) — corresponds to the “About” page, with how-to and background information about VivaSLO
   - [About_es.md](./About_es.md) — the same content, but in Spanish
- [Directory.md](./Directory.md) — corresponds to the “Directory” page, with an alphabetical index of agencies and programs
   - [Directory_es.md](./Directory_es.md) — the same content, but in Spanish
- [Resource guide.md](./Resource%20guide.md) — corresponds to the “Resources” page, organized topically
   - [Resource guide_es.md](./Resource%20guide_es.md) — the same content, but in Spanish

These files are mostly written in Markdown.
This is a lightweight way of creating text files so that they can contain things like links, tables, font varieties, etc.
Where Markdown has proven insufficient for our needs, we have sometimes substituted HTML.
For more information about how to write in Markdown, see the [Markdown Guide](https://www.markdownguide.org/getting-started/).

Here are some guidelines to help you craft your content for VivaSLO:

1. **Our audience is people in SLO County who are either experiencing homelessness or are threatened with it.**
   We prioritize resources that are accessible by and useful to people of limited means.
   Case managers and other homeless services providers will also find VivaSLO helpful, but it is not written for them as its primary audience.
   If information is not something that this audience can make use of, it does not belong in this guide.
1. **Our audience has a variety of challenges.**
   These include cognitive challenges, and varying levels of literacy and of English fluency.
   They have a variety of levels of digital literacy and of comfort with digital information access.
   They are unlikely to have their own FAX machines, personal computers, scanners, or other such large devices.
   Keep these things in mind when you write your content.
   Write simple sentences with few clauses.
   Avoid using jargon or idioms: use basic vocabulary when you can.
   Use simple verbs (“cause”) rather than phrasal verbs (“bring about”) as those are easier for machine translators and for people who speak English as a second language.
   Use simple tenses rather than compound tenses.
   Use active voice rather than passive voice (or if you do use passive voice, make the subject explicit).
   Don’t assume your reader has access to a vehicle, home electronics, a stove, a fixed mailing address, etc. (if a resource requires travel, you can refer the reader to the [Transportation](https://vivaslo.org/Directory.md?section=resources#transportation) section of the guide; if a resource requires a mailing address, you can refer the reader to the [Mail Drops, Post Office Boxes, etc.](https://vivaslo.org/Directory.md?section=resources#mail-drops-post-office-boxes) section).
   Don’t list resources that are expensive to access; indicate the cost whenever you can and whether there are subsidies or sliding-scale payment options.
1. **Direct access is better.**
   Prioritize resources that can be accessed by people directly.
   If you write about a resource that people cannot access directly (i.e. you must be referred by another agency, a case manager, or something like that), be sure to mention that fact somewhere and to describe how an individual can facilitate this indirect access (e.g. “ask your case manager to refer you…”).
1. **The Directory page is the single source of truth for basic facts** like phone numbers, email addresses, website URLs, hours of operation, and locations.
   If that information exists in the Directory for an agency or program, do not duplicate that information in the Resources page, but instead link from there to the Directory page.
   This helps us keep the information up-to-date by ensuring we only have to update it in one place rather than in scattered mentions here and there.
   An exception to this is if you mention some special program of an agency that is accessed in an unusual place, that has its own special phone number, etc.
   In cases like that, you can mention the exceptional information in the Resources page.
1. **Make all changes to both the English and Spanish versions.**
   Every change you make to an English page should also be reflected in its Spanish counterpart, and vice-versa.
   You can use a machine translator like [Google Translate](https://translate.google.com/) or a good AI chat bot if you do not know Spanish yourself.
   This is another good reason to use simple sentence structure, with simple verbs and tenses, and avoiding idioms and jargon: that will make these machine translations more accurate.
   Sometimes information will need to be different between the English and Spanish versions: for instance when a resource has two phone numbers (one for English speakers and one for Spanish speakers).
   Most typically, the names of programs and agencies remain in English in the Spanish-language pages.
   But some programs and agencies have official Spanish translations of their names; if you can discover these, use these translations instead.
1. **One sentence per line, please.**
   Our site style is to have one sentence per line of Markdown text.
   Markdown will concatenate adjacent lines into paragraphs (add a blank line between sentences if you want a paragraph break).
   This style makes it easier for us to find text in a file, and to annotate individual facts with source attributions.
1. **Add source annotations.**
   When you add information to a page, leave a note about where you found this information.
   This helps us to keep the information up to date over time.
   To do this, append an HTML comment to the sentence that contains the new information.
   An HTML comment takes the form `<!-- comment text here -->`.
   For example:

   ```markdown
   You must complete some extra forms and a liability waiver to use the tool lending library. <!-- Source: https://catalog.slolibrary.org/games-passes-tools-things -->
   ```

   The comment will not appear in the text as seen by VivaSLO users, but we can use it to verify the assertion in the text.
   Often, a URL makes for a good *Source*.
   Here are some other options:

   ```markdown
   It is closed on federal holidays. <!-- Source: I work there and know its policies. -JD -->
   You must bring a photo ID to your first appointment. <!-- Source: phone conversation with ABC director Jane Doe on 6 January 2026 -->
   You do not have to have a fixed address. <!-- Source: presentation given by John Smith of ABC to HSOC on 21 November 2025 -->
   ```

   Use reputable and recent sources.
   The best sources are usually main pages on the websites run by the agencies or programs, conversations with responsible people at those agencies or programs, or recent social media posts by the agencies or programs.
   Below that tier are older pages on those websites (e.g. old powerpoint presentations or PDFs), pages on third-party sites that refer to the agencies or programs (e.g. resource guides published by other agencies), and older social media posts by the agency or program.
   Least reliable are aggregator sites like Yelp or Google that will often have information about programs or agencies, but that are not very good about ensuring that the information is accurate or up-to-date.
1. **Use consistent markup and typography.**
   - Always link URLs, like this: `[website.com/page](https://www.website.com/page/)`.
   - Always link email addresses, like this: `[joe@schmoe.com](mailto:joe@schmoe.com)`.
   - Always give phone numbers in 123-456-7890 format, and always hyperlink them using the `tel:` protocol, like this:
     `[123-456-7890](tel:+1-123-456-7890)`.
     An exception is smaller numbers like 211 (`[211](+1-211)`).
     In the text displayed to the reader, omit the opening “1-” from U.S. numbers (but the `+1-` is mandatory in the URL).
     If the phone number has a text mnemonic (800-RUN-AWAY), you can use that mnemonic in the text that is displayed to the user, but switch to all-numbers in the URL, e.g. (`[800-RUN-AWAY](tel:+1-800-786-2929)`).
     For phone numbers with extensions, write them like this: `[123-456-7890&#xA0;x246](tel:+1-123-456-7890;ext=246)`
   - For phone numbers that are meant to receive texts rather than calls, use the `sms:` protocol, like this:
     `[123-456-7890](sms:+1-123-456-7890)`.
     If the reader is meant to start a text conversation with a particular starting message, you can fill that in for them in this way:
     `[text “HEY” to 987-654-3210](sms:+1-987-654-3210?&body=HEY)`.
   - Use an en-dash (`–`) to separate ranges of numbers, time ranges, and date ranges (e.g. `1pm–3pm`, `Monday–Friday`, `ages 18–25`, `$5–10`).
   - Use an em-dash (`—`) to separate phrases or to follow an inline heading.
   - Use unicode fractions (e.g. `½` rather than `1/2`).
   - Use curly-quotes and apostrophes (`‘ ’ “ ”`) and unicode-ellipses (`…` rather than `...`) in user-facing text.
1. **Create map links for physical locations.**
   When you mention a physical address or other location, add a hyperlink to it.

   ```markdown
   There is a public restroom <a href="#" class="map-link" data-lat="35.279933" data-lon="-120.664580" data-zoom="18" data-label="Public Restroom">next to the Murray Adobe by the Mission in SLO</a>.
   ```

   This hyperlink uses HTML rather than markdown.
   VivaSLO converts it into a link that uses the user’s platform-specific mapping application.
   To generate this link, you can use [this tool](./web0app/map-data-helper.html).
1. **Use `*italics*` tather than ALL-CAPS for emphasis.**
1. **“SLO” is usually an acceptable abbreviation for “the city of San Luis Obispo.”**
   If the context makes it ambiguous whether “SLO” refers to the city or county, you can use “SLO city” or “SLO County.”
1. **Usually omit the state and zip code from the address.**
   The exceptions to this are if the address is primarily a *mailing* address rather than a place-of-business, or if the address is outside of SLO County.
1. **Add entries to the Directory in alphabetical order.**
   This is mostly straightforward, but we have had to make some judgement calls (e.g. we alphabetize “St.” as though it were “Saint”; we pretend that an initial word “The” isn’t there for alphabetization purposes).
1. **Not every program and agency deserves a Directory entry.**
   Some programs are run entirely by an agency that is already in the Directory, and share that agency’s contact information.
   In such a case, we can just note that in the Resources page rather than creating a separate Directory entry specific to the program.
   If an agency or program is hyperspecific to some particular task, such that it will only ever be mentioned in one place in the Resources page, maybe it does not need a separate Directory entry, but its directory-like information can be on the Resources page instead.
   Commercial businesses mentioned in passing (storage facilities, gyms) don’t need Directory entries unless they have specific programs for homeless people.
1. **Maintain Directory cross-references.**
   If a program is run by an agency, or an agency refers people to a program, or something of that nature, then the agency and the program should cross-reference each other in their “Notes.”
   Look at some of the Directory entries to see examples of when this is appropriate.
1. **Keep the SLO County focus.**
   Avoid adding resources that are only accessible to people outside of SLO County.
   It is acceptable to add some resources that are available state-wide or nation-wide.
   Santa Maria, Orcutt, and Guadalupe, are just across the county’s southern border in Santa Barbara county, and there is often some overlap between services offered there and in SLO’s South County area.
   But only add such resources if they do in fact serve people from SLO County.

## Contributing Code

The [web-app/](./web-app/) directory contains the progressive web app that displays this content to the user.
The [`web-app/README.md`](./web-app/README.md) and [`web-app/ARCHITECTURE.md`](./web-app/ARCHITECTURE.md) documentation gives an overview of the source code and what it does.

If you make changes to the code, please also review those documentation files and make any necessary updates so that they track your changes.

This project is being developed in a public GitHub repo.

It is deployed on Cloudflare.
