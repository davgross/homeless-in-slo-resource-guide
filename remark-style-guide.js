// remark-style-guide.js
import { visitParents } from "unist-util-visit-parents";

export default function remarkStyleGuide() {
    return (tree, file) => {
        // Traverse the AST and add messages (linter warnings)

        /***********/
        /** image **/
        /***********/
        visit(tree, "image", node => {
            // Images should have alt text
            if (!node.alt || "" === node.alt.trim()) {
                const msg = `Add alt text for image.`;
                file.message(msg, node);
            }
        });

        /**********/
        /** text **/
        /**********/
        visitParents(tree, "text", (node, ancestors) => {
            const value = node.value;

            const problems = [
                /************************************
                 * Avoid first-person plural pronouns
                 ************************************/
                {
                    pattern: /\b(?:let’s|our|ours|us|we|we’ll|we’re|we’ve)\b/,
                    message: `Avoid first-person plural (us, we, our, ours) pronouns.`,
                },
                /*************************************************
                 * Standardize formatting of certain abbreviations
                 *************************************************/
                {
                    pattern: /\bf\.?a\.?q/,
                    message: `Use "FAQ" rather than "faq" or "f.a.q"`,
                },
                {
                    pattern: /\bF\.?A\.?Q\.?S\b/,
                    message: `Use "FAQs" rather than "FAQS" or "F.A.Q.S"`,
                },
                {
                    pattern: /\bF\.A\.Q\.?s?\b/i,
                    message: `Use "FAQ" rather than "F.A.Q."`,
                },
                {
                    pattern: /\b[Ii]d(s)?\b/,
                    message: `Use "ID" rather than "Id" or "id"`,
                },
                {
                    pattern: /\bi\.d\.(s)?\b/i,
                    message: `Use "ID" rather than "I.D."`,
                },
                {
                    pattern: /\bu\.?r\.?l/,
                    message: `Use "URL" rather than "url" or "u.r.l."`,
                },
                {
                    pattern: /\bU\.?R\.?L\.?S\b/,
                    message: `Use "URLs" rather than "URLS" or "U.R.L.S"`,
                },
                {
                    pattern: /\bU\.R\.L\.?s?\b/i,
                    message: `Use "URL" rather than "U.R.L."`,
                },
                {
                    pattern: /\bUS\b/,
                    message: `Use "U.S." rather than "US"`,
                },
                {
                    pattern: /\bUSA\b/i,
                    message: `Use "U.S.A." rather than "USA"`,
                },
                {
                    pattern: /\beg\b/i,
                    message: `Use "e.g." (or "for example,") rather than "eg"`,
                },
                {
                    pattern: /\bie\b/i,
                    message: `Use "i.e." (or "that is,") rather than "ie"`,
                },
                /********************************************************************
                 * Capitalize certain words and trademarks correctly and consistently
                 ********************************************************************/
                {
                    pattern: /\bios\b/,
                    message: `Use "iOS" rather than "ios"`,
                },
                {
                    pattern: /\bioS\b/,
                    message: `Use "iOS" rather than "ioS"`,
                },
                {
                    pattern: /\bIOS\b/,
                    message: `Use "iOS" rather than "IOS"`,
                },
                /************************************************
                 * Use simple tenses rather than compound tenses.
                 ************************************************/
                {
                    pattern: /(?<!\bmay\s)(?<!\b[wsc]hould\s)(\bhave \w*ed\b)/i,
                    message: `Use simple past tense rather than compound past tense (e.g. "used" rather than "have used")`,
                },
                {
                    pattern: /\bhad \w*ed\b/i,
                    message: `Use simple past tense rather than compound past tense (e.g. "used" rather than "had used")`,
                },
                /***************************************************************
                 * Avoid using idiomatic expressions or jargon.
                 * Do not use wordy phrases when more simple constructions work.
                 ***************************************************************/
                {
                    pattern: /\badversely impact(s)?\b/i,
                    message: `Rather than "adversely impact" consider e.g. "damage", "hurt"`,
                },
                {
                    pattern: /\ba (large)? number of\b/i,
                    message: `Rather than "a (large) number of" consider e.g. "many", "several"`,
                },
                {
                    pattern: /\ball across\b/i,
                    message: `Rather than "all across" simply use "across"`,
                },
                {
                    pattern: /\balong the lines of\b/i,
                    message: `Rather than "along the lines of" consider e.g. "similar to"`,
                },
                {
                    pattern: /\ban estimated\b/i,
                    message: `Rather than "an estimated" consider e.g. "about", "roughly"`,
                },
                {
                    pattern: /\bat a later date\b/i,
                    message: `Rather than "at a later date" simply use "later"`,
                },
                {
                    pattern: /\bat all times\b/i,
                    message: `Rather than "at all times" consider e.g. "always"`,
                },
                {
                    pattern: /\bbottom[ -]line(s)?\b/i,
                    message: `Rather than "bottom line" consider e.g. "conclusion"`,
                },
                {
                    pattern: /\b(buy|buys|buying|bought)\s?in(to)?\b[.,;!?:]?/i,
                    message: `Rather than "buy in" consider e.g. "approve", "approval"`,
                },
                {
                    pattern: /\bfishy\b/i,
                    message: `Rather than "fishy" consider e.g. "suspect", "suspicious"`,
                },
                {
                    pattern: /\bfunctionality\b/i,
                    message: `Rather than "functionality" consider e.g. "capability", "feature", "function", "use"`,
                },
                {
                    pattern: /\bfwiw\b/i,
                    message: `Spell out "fwiw" or omit it entirely`,
                },
                {
                    pattern: /\bgame plan(s)?\b/i,
                    message: `Rather than "game plan" consider e.g. "plan", "strategy"`,
                },
                {
                    pattern: /\bgoing forward\b/i,
                    message: `Rather than "going forward" consider e.g. "from now on", "in the future", "now"`,
                },
                {
                    pattern: /\bhelp you to\b/i,
                    message: `Use "help you verb" rather than "help you to verb"`,
                },
                {
                    pattern: /\bim(h)?o\b/i,
                    message: `Omit "IMO" or "IMHO"`,
                },
                {
                    pattern: /\bin agreement\b/i,
                    message: `Rather than "being in agreement" simply use "agree"`,
                },
                {
                    pattern: /\bin order to\b/i,
                    message: `Rather than "in order to" simply use "to"`,
                },
                {
                    pattern: /\bleverage\b/i,
                    message: `Rather than "leverage" consider e.g. "use" or a more precise verb`,
                },
                {
                    pattern: /\blong shot(s)?\b/i,
                    message: `Rather than "long shot" consider e.g. "unlikely"`,
                },
                {
                    pattern: /\blow[ -]hanging fruit\b/i,
                    message: `Rather than "low-hanging fruit" consider e.g. "easiest tasks"`,
                },
                {
                    pattern: /\bnutshell\b/i,
                    message: `Rather than "a nutshell" consider e.g. "summary"`,
                },
                {
                    pattern: /\boff the ground\b/i,
                    message: `Rather than "off the ground" consider e.g. "begun", "started"`,
                },
                {
                    pattern: /\bon the fence\b/i,
                    message: `Rather than "on the fence" consider e.g. "undecided"`,
                },
                {
                    pattern: /\bout of the blue\b/i,
                    message: `Rather than "out of the blue" consider e.g. "surprising", "unexpected"`,
                },
                {
                    pattern: /\boutside the box\b/i,
                    message: `Rather than "outside the box" consider e.g. "creatively"`,
                },
                {
                    pattern: /\bportion[s]?\b/i,
                    message: `Use "part" rather than "portion"`,
                },
                {
                    pattern: /\bthe time when\b/i,
                    message: `Use "when" rather than "[at] the time when"`,
                },
                {
                    pattern: /\bupon\b/i,
                    message: `Rather than "upon" use "on" or "after"/"when"`,
                },
                {
                    pattern: /\butili[sz]e[ds]?\b/i,
                    message: `Use "use" rather than "utilize"`,
                },
                {
                    pattern: /\bsome of the\b/i,
                    message: `Rather than "some of the" simply use "some"`,
                },
                {
                    pattern: /\bthe ropes\b/i,
                    message: `Rather than "learn the ropes" consider e.g. "learn how"`,
                },
                {
                    pattern: /\bvery same\b/i,
                    message: `Use "same" rather than "very same"`,
                },
                /** Sometimes "within" is better
                {
                    pattern: /\bwithin\b/i,
                    message: `Use "in" rather than "within"`,
                },
                **/
                {
                    pattern: /\bymmv\b/i,
                    message: `Omit "YMMV"`,
                },
                /************************************************************************************************************
                 * Avoid using phrasal verbs when one-word verbs work.
                 * Phrasal verbs are difficult for people who speak English as a second language and for machine translators.
                 ************************************************************************************************************/
                {
                    pattern: /\b(add|adds|adding|added)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "add up" consider e.g. "add", "validate"; instead of "adds up to" consider e.g. "explains"`,
                },
                {
                    pattern: /\b(am|is|are|was|were) able to\b/i,
                    message: `Rather than "are able to verb" consider e.g. "can verb"`,
                },
                {
                    pattern: /\b(be|being|am|is|are|was|were) out to\b/i,
                    message: `Rather than "are out to verb" consider e.g. "intend to verb"`,
                },
                {
                    pattern: /\b(auction|auctions|auctioning|auctioned)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "auction off" simply use "auction"`,
                },
                {
                    pattern: /\b(back|backs|backing|backed)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "back out" consider e.g. "exit", "reverse", "undo"`,
                },
                {
                    pattern: /\b(back|backs|backing|backed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "back up" consider e.g. "archive", "copy", "revert", "save", "support"`,
                },
                {
                    pattern: /\b(bail|bails|bailing|bailed)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "bail out (of)" consider e.g. "quit"`,
                },
                {
                    pattern: /\b(blank|blanks|blanking|blanked)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "blank out" consider e.g. "clear", "empty", "redact"`,
                },
                {
                    pattern: /\b(blow|blows|blowing|blew)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "blow up" consider e.g. "crash", "enlarge", "expand", "explode", "inflate"`,
                },
                {
                    pattern: /\b(bog|bogs|bogging|bogged) down\b[.,;!?:]?/i,
                    message: `Rather than "bog down" consider e.g. "slow"`,
                },
                {
                    pattern: /\b(boil|boils|boiling|boiled)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "boil down" consider e.g. "conclude", "simplify"`,
                },
                {
                    pattern: /\b(boot|boots|booting|booted)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "boot up" consider e.g. "initialize", "start"`,
                },
                {
                    pattern: /\b(bounce|bounces|bouncing|bounced) back\b[.,;!?:]?/i,
                    message: `Rather than "bounce back" consider e.g. "recover"`,
                },
                {
                    pattern: /\b(branch|branches|branching|branched) out\b[.,;!?:]?/i,
                    message: `Rather than "branch out" consider e.g. "expand"`,
                },
                {
                    pattern: /\b(break|breaks|breaking|broke)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "break down" consider e.g. "disassemble", "explain", "fail"`,
                },
                {
                    pattern: /\b(break|breaks|breaking|broke) out of\b[.,;!?:]?/i,
                    message: `Rather than "break out of" consider e.g. "escape" or "escape from"`,
                },
                {
                    pattern: /\b(break|breaks|breaking|broke)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "break up" consider e.g. "disassemble", "separate"`,
                },
                {
                    pattern: /\b(bring|brings|bringing|brought)\b(?:\s+\w{1,15}){0,4}? about\b[.,;!?:]?/i,
                    message: `Rather than "bring about" consider e.g. "cause"`,
                },
                {
                    pattern: /\b(bring|brings|bringing|brought)\b(?:\s+\w{1,15}){0,4}? along\b[.,;!?:]?/i,
                    message: `Rather than "bring along" simply use "bring"`,
                },
                {
                    pattern: /\b(bring|brings|bringing|brought)\b(?:\s+\w{1,15}){0,4}? back\b[.,;!?:]?/i,
                    message: `Rather than "bring back" consider e.g. "return", "restore"`,
                },
                {
                    pattern: /\b(bring|brings|bringing|brought)\b(?:\s+\w{1,15}){0,4}? (?:forth|forward)\b[.,;!?:]?/i,
                    message: `Rather than "bring forth" or "bring forward" consider e.g. "cause", "produce", "reveal", "show"`,
                },
                {
                    pattern: /\b(bring|brings|bringing|brought) in\b[.,;!?:]?/i,
                    message: `Rather than "bring in" consider e.g. "earn", "produce"`,
                },
                {
                    pattern: /\b(bring|brings|bringing|brought)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "bring up" consider e.g. "introduce", "raise", "mention"`,
                },
                {
                    pattern: /\b(brush|brushes|brushing|brushed) up\b[.,;!?:]?/i,
                    message: `Rather than "brush up" consider e.g. "learn", "improve"`,
                },
                {
                    pattern: /\b(build|builds|building|built)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "build up" consider e.g. "anticipation", "construct", "develop", "raise"`,
                },
                {
                    pattern: /\b(bump|bumps|bumping|bumped)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "bump up" consider e.g. "increase"`,
                },
                {
                    pattern: /\b(bundle|bundles|bundling|bundled)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "bundle up" consider e.g. "combine", "wrap"`,
                },
                {
                    pattern: /\b(buy|buys|buying|bought)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "buy up" simply use "buy"`,
                },
                {
                    pattern: /\b(call|calls|calling|called) for\b[.,;!?:]?/i,
                    message: `Rather than "call for" consider e.g. "demand", "request", "require"`,
                },
                {
                    pattern: /\b(call|calls|calling|called)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "call off" consider e.g. "cancel"`,
                },
                {
                    pattern: /\b(call|calls|calling|called) on\b[.,;!?:]?/i,
                    message: `Rather than "call on" consider e.g. "ask"`,
                },
                {
                    pattern: /\b(call|calls|calling|called)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "call up" consider e.g. "call", "summon"`,
                },
                {
                    pattern: /\b(cancel|cancels|cancel(l)?ing|cancel(l)?ed)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "cancel out" simply use "cancel"`,
                },
                {
                    pattern: /\b(carry|carries|carrying|carried) on\b[.,;!?:]?/i,
                    message: `Rather than "carry on" consider e.g. "continue"`,
                },
                {
                    pattern: /\b(carry|carries|carrying|carried)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "carry out" consider e.g. "accomplish", "do", "perform"`,
                },
                {
                    pattern: /\b(catch|catches|catching|caught)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "catch up" consider e.g. "align", "learn", "synchronize", "update"; rather than "catch up with" consider e.g. "reach"`,
                },
                {
                    pattern: /\b(change|changes|changing|changed)\b(?:\s+\w{1,15}){0,4}? over\b[.,;!?:]?/i,
                    message: `Rather than "change over" or "change over time" simply use "change"`,
                },
                {
                    pattern: /\b(charge|charges|charging|charged)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "charge up" simply use "charge"`,
                },
                {
                    pattern: /\b(check|checks|checking|checked)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "check off" simply use "check"`,
                },
                {
                    pattern: /\b(check|checks|checking|checked)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "check out" consider e.g. "observe", "read", "see"`,
                },
                {
                    pattern: /\b(check|checks|checking|checked)\b(?:\s+\w{1,15}){0,4}? over\b[.,;!?:]?/i,
                    message: `Rather than "check over" consider e.g. "examine", "inspect"`,
                },
                {
                    pattern: /\b(chip|chips|chipping|chipped) in\b[.,;!?:]?/i,
                    message: `Rather than "chip in" consider e.g. "contribute"`,
                },
                {
                    pattern: /\b(choke|chokes|choking|choked)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "choke off" consider e.g. "stop"`,
                },
                {
                    pattern: /\b(chop|chops|chopping|chopped)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "chop up" consider e.g. "disassemble", "partition", "separate"`,
                },
                {
                    pattern: /\b(clean|cleans|cleaning|cleaned)\b(?:\s+\w{1,15}){0,4}? (?:up|out|off)\b[.,;!?:]?/i,
                    message: `Rather than "clean up", "clean out", or "clean off" consider e.g. "clean", "delete", "remove", "tidy"`,
                },
                {
                    pattern: /\b(clear|clears|clearing|cleared)\b(?:\s+\w{1,15}){0,4}? (?:off|out|away)\b[.,;!?:]?/i,
                    message: `Rather than "clear away" or "clear off" or "clear out" consider e.g. "clear", "empty"`,
                },
                {
                    pattern: /\b(clear|clears|clearing|cleared)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "clear up" consider e.g. "clarify", "clear"`,
                },
                {
                    pattern: /\b(click|clicks|clicking|clicked) on\b/i,
                    message: `Rather than "click on" simply use "click"`,
                },
                {
                    pattern: /\b(clog|clogs|clogging|clogged)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "clog up" simply use "clog", or "obstruct"`,
                },
                {
                    pattern: /\b(close|closes|closing|closed)\b(?:\s+\w{1,15}){0,4}? (?:down|out|up)\b[.,;!?:]?/i,
                    message: `Rather than "close down" or "close out" or "close up" consider e.g. "close", "dismiss", "finish", "quit", "stop"`,
                },
                {
                    pattern: /\b(come|comes|coming|came) about\b[.,;!?:]?/i,
                    message: `Rather than "come about" consider e.g. "happen"`,
                },
                {
                    pattern: /\b(come|comes|coming|came) back\b[.,;!?:]?/i,
                    message: `Rather than "come back" consider e.g. "return"`,
                },
                {
                    pattern: /\b(come|comes|coming|came) forth\b[.,;!?:]?/i,
                    message: `Rather than "come forth" consider e.g. "appear"`,
                },
                {
                    pattern: /\b(come|comes|coming|came) out\b[.,;!?:]?/i,
                    message: `Rather than "come out" consider e.g. "release"`,
                },
                {
                    pattern: /\b(come|comes|coming|came) through\b[.,;!?:]?/i,
                    message: `Rather than "come through" consider e.g. "arrive"`,
                },
                {
                    pattern: /\b(come|comes|coming|came) up\b[.,;!?:]?/i,
                    message: `Rather than "come up" consider e.g. "arise", "appear", "start", "emerge"; rather than "come up against" consider e.g. "confront", "encounter"; rather than "come up with" consider e.g. "consider", "invent", "think of"`,
                },
                {
                    pattern: /\b(come|comes|coming|came) upon\b/i,
                    message: `Rather than "come upon" consider e.g. "find", "notice"`,
                },
                {
                    pattern: /\b(count|counts|counting|counted)\b(?:\s+\w{1,15}){0,4}? among\b[.,;!?:]?/i,
                    message: `Rather than "count among" consider e.g. "include"`,
                },
                {
                    pattern: /\b(count|counts|counting|counted) on\b/i,
                    message: `Rather than "count on" consider e.g. "depend", "expect", "rely"`,
                },
                {
                    pattern: /\b(count|counts|counting|counted)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "count out" consider e.g. "enumerate", "exclude"`,
                },
                {
                    pattern: /\b(count|counts|counting|counted)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "count up" consider e.g. "add"`,
                },
                {
                    pattern: /\b(crack|cracks|cracking|cracked) down\b[.,;!?:]?/i,
                    message: `Rather than "crack down" consider e.g. "enforce"`,
                },
                {
                    pattern: /\b(crank|cranks|cranking|cranked)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "crank out" consider e.g. "generate", "output", "produce"`,
                },
                {
                    pattern: /\b(crop|crops|cropping|cropped) down\b[.,;!?:]?/i,
                    message: `Rather than "crop up" consider e.g. "appear"`,
                },
                {
                    pattern: /\b(crowd|crowds|crowding|crowded)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "crowd out" consider e.g. "exclude", "replace", "supplant"`,
                },
                {
                    pattern: /\b(cut|cuts|cutting)\b(?:\s+\w{1,15}){0,4}? (?:back|down)\b[.,;!?:]?/i,
                    message: `Rather than "cut back (on)" or "cut down" consider e.g. "reduce"`,
                },
                {
                    pattern: /\b(cut|cuts|cutting)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "cut off" consider e.g. "disconnect", "discontinue", "exclude", "isolate"`,
                },
                {
                    pattern: /\b(cut|cuts|cutting)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "cut out" consider e.g. "eliminate", "stop"`,
                },
                {
                    pattern: /\b(damp|damps|damping|damped)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "damp down" consider e.g. "dampen", "decrease", "reduce"`,
                },
                {
                    pattern: /\b(decide|decides|deciding|decided) on\b[.,;!?:]?/i,
                    message: `Rather than "decide on" consider e.g. "choose", "select"`,
                },
                {
                    pattern: /\b(die|dies|dying|died) (?:down|out)\b[.,;!?:]?/i,
                    message: `Rather than "die down" or "die out" consider e.g. "decrease", "reduce", "stop", "subside"`,
                },
                {
                    pattern: /\b(dive|dives|diving|dived|dove) in\b[.,;!?:]?/i,
                    message: `Rather than "dive in (to)" consider e.g. "begin", "initiate", "start"`,
                },
                {
                    pattern: /\b(divide|divides|dividing|divided)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "divide up" consider e.g. "divide", "partition", "split", "separate"`,
                },
                {
                    pattern: /\b(do|does|doing|did|done) without\b[.,;!?:]?/i,
                    message: `Rather than "do without" consider e.g. "omit"`,
                },
                {
                    pattern: /\b(draw|draws|drawing|drew|drawn)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "draw down" consider e.g. "deplete", "withdraw"`,
                },
                {
                    pattern: /\b(draw|draws|drawing|drew|drawn)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "draw up" consider e.g. "draft", "draw", "prepare"`,
                },
                {
                    pattern: /\b(dream|dreams|dreaming|dreamed|dreamt)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "dream up" consider e.g. "imagine", "invent"`,
                },
                {
                    pattern: /\b(drill|drills|drilling|drilled) (?:down|into)\b[.,;!?:]?/i,
                    message: `Rather than "drill down" or "drill into" consider e.g. "investigate"`,
                },
                {
                    pattern: /\b(drive|drives|driving|drove|driven)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "drive up" consider e.g. "boost", "improve", "increase"`,
                },
                {
                    pattern: /\b(drop|drops|dropping|dropped) off\b[.,;!?:]?/i,
                    message: `Rather than "drop off" consider e.g. "decrease"`,
                },
                {
                    pattern: /\b(drown|drowns|drowning|drowned)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "drown out" consider e.g. "conflict", "obscure", "overwhelm", "replace"`,
                },
                {
                    pattern: /\b(drum|drums|drumming|drummed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "drum up" consider e.g. "boost", "increase", "promote"`,
                },
                {
                    pattern: /\b(dry|dries|drying|dried)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "dry up" consider e.g. "decrease", "diminish", "stop"`,
                },
                {
                    pattern: /\b(ease|eases|easing|eased)\b(?:\s+\w{1,15}){0,4}? (?:up|off)\b[.,;!?:]?/i,
                    message: `Rather than "ease off" or "ease up" consider e.g. "decrease", "diminish", "reduce", "relax"`,
                },
                {
                    pattern: /\b(eat|eats|eating|ate|eaten) away\b[.,;!?:]?/i,
                    message: `Rather than "eat away" consider e.g. "diminish", "erode"`,
                },
                {
                    pattern: /\b(eat|eats|eating|ate|eaten) (?:into|up)\b[.,;!?:]?/i,
                    message: `Rather than "eat into" or "eat up" consider e.g. "diminish", "erode", "take"`,
                },
                {
                    pattern: /\b(edge|edges|edging|edged) (?:out)\b[.,;!?:]?/i,
                    message: `Rather than "edge out" consider e.g. "exceed", "supplant"`,
                },
                {
                    pattern: /\b(empty|empties|emptying|emptied)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "empty out" simply use "empty"`,
                },
                {
                    pattern: /\b(end|ends|ending|ended)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "end up" consider e.g. "conclude", "finish", "result"`,
                },
                {
                    pattern: /\b(fall|falls|falling|fell|fallen) apart\b[.,;!?:]?/i,
                    message: `Rather than "fall apart" consider e.g. "break", "fail", "shatter"`,
                },
                {
                    pattern: /\b(fall|falls|falling|fell|fallen) off\b[.,;!?:]?/i,
                    message: `Rather than "fall off" consider e.g. "decrease", "diminish", "reduce"`,
                },
                {
                    pattern: /\b(fence|fences|fencing|fenced)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "fence off" consider e.g. "distinguish", "enclose", "exclude", "separate"`,
                },
                {
                    pattern: /\b(figure|figures|figuring|figured)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "figure out" consider e.g. "discover", "find", "investigate"`,
                },
                {
                    pattern: /\b(file|files|filing|filed)\b(?:\s+\w{1,15}){0,4}? away\b[.,;!?:]?/i,
                    message: `Rather than "file away" consider e.g. "hold", "save", "store"`,
                },
                {
                    pattern: /\b(fill|fills|filling|filled)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "fill out" consider e.g. "complete"`,
                },
                {
                    pattern: /\b(fill|fills|filling|filled)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "fill up" simply use "fill"`,
                },
                {
                    pattern: /\b(find|finds|finding|found)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "find out" consider e.g. "discover", "learn"`,
                },
                {
                    pattern: /\b(finish|finishes|finishing|finished)\b(?:\s+\w{1,15}){0,4}? (?:off|up)\b[.,;!?:]?/i,
                    message: `Rather than "finish off" or "finish up" simply use "finish" (or e.g. "complete", "terminate")`,
                },
                {
                    pattern: /\b(fire|fires|firing|fired)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "fire up" consider e.g. "start"`,
                },
                {
                    pattern: /\b(fix|fixes|fixing|fixed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "fix up" simply use "fix"`,
                },
                {
                    pattern: /\b(forge|forges|forging|forged) ahead\b[.,;!?:]?/i,
                    message: `Rather than "forge ahead" consider e.g. "continue"`,
                },
                {
                    pattern: /\b(free|frees|freeing|freed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "free up" simply use "free" (or "make available" maybe)`,
                },
                {
                    pattern: /\b(freeze|freezes|freezing|froze|frozen)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "freeze up" consider e.g. "freeze", "lock", "stop working"`,
                },
                {
                    pattern: /\b(frown|frowns|frowning|frowned) (up)?on\b[.,;!?:]?/i,
                    message: `Rather than "frown on" consider e.g. "disapprove"`,
                },
                {
                    pattern: /\b(get|gets|getting|got|gotten) ahead\b[.,;!?:]?/i,
                    message: `Rather than "get ahead" consider e.g. "advance", "progress", "surpass"`,
                },
                {
                    pattern: /\b(get|gets|getting|got|gotten) around\b[.,;!?:]?/i,
                    message: `Rather than "get around" consider e.g. "avoid", "circumvent", "manage"`,
                },
                {
                    pattern: /\b(get|gets|getting|got|gotten) at\b[.,;!?:]?/i,
                    message: `Rather than "get at" consider e.g. "access", "find", "obtain", "reach"`,
                },
                {
                    pattern: /\b(get|gets|getting|got|gotten)\b(?:\s+\w{1,15}){0,4}? back\b[.,;!?:]?/i,
                    message: `Rather than "get back" consider e.g. "recover", "return"`,
                },
                {
                    pattern: /\b(get|gets|getting|got|gotten) by\b[.,;!?:]?/i,
                    message: `Rather than "get by" consider e.g. "cope"`,
                },
                {
                    pattern: /\b(get|gets|getting|got|gotten) on with\b[.,;!?:]?/i,
                    message: `Rather than "get on with" consider e.g. "continue"`,
                },
                {
                    pattern: /\b(get|gets|getting|got|gotten) rid of\b[.,;!?:]?/i,
                    message: `Rather than "get rid of" consider e.g. "ban", "exclude", "expel", "stop"`,
                },
                {
                    pattern: /\b(get|gets|getting|got|gotten) through\b[.,;!?:]?/i,
                    message: `Rather than "get through" consider e.g. "complete", "finish"`,
                },
                {
                    pattern: /\b(give|gives|giving|gave|given)\b(?:\s+\w{1,15}){0,4}? back\b[.,;!?:]?/i,
                    message: `Rather than "give back" consider e.g. "rebate", "refund", "return"`,
                },
                {
                    pattern: /\b(give|gives|giving|gave|given) out\b[.,;!?:]?/i,
                    message: `Rather than "give out" consider e.g. "deplete", "empty", "end", "give", "stop"`,
                },
                {
                    pattern: /\b(give|gives|giving|gave|given)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "give up" consider e.g. "abandon", "concede", "sacrifice", "stop", "surrender", "quit"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) about \w+ing\b/i,
                    message: `Rather than "go about verbing" simply "verb"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) after\b[.,;!?:]?/i,
                    message: `Rather than "go after" consider e.g. "pursue"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) ahead\b[.,;!?:]?/i,
                    message: `Rather than "go ahead (with)" consider e.g. "continue (to)", "proceed (to)"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) back\b[.,;!?:]?/i,
                    message: `Rather than "go back" consider e.g. "return"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) down\b[.,;!?:]?/i,
                    message: `Rather than "go down" consider e.g. "decrease", "diminish", "fail", "fall", "sink"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) on\b[.,;!?:]?/i,
                    message: `Rather than "go on (with)" consider e.g. "begin", "continue", "happen", "proceed"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) over\b[.,;!?:]?/i,
                    message: `Rather than "go over" consider e.g. "examine", "review"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) through\b[.,;!?:]?/i,
                    message: `Rather than "go through" consider e.g. "consume", "examine", "expend", "review"; for "go through with" consider simply "do"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) together\b[.,;!?:]?/i,
                    message: `Rather than "go together" consider e.g. "accompany", "align", "are compatible", "harmonize"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) up\b[.,;!?:]?/i,
                    message: `Rather than "go up" consider e.g. "arise", "augment", "climb", "increase", "rise"`,
                },
                {
                    pattern: /\b(go|goes|going|went|gone) with\b[.,;!?:]?/i,
                    message: `Rather than "go with" consider e.g. "accompany", "align", "are compatible", "choose", "harmonize"`,
                },
                {
                    pattern: /\b(grey|greys|greying|greyed|gray|grays|graying|grayed)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "gray out" consider e.g. "disable"`,
                },
                {
                    pattern: /\b(grow|grows|growing|grew|grown) apart\b[.,;!?:]?/i,
                    message: `Rather than "grow apart" consider e.g. "diverge"`,
                },
                {
                    pattern: /\b(grow|grows|growing|grew|grown) out of\b[.,;!?:]?/i,
                    message: `Rather than "grow out of" use "outgrow"`,
                },
                {
                    pattern: /\b(hand|hands|handing|handed)\b(?:\s+\w{1,15}){0,4}? back\b[.,;!?:]?/i,
                    message: `Rather than "hand back" consider e.g. "return"`,
                },
                {
                    pattern: /\b(?<!my |your |their |his |her |the |some )(hand|hands|handing|handed)\b(?:\s+\w{1,15}){0,4}? (?:down|on)\b[.,;!?:]?/i,
                    message: `Rather than "hand down" or "hand on" consider e.g. "distribute", "give", "pass"`,
                },
                {
                    pattern: /\b(hang|hangs|hanging|hanged|hung) back\b[.,;!?:]?/i,
                    message: `Rather than "hang back" consider e.g. "delay", "refrain"`,
                },
                {
                    pattern: /\b(hang|hangs|hanging|hanged|hung) on\b[.,;!?:]?/i,
                    message: `Rather than "hang on" consider e.g. "wait"`,
                },
                {
                    pattern: /\b(head|heads|heading|headed) off\b[.,;!?:]?/i,
                    message: `Rather than "head off" consider e.g. "prevent"`,
                },
                {
                    pattern: /\b(help|helps|helping|helped)\b(?:\s+\w{1,15}){0,2}? out\b[.,;!?:]?/i,
                    message: `Rather than "help out" simply use "help"`,
                },
                {
                    pattern: /\b(hide|hides|hiding|hided|hidden)\b(?:\s+\w{1,15}){0,4}? away\b[.,;!?:]?/i,
                    message: `Rather than "hide away" simply use "hide"`,
                },
                {
                    pattern: /\b(hinge|hinges|hinging|hinged) (up)?on\b/i,
                    message: `Rather than "hinge (up)on" consider e.g. "depend on"`,
                },
                {
                    pattern: /\b(hold|holds|holding|held)\b(?:\s+\w{1,15}){0,4}? back\b[.,;!?:]?/i,
                    message: `Rather than "hold back" consider e.g. "curb", "defer", "delay", "deny", "restrain", "suppress", "withhold"`,
                },
                {
                    pattern: /\b(hold|holds|holding|held)\b(?:\s+\w{1,15}){0,4}? (?:off|up)\b[.,;!?:]?/i,
                    message: `Rather than "hold off" or "hold up" consider e.g. "defer", "delay", "obstruct", "refrain", "refuse", "restrain", "suppress", "wait"`,
                },
                {
                    pattern: /(?<!\b(?:a|the)\s)\b(hold|holds|holding|held)\b(?:\s+\w{1,15}){0,4}? on(to)?\b[.,;!?:]?/i,
                    message: `Rather than "hold on" consider e.g. "defer", "delay", "hold", "keep", "maintain", "refrain", "refuse", "restrain", "save", "suppress", "wait"`,
                },
                {
                    pattern: /\b(hook|hooks|hooking|hooked)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "hook up" consider e.g. "connect"`,
                },
                {
                    pattern: /\b(hunt|hunts|hunting|hunted)\b(?:\s+\w{1,15}){0,4}? (?:down|up)\b[.,;!?:]?/i,
                    message: `Rather than "hunt down" or "hunt up" consider e.g. "find", "search for", "seek"`,
                },
                {
                    pattern: /\b(iron|irons|ironing|ironed)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "iron out" consider e.g. "fix", "repair"`,
                },
                {
                    pattern: /\b(be|being|is|are|was|were) up\b/i,
                    message: `Rather than "is up" consider e.g. "increases"; rather than "is up to" consider "intends", or "maximum"; rather than "is up for" consider "considers" or "wants"`,
                },
                {
                    pattern: /\b(jot|jots|jotting|jotted|note|notes|noting|noted|write|writes|writing|wrote|written)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "jot down" or "note down" or "write down" consider e.g. "keep", "note", "write"`,
                },
                {
                    pattern: /\b(keep|keeps|keeping|kept)\b(?:\s+\w{1,15}){0,4}? around\b[.,;!?:]?/i,
                    message: `Rather than "keep around" consider e.g. "keep", "maintain"`,
                },
                {
                    pattern: /\b(keep|keeps|keeping|kept) at it\b[.,;!?:]?/i,
                    message: `Rather than "keep at it" consider e.g. "continue", "persist"`,
                },
                {
                    pattern: /\b(keep|keeps|keeping|kept) on\b[.,;!?:]?/i,
                    message: `Rather than "keep on" consider e.g. "continue", "persist"`,
                },
                {
                    pattern: /\b(keep|keeps|keeping|kept)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "keep out" consider e.g. "exclude", "forbid"`,
                },
                {
                    pattern: /\b(keep|keeps|keeping|kept)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "keep up" consider e.g. "maintain", "match", "persist", "sustain"`,
                },
                {
                    pattern: /\b(kick|kicks|kicking|kicked)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "kick off" consider e.g. "begin", "launch", "start"`,
                },
                {
                    pattern: /\b(kick|kicks|kicking|kicked)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "kick out" consider e.g. "expel"`,
                },
                {
                    pattern: /\b(kill|kills|killing|killed)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "kill off" simply use "kill"`,
                },
                {
                    pattern: /\b(leave|leaves|leaving|left)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "leave out" consider e.g. "omit"`,
                },
                {
                    pattern: /\b(line|lines|lining|lined)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "line up" consider e.g. "arrange", "order", "organize", "position", "rank"`,
                },
                {
                    pattern: /\b(link|links|linking|linked)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "link up" consider e.g. "connect", "join"`,
                },
                /** false positives e.g. "people who live with you"
                {
                    pattern: /\b(live|lives|living|lived) with\b[.,;!?:]?/i,
                    message: `Rather than "live with" consider e.g. "accept"`
                },
                **/
                {
                    pattern: /\b(live|lives|living|lived) up to\b/i,
                    message: `Rather than "live up to" consider e.g. "accomplish", "conform", "fulfill", "honor", "implement", "meet", "realize"`,
                },
                {
                    pattern: /\b(lock|locks|locking|locked)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "lock down" consider e.g. "secure"`,
                },
                {
                    pattern: /\b(lock|locks|locking|locked)\b(?:\s+\w{1,15}){0,4}? in\b[.,;!?:]?/i,
                    message: `Rather than "lock in" consider e.g. "commit", "restrict"`,
                },
                {
                    pattern: /\b(lock|locks|locking|locked)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "lock out" consider e.g. "exclude", "forbid", "restrict"`,
                },
                {
                    pattern: /\blook(?:s|ed|ing)? back\b/i,
                    message: `Rather than "look back" consider e.g. "remember", "review"`,
                },
                {
                    pattern: /\blook(?:s|ed|ing)? into\b/i,
                    message: `Rather than "look into" consider e.g. "investigate", "research"`,
                },
                {
                    pattern: /\blook(?:s|ed|ing)? out\b/i,
                    message: `Rather than "look out" consider e.g. "beware"`,
                },
                {
                    pattern: /\blook(?:s|ed|ing)?\b(?:\s+\w{1,15}){0,4}? (s:over|through)\b[.,;!?:]?/i,
                    message: `Rather than "look over" or "look through" consider e.g. "review"`,
                },
                {
                    pattern: /\b(look|looks|looking|looked)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "look up" consider e.g. "consult", "find", "search", "query", "retrieve"; or if used as an adjective, use "lookup" (e.g. "a lookup table")`,
                },
                {
                    pattern: /\blos(?:e|es|ed|ing) out\b/i,
                    message: `Rather than "lose out" consider e.g. "forfeit", "lose", "miss"`,
                },
                {
                    pattern: /\b(make|makes|making|made) do\b/i,
                    message: `Rather than "make do" consider e.g. "accept", "allow"`,
                },
                {
                    pattern: /\b(make|makes|making|made)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "make up" consider e.g. "invent", "fabricate", "reconcile"`,
                },
                {
                    pattern: /\b[Mm]ax(?:es|ed|ing)?\b(?:\s+\w{1,15}){0,4}? [Oo]ut\b[.,;!?:]?/,
                    message: `Rather than "max out" consider e.g. "maximize"`,
                },
                {
                    pattern: /\bmeasur(?:e|es|ed|ing)\b(?:\s+\w{1,15}){0,4}? against\b[.,;!?:]?/i,
                    message: `Rather than "measure against" consider e.g. "compare to/with"`,
                },
                {
                    pattern: /\b(miss|misses|missing|missed) out\b/i,
                    message: `Rather than "miss out" consider e.g. "avoid", "fail", "lose", "miss", "neglect"`,
                },
                {
                    pattern: /\b(mix|mixes|mixing|mixed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "mix up" consider e.g. "confuse"`,
                },
                {
                    pattern: /\b(mock|mocks|mocking|mocked)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "mock up" consider e.g. "model"`,
                },
                {
                    pattern: /\b(move|moves|moving|moved) ahead\b[.,;!?:]?/i,
                    message: `Rather than "move ahead" consider e.g. "advance", "progress", "surpass"`,
                },
                {
                    pattern: /\b(move|moves|moving|moved) away\b[.,;!?:]?/i,
                    message: `Rather than "move away" consider e.g. "abandon", "avoid", "retreat"`,
                },
                {
                    pattern: /\b(nail|nails|nailing|nailed)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "nail down" consider e.g. "confirm", "settle"`,
                },
                {
                    pattern: /\b(open|opens|opening|opened)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "open up" simply use "open"`,
                },
                {
                    pattern: /\b(opt|opts|opting|opted) for\b/i,
                    message: `Rather than "opt for" consider e.g. "choose", "select"`,
                },
                {
                    pattern: /\b(pack|packs|packing|packed) up\b/i,
                    message: `Rather than "pack up" consider e.g. "assemble", "compile"`,
                },
                {
                    pattern: /\bpad(?:ded|s|ding)? out\b/i,
                    message: `Rather than "pad out" simply use "pad"`,
                },
                {
                    pattern: /\bpart(?:ed|s|ing)? with\b/i,
                    message: `Rather than "part with" consider e.g. "relinquish"`,
                },
                {
                    pattern: /\b(pass|passes|passing|passed)\b(?:\s+\w{1,15}){0,4}? around\b[.,;!?:]?/i,
                    message: `Rather than "pass around" consider e.g. "distribute"`,
                },
                {
                    pattern: /\b(pass|passes|passing|passed)\b(?:\s+\w{1,15}){0,4}? (?:down|on)\sto\b/i,
                    message: `Rather than "pass down to" or "pass on to" simply use "pass to"`,
                },
                {
                    pattern: /\b(pass|passes|passing|passed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "pass up" consider e.g. "decline"`,
                },
                {
                    pattern: /\b(patch|patches|patching|patched)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "patch up" consider e.g. "repair"`,
                },
                {
                    pattern: /\b(pay|pays|paying|paid)\b(?:\s+\w{1,15}){0,4}? back\b/i,
                    message: `Rather than "pay back" consider e.g. "refund" or "repay"`,
                },
                {
                    pattern: /\b(phase|phases|phasing|phased)\b(?:\s+\w{1,15}){0,4}? (?:in|out)\b/i,
                    message: `Rather than "phase in/out" consider e.g. "introduce/remove (gradually)"`,
                },
                {
                    pattern: /\b(pick|picks|picking|picked)\b(?:\s+\w{1,15}){0,4}? out\b/i,
                    message: `Rather than "pick out" consider e.g. "choose", "select"`,
                },
                {
                    pattern: /\b(pick|picks|picking|picked)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "pick up" consider e.g. "resume", "collect", "learn", "retrieve"`,
                },
                {
                    pattern: /\b(pile|piles|piling|piled) up\b/i,
                    message: `Rather than "pile up" consider e.g. "accumulate"`,
                },
                {
                    pattern: /\b(pin|pins|pinning|pinned)\b(?:\s+\w{1,15}){0,4}? down\b/i,
                    message: `Rather than "pin down" consider e.g. "determine"`,
                },
                {
                    pattern: /\b(play|plays|playing|played)\b(?:\s+\w{1,15}){0,4}? back\b/i,
                    message: `Rather than "play back" consider e.g. "replay"`,
                },
                {
                    pattern: /\b(plug|plugs|plugging|plugged)\b(?:\s+\w{1,15}){0,4}? in\b/i,
                    message: `Rather than "plug in" consider e.g. "connect"`,
                },
                {
                    pattern: /\bpoint(?:ed|s|ing)?\b(?:\s+\w{1,15}){0,4}? out\b/i,
                    message: `Rather than "point out" consider e.g. "identify", "indicate", "mention", "refer", "specify"`,
                },
                {
                    pattern: /\bprint(?:ed|s|ing)? out\b/i,
                    message: `Rather than "print out" simply use "print"`,
                },
                {
                    pattern: /\bpull(?:ed|s|ing)? ahead\b/i,
                    message: `Rather than "pull ahead" consider e.g. "overtake"`,
                },
                {
                    pattern: /\bpull(?:ed|s|ing)?\b(?:\s+\w{1,15}){0,4}? off\b/i,
                    message: `Rather than "pull off" consider e.g. "accomplish"`,
                },
                {
                    pattern: /\bramp(?:ed|s|ing)? up\b/i,
                    message: `Rather than "ramp up" consider e.g. "rise"`,
                },
                {
                    pattern: /\bratchet(?:ed|s|ing)? up\b/i,
                    message: `Rather than "ratchet up" consider e.g. "increase"`,
                },
                {
                    pattern: /\breach(?:ed|es|ing)? out\b/i,
                    message: `Rather than "reach out to" consider e.g. "contact"`,
                },
                {
                    pattern: /\b(read|reads|reading)\b(?:\s+\w{1,15}){0,4}? (?:off|up)\b/i,
                    message: `Rather than "read off" or "read up on" simply use "read"`,
                },
                {
                    pattern: /\b(roll|rolls|rolling|rolled)\b(?:\s+\w{1,15}){0,4}? back\b/i,
                    message: `Rather than "roll back" consider e.g. "revert"`,
                },
                {
                    pattern: /\b(roll|rolls|rolling|rolled)\b(?:\s+\w{1,15}){0,4}? out\b/i,
                    message: `Rather than "roll out" consider e.g. "introduce", "launch"`,
                },
                {
                    pattern: /\b(root|roots|rooting|rooted)\b(?:\s+\w{1,15}){0,4}? out\b/i,
                    message: `Rather than "root out" consider e.g. "eliminate", "eradicate", "purge"`,
                },
                {
                    pattern: /\b(rule|rules|ruling|ruled)\b(?:\s+\w{1,15}){0,4}? out\b/i,
                    message: `Rather than "rule out" consider e.g. "exclude", "forbid", "prevent", "prohibit"`,
                },
                {
                    pattern: /\b(run|runs|running|ran) across\b/i,
                    message: `Rather than "run across" consider e.g. "discover", "find", "notice"`,
                },
                {
                    pattern: /\b(run|runs|running|ran)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "run up" consider e.g. "accumulate", "incur"`,
                },
                {
                    pattern: /\b(run|runs|running|ran) up against\b/i,
                    message: `Rather than "run up against" consider e.g. "collide", "confront", "encounter", "meet"`,
                },
                {
                    pattern: /\b(save|saves|saving|saved)\b(?:\s+\w{1,15}){0,4}? up\b/i,
                    message: `Rather than "save up" simply use "save"`,
                },
                {
                    pattern: /\b(scale|scales|scaling|scaled)\b(?:\s+\w{1,15}){0,4}? (?:back|down)\b/i,
                    message: `Rather than "scale back" or "scale down consider e.g. "decrease"`,
                },
                {
                    pattern: /\b(scale|scales|scaling|scaled)\b(?:\s+\w{1,15}){0,4}? up\b/i,
                    message: `Rather than "scale up" consider e.g. "increase"`,
                },
                {
                    pattern: /\b(screen|screens|screening|screened)\b(?:\s+\w{1,15}){0,4}? out\b/i,
                    message: `Rather than "screen out" consider e.g. "exclude"`,
                },
                {
                    pattern: /\b(see|sees|seeing|saw|seen) about\b/i,
                    message: `Rather than "see about" consider e.g. "arrange", "consider"`,
                },
                {
                    pattern: /\b(sell|sells|selling|sold)\b(?:\s+\w{1,15}){0,4}? off\b/i,
                    message: `Rather than "sell off" simply use "sell"`,
                },
                {
                    pattern: /\b(send|sends|sending|sent)\b(?:\s+\w{1,15}){0,4}? back\b/i,
                    message: `Rather than "send back" consider e.g. "return"`,
                },
                {
                    pattern: /\b(send|sends|sending|sent)\b(?:\s+\w{1,15}){0,4}? off\b/i,
                    message: `Rather than "send off" simply use "send"`,
                },
                {
                    pattern: /\b(set|sets|setting) about\b/i,
                    message: `Rather than "set about" consider e.g. "begin", "start"`,
                },
                {
                    pattern: /\b(set|sets|setting)\b(?:\s+\w{1,15}){0,4}? apart\b[.,;!?:]?/i,
                    message: `Rather than "set apart" consider e.g. "distinguish", "separate"`,
                },
                {
                    pattern: /\b(set|sets|setting)\b(?:\s+\w{1,15}){0,4}? aside\b[.,;!?:]?/i,
                    message: `Rather than "set aside" consider e.g. "discard", "exclude", "reserve"`,
                },
                {
                    pattern: /\b(set|sets|setting|set)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "set up" consider e.g. "arrange", "configure", "establish", "prepare"`,
                },
                {
                    pattern: /\b(show|shows|showing|showed|shown)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "show up" consider e.g. "appear", "attend"`,
                },
                {
                    pattern: /\b(shut|shuts|shutting)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "shut down" consider e.g. "close", "end", "stop", "terminate"`,
                },
                {
                    pattern: /\b(sign|signs|signing|signed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "sign up" consider e.g. "register"`,
                },
                {
                    pattern: /\b(single|singles|singling|singled)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "single out" consider e.g. "choose", "select"`,
                },
                {
                    pattern: /\b(s[iy]phon|s[iy]phons|s[iy]phoning|s[iy]phoned)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "siphon off" consider e.g. "divert", "take"`,
                },
                {
                    pattern: /\b(sit|sits|sitting|sat) out\b/i,
                    message: `Rather than "sit out" consider e.g. "abstain", "decline"`,
                },
                {
                    pattern: /\b(slow|slows|slowing|slowed)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "slow down" simply use "slow"`,
                },
                {
                    pattern: /\b(sort|sorts|sorting|sorted)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "sort out" consider e.g. "fix", "resolve"`,
                },
                {
                    pattern: /\b(speed|speeds|speeding|sped)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "speed up" consider e.g. "accelerate"`,
                },
                {
                    pattern: /\b(split|splits|splitting)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "split up" simply use "split"`,
                },
                {
                    pattern: /\b(stand|stands|standing|stood) for\b/i,
                    message: `Rather than "stand for" consider e.g. "represent"`,
                },
                {
                    pattern: /\b(start|starts|starting|started) (?:off|out)\b/i,
                    message: `Rather than "start off/out (with)" simply use "start"`,
                },
                {
                    pattern: /\b(start|starts|starting|started) over\b/i,
                    message: `Rather than "start over" consider e.g. "restart"`,
                },
                {
                    pattern: /\b(start|starts|starting|started)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "start up" consider e.g. "start", "initiate", "launch"`,
                },
                {
                    pattern: /\b(stash|stashes|stashing|stashed)\b(?:\s+\w{1,15}){0,4}? away\b[.,;!?:]?/i,
                    message: `Rather than "stash away" simply use "stash"`,
                },
                {
                    pattern: /\b(steer|steers|steering|steered)\b(?:\s+\w{1,15}){0,4}? (?:away|clear)\b[.,;!?:]?/i,
                    message: `Rather than "steer away" or "steer clear" consider e.g. "avoid"`,
                },
                {
                    pattern: /\b(step|steps|stepping|stepped) back\b/i,
                    message: `Rather than "step back" consider e.g. "pause", "reconsider"`,
                },
                {
                    pattern: /\b(step|steps|stepping|stepped)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "step up" consider e.g. "increase", "increment"`,
                },
                {
                    pattern: /\b(stick|sticks|sticking|stuck) to\b/i,
                    message: `Rather than "stick to" consider e.g. "confirm", "limit", "maintain", "restrict"`,
                },
                {
                    pattern: /\b(stick|sticks|sticking|stuck) together\b/i,
                    message: `Rather than "stick together" consider e.g. "accompany"`,
                },
                {
                    pattern: /\b(stick|sticks|sticking|stuck) with\b/i,
                    message: `Rather than "stick with" consider e.g. "continue", "maintain"`,
                },
                {
                    pattern: /\b(stitch|stitchs|stitching|stitched)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "stitch up" consider e.g. "combine", "fix", "reconcile", "tidy"`,
                },
                {
                    pattern: /\b(stop|stops|stopping|stopped) back\b/i,
                    message: `Rather than "stop back" consider e.g. "return"`,
                },
                {
                    pattern: /\b(stop|stops|stopping|stopped) (?:by|in|off)\b/i,
                    message: `Rather than "stop by" or "stop in" or "stop off" consider e.g. "visit"`,
                },
                {
                    pattern: /\b(stow|stows|stowing|stowed)\b(?:\s+\w{1,15}){0,4}? away\b[.,;!?:]?/i,
                    message: `Rather than "stow away" consider e.g. "keep", "stash", "store", "stow"`,
                },
                {
                    pattern: /\b(straighten|straightens|straightening|straightened)\b(?:\s+\w{1,15}){0,4}? (?:out|up)\b[.,;!?:]?/i,
                    message: `Rather than "straighten out" or "straighten up" consider e.g. "clarify", "fix", "improve", "straighten", "tidy"`,
                },
                {
                    pattern: /\b(strike|strikes|striking|struck) out\b/i,
                    message: `Rather than "strike out" consider e.g. "begin", "cancel", "fail", "start"`,
                },
                {
                    pattern: /\b(string|strings|stringing|strung) together\b/i,
                    message: `Rather than "string together" consider e.g. "add", "append", "concatenate", "prepend"`,
                },
                {
                    pattern: /\b(stumble|stumbles|stumbling|stumbled) (?:across|(up)?on)\b/i,
                    message: `Rather than "stumble (up)on" consider e.g. "confront", "find", "notice", "see"`,
                },
                {
                    pattern: /\b(sum|sums|summing|summed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "sum up" consider e.g. "conclude", "summarize"`,
                },
                {
                    pattern: /\b(tack|tacks|tacking|tacked)\b(?:\s+\w{1,15}){0,4}? on(to)?\b[.,;!?:]?/i,
                    message: `Rather than "tack on(to)" consider e.g. "add", "append", "concatenate", "prepend"`,
                },
                {
                    pattern: /\b(tag|tags|tagging|tagged) along\b/i,
                    message: `Rather than "tag along" consider e.g. "accompany"`,
                },
                {
                    pattern: /\b(t(r)?ail|t(r)?ails|t(r)?ailing|t(r)?ailed) off\b/i,
                    message: `Rather than "tail off" or "trail off" consider e.g. "decrease", "diminish"`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? apart\b[.,;!?:]?/i,
                    message: `Rather than "take apart" consider e.g. "disassemble", "partition"`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? away\b[.,;!?:]?/i,
                    message: `Rather than "take away" consider e.g. "remove" (as a noun, use "takeaway", though this is a bit jargony)`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? back\b[.,;!?:]?/i,
                    message: `Rather than "take back" consider e.g. "retract"`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "take down" consider e.g. "destroy", "note", "record", "remove", "write"`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? in\b[.,;!?:]?/i,
                    message: `Rather than "take in" consider e.g. "absorb", "consider", "receive"`,
                },
                {
                    pattern: /\b(take|takes|taking|took) it upon\b[.,;!?:]?/i,
                    message: `Rather than "take it upon yourself" consider e.g. "take responsibility"`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "take off" consider e.g. "advance", "increase", "launch", "progress", "reduce", "remove"`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "take out" consider e.g. "extract", "obtain", "reduce", "remove"`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? over\b[.,;!?:]?/i,
                    message: `Rather than "take over" consider e.g. "adopt", "appropriate", "assume", "usurp"`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? part\b[.,;!?:]?/i,
                    message: `Rather than "take part" consider e.g. "participate"`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "take up" consider e.g. "adopt", "begin", "resume", "start"`,
                },
                {
                    pattern: /\b(take|takes|taking|took)\b(?:\s+\w{1,15}){0,4}? upon\b[.,;!?:]?/i,
                    message: `Rather than "take upon yourself" consider e.g. "be responsible for"`,
                },
                {
                    pattern: /\b(talk|talks|talking|talked)\b(?:\s+\w{1,15}){0,4}? over\b[.,;!?:]?/i,
                    message: `Rather than "talk over" consider e.g. "confer", "discuss"`,
                },
                {
                    pattern: /\b(tap|taps|tapping|tapped) into\b[.,;!?:]?/i,
                    message: `Rather than "tap into" consider e.g. "exploit", "tap", "use"`,
                },
                {
                    pattern: /\b(team|teams|teaming|teamed) up\b[.,;!?:]?/i,
                    message: `Rather than "team up" consider e.g. "cooperate", "coordinate"`,
                },
                {
                    pattern: /\b(tear|tears|tearing|tore|torn)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "tear down" consider e.g. "demolish", "destroy", "disassemble"`,
                },
                {
                    pattern: /\b(tee|tees|teeing|teed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "tee up" consider e.g. "prepare", "present"`,
                },
                {
                    pattern: /\b(tell|tells|telling|told)\b(?:\s+\w{1,15}){0,4}? apart\b[.,;!?:]?/i,
                    message: `Rather than "tell apart" consider e.g. "compare", "distinguish"`,
                },
                {
                    pattern: /\b(think|thinks|thinking|thought)\b(?:\s+\w{1,15}){0,2}? (?:over|through)\b[.,;!?:]?/i,
                    message: `Rather than "think over" or "think through" consider e.g. "consider"`,
                },
                {
                    pattern: /\b(throw|throws|throwing|threw|thrown)\b(?:\s+\w{1,15}){0,4}? (?:away|out)\b[.,;!?:]?/i,
                    message: `Rather than "throw away" or "throw out" consider e.g. "discard", "exclude", "reject"`,
                },
                {
                    pattern: /\b(throw|throws|throwing|threw|thrown)\b(?:\s+\w{1,15}){0,4}? together\b[.,;!?:]?/i,
                    message: `Rather than "throw together" consider e.g. "assemble"`,
                },
                {
                    pattern: /\b(tidy|tidys|tidies|tidying|tidied)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "tidy up" consider e.g. "clean", "tidy"`,
                },
                {
                    pattern: /\b(tie|ties|tieing|tied)\b(?:\s+\w{1,15}){0,4}? in\b[.,;!?:]?/i,
                    message: `Rather than "tie in (with)" consider e.g. "agree", "associate", "coincide", "coordinate"`,
                },
                {
                    pattern: /\b(tie|ties|tying|tied)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "tie up" consider e.g. "block", "occupy"`,
                },
                {
                    pattern: /\b(tighten|tightens|tightening|tightened)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "tighten up" consider e.g. "make efficient", "reduce", "secure"`,
                },
                {
                    pattern: /\b(tone|tones|toning|toned)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "tone down" consider e.g. "moderate"`,
                },
                {
                    pattern: /\b(top|tops|topping|topped)\b(?:\s+\w{1,15}){0,4}? (?:off|up)\b[.,;!?:]?/i,
                    message: `Rather than "top off" or "top up" consider e.g. "complete", "fill", "maximize"`,
                },
                {
                    pattern: /\b(touch|touches|touching|touched)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "touch off" consider e.g. "cause", "trigger"`,
                },
                {
                    pattern: /\b(touch|touches|touching|touched)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "touch up" consider e.g. "fix", "improve"`,
                },
                {
                    pattern: /\b(track|tracks|tracking|tracked)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "track down" consider e.g. "find", "search for", "seek"`,
                },
                {
                    pattern: /\b(trade|trades|trading|traded)\b(?:\s+\w{1,15}){0,4}? in\b[.,;!?:]?/i,
                    message: `Rather than "trade in" consider e.g. "exchange"`,
                },
                {
                    pattern: /\b(trade|trades|trading|traded)\b(?:\s+\w{1,15}){0,4}? off\b[.,;!?:]?/i,
                    message: `Rather than "trade off" consider e.g. "compromise", "exchange"`,
                },
                {
                    pattern: /\b(train|trains|training|trained)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "train up" simply use "train"`,
                },
                {
                    pattern: /\b(try|tries|trying|tried) back\b/i,
                    message: `Rather than "try back" consider e.g. "retry"`,
                },
                {
                    pattern: /\b(try|tries|trying|tried)\b(?:\s+\w{1,15}){0,4}? (?:on|out)\b[.,;!?:]?/i,
                    message: `Rather than "try on" or "try out" consider e.g. "experiment", "sample", "test", "try"`,
                },
                {
                    pattern: /\b(tune|tunes|tuning|tuned)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "tune out" consider e.g. "ignore"`,
                },
                {
                    pattern: /\b(tune|tunes|tuning|tuned)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "tune up" consider e.g. "improve", "optimize"`,
                },
                {
                    pattern: /\b(turn|turns|turning|turned)\b(?:\s+\w{1,15}){0,4}? away\b[.,;!?:]?/i,
                    message: `Rather than "turn away" consider e.g. "block", "deny", "reject"`,
                },
                {
                    pattern: /\b(turn|turns|turning|turned)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "turn down" consider e.g. "decrease", "diminish", "reduce", "reject", "throttle"`,
                },
                {
                    pattern: /\b(turn|turns|turning|turned)\b(?:\s+\w{1,15}){0,4}? in\b[.,;!?:]?/i,
                    message: `Rather than "turn in" consider e.g. "submit"`,
                },
                {
                    pattern: /\b(turn|turns|turning|turned)\b(?:\s+\w{1,15}){0,4}? into\b[.,;!?:]?/i,
                    message: `Rather than "turn into" consider e.g. "convert", "transform"`,
                },
                {
                    pattern: /\b(turn|turns|turning|turned)\b(?:\s+\w{1,15}){0,4}? on\b[.,;!?:]?/i,
                    message: `Rather than "turn on" consider e.g. "activate", "begin", "initiate", "start"`,
                },
                {
                    pattern: /\b(turn|turns|turning|turned) to\b[.,;!?:]?/i,
                    message: `Rather than "turn to" consider e.g. "consult"`,
                },
                {
                    pattern: /\b(turn|turns|turning|turned)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "turn up" consider e.g. "appear", "increase"`,
                },
                {
                    pattern: /\b(use|uses|using|used)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "use up" consider e.g. "consume", "deplete", "finish"`,
                },
                {
                    pattern: /\b(vacuum|vacuums|vacuuming|vacuumed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "vacuum up" consider e.g. "consume", "remove"`,
                },
                {
                    pattern: /\b(wade|wades|wading|waded) through\b[.,;!?:]?/i,
                    message: `Rather than "wade through" consider e.g. "finish"`,
                },
                {
                    pattern: /\b(wait|waits|waiting|waited) around\b[.,;!?:]?/i,
                    message: `Rather than "wait around" simply use "wait"`,
                },
                {
                    pattern: /\b(wake|wakes|wakeing|waked)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "wake up" consider e.g. "awaken"`,
                },
                {
                    pattern: /\b(walk|walks|walking|walked)\b(?:\s+\w{1,15}){0,4}? through\b[.,;!?:]?/i,
                    message: `Rather than "walk through" consider e.g. "demonstrate", "explain"`,
                },
                {
                    pattern: /\b(warm|warms|warming|warmed)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "warm up" consider e.g. "initialize", "prepare"`,
                },
                {
                    pattern: /\b(watch|watches|watching|watched) out\b[.,;!?:]?/i,
                    message: `Rather than "watch out" consider e.g. "anticipate", "beware"`,
                },
                {
                    pattern: /\b(weed|weeds|weeding|weeded)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "weed out" consider e.g. "exclude", "filter", "remove"`,
                },
                {
                    pattern: /\b(weigh|weighs|weighing|weighed) in\b[.,;!?:]?/i,
                    message: `Rather than "weigh in" consider e.g. "analyze", "assess", "determine", "join", "review", "scrutinize"`,
                },
                {
                    pattern: /\b(wind|winds|winding|wound)\b(?:\s+\w{1,15}){0,4}? down\b[.,;!?:]?/i,
                    message: `Rather than "wind down" consider e.g. "close", "end", "subside", "taper"`,
                },
                {
                    pattern: /\b(wipe|wipes|wiping|wiped)\b(?:\s+\w{1,15}){0,4}? out\b[.,;!?:]?/i,
                    message: `Rather than "wipe out" consider e.g. "bankrupt", "eliminate", "erase", "obliterate"`,
                },
                {
                    pattern: /\b(wrap|wraps|wrapping|wrapped)\b(?:\s+\w{1,15}){0,4}? up\b[.,;!?:]?/i,
                    message: `Rather than "wrap up" consider e.g. "complete", "conclude", "finish", "wrap"`,
                },
                {
                    pattern: /\b(zoom|zooms|zooming|zoomed)\b(?:\s+\w{1,15}){0,4}? in\b[.,;!?:]?/i,
                    message: `Rather than "zoom in" consider e.g. "enlarge", "focus", "magnify"`,
                },
                /**********************************
                 * Avoid grating gender assumptions
                 **********************************/
                {
                    pattern: /\bmanmade\b/i,
                    message: `Rather than "manmade" consider e.g. "manufactured"`,
                },
                {
                    pattern: /\bmanpower\b/i,
                    message: `Rather than "manpower" consider e.g. "headcount", "personnel"`,
                },
                {
                    pattern: /\bmiddlem[ae]n\b/i,
                    message: `Rather than "middleman" consider e.g. "intermediary"`,
                },
                {
                    pattern: /\bsalesm[ae]n\b/i,
                    message: `Rather than "salesman" consider e.g. "sales person"`,
                },
                {
                    pattern: /\bworkmanship\b/i,
                    message: `Rather than "workmanship" consider e.g. "craft"`,
                },
                /**************************************
                 * Miscellaneous style choices: numbers
                 **************************************/
                {
                    // Match ordinals like 1st, 2nd, 3rd, but exclude street addresses
                    // Street addresses: "1st St.", "2nd Ave.", "3rd Blvd.", etc.
                    pattern: /\b\d(?:st|nd|rd|th)(?!\s+(?:St\.|Street|Ave\.|Avenue|Blvd\.|Boulevard|Rd\.|Road|Dr\.|Drive|Ln\.|Lane|Way|Ct\.|Court|Pl\.|Place|Ter\.|Terrace|Pkwy\.|Parkway))/i,
                    message: `Rather than 1st, 2nd, 3rd, etc., spell out small ordinals (first, second, third, etc.)`,
                },
                {
                    pattern: /(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)ly/,
                    message: `Do not make an adverb out of ordinals (e.g. firstly, secondly, thirdly, etc.); instead use "first", "second", etc.`,
                },
                /************************************
                 * Miscellaneous style choices: words
                 ************************************/
                {
                    pattern: /\bcheck box\b/i,
                    message: `Use "checkbox" rather than "check box"`,
                },
                {
                    pattern: /\be-mail/i,
                    message: `Use "email" rather than "e-mail"`,
                },
                {
                    pattern: /\bfile name\b/i,
                    message: `Use "filename" rather than "file name"`,
                },
                {
                    pattern: /\bmin\b/i,
                    message: `Use "minumum" or "minute(s)" rather than "min"`,
                },
                {
                    pattern: /\bOnce\b/,
                    message: `Use "After" or "When" rather than "Once," which can imply "only one time"`,
                },
                /** too many false positives when "once" is used correctly to mean only-one-time
                {
                    pattern: /(?<!\b(?:at|only)\s)\bonce\b(?!(?:\sper\b|\.|\,|\:))/,
                    message: `Use "after" or "when" rather than "once," which can imply "only one time"`,
                },
                **/
                {
                    pattern: /\b[Oo]ne (?:must|should)\b/i,
                    message: `Do not use "one" as a pronoun; specify who one is`,
                },
                {
                    pattern: /\bsynch\b/i,
                    message: `Use "sync" or "synchronize" rather than "synch"`,
                },
                {
                    pattern: /\bwifi\b/i,
                    message: `Use "Wi-Fi" rather than "WiFi" or "Wifi"`,
                },
                /******************************************************
                 * Prefer appropriate unicode rather than ASCII kludges
                 ******************************************************/
                {
                    pattern: /["']/,
                    message: `Use typographic quotation marks or apostrophes (e.g., “ ” ‘ ’) instead of straight quotes (" ')`,
                },
                {
                    pattern: /\(c\)/i,
                    message: `Use © rather than (c) for the copyright symbol`,
                },
                {
                    pattern: /[^-]--[^-]/, // triple-or-more-hyphens probably is a table head/body divider
                    message: `Use an em dash (—) instead of double hyphens (--)`,
                },
                {
                    // Match digit-hyphen-digit patterns, but exclude phone numbers
                    // Phone numbers have multiple hyphen-separated groups like XXX-XXX-XXXX or XXX-XXXX
                    // This pattern matches digit-hyphen-digit only when it's NOT part of a phone number:
                    // - Not preceded by digits-hyphen (e.g., "202-3615" is preceded by "5-" in "805-202-3615")
                    // - Not followed by hyphen-digits (e.g., "805-202" is followed by "-3" in "805-202-3615")
                    // This way "5-10" or "57-145" matches, but parts of "805-457-1451" do not
                    pattern: /(?<!\d-)\d+-\d+(?!-\d)/,
                    message: `Use a minus (for subtraction) or an en-dash (for ranges) between numbers, rather than a hyphen`,
                },
                {
                    pattern: /\.\.\./,
                    message: `Use an ellipsis character (…) instead of three dots "..."`,
                },
                {
                    pattern: /[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ]/i,
                    message: `Use ordinary alphabetical characters rather than special roman numeral characters for roman numerals`,
                },
                {
                    pattern: /[æœﬆﬅǌǉĳﬂﬁﬄﬃﬀǳ㏌№]/i,
                    message: `Use ordinary combinations of alphabetical characters rather than ligatures`,
                },
            ];

            // Check if this text node contains patterns we should skip

            // Phone numbers: all-digit or vanity numbers (with letters)
            // Examples: XXX-XXX-XXXX, XXX-XXXX, 805-549-STOP, 1-800-FLOWERS
            // Vanity numbers start with digits (area code) and may have letters in later segments
            const looksLikePhoneNumber = /\d{2,4}-\d{2,4}-[\dA-Z]{2,4}|\d{2,4}-[\dA-Z]{3,}/i.test(value);

            // URL fragments: sequences of non-whitespace characters containing dots
            // Examples: example.com, .us, http://example.org/path
            const looksLikeURL = /\S*\.\S+/.test(value);

            for (const { pattern, message } of problems) {
                // Skip the hyphen check if the value contains a phone number
                if (looksLikePhoneNumber && message.includes("en-dash")) {
                    continue;
                }
                // Skip pronoun and abbreviation checks if the value contains a URL
                if (looksLikeURL && (message.includes("first-person plural") || message.includes("U.S.A."))) {
                    continue;
                }
                if (pattern.test(value)) {
                    file.message(message, node);
                }
            }
        });
    };
}

// Needed to traverse AST
import { visit } from "unist-util-visit";

