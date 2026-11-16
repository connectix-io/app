# Real-world migrations from MUI to shadcn/ui + Tailwind: experiences, effort, pitfalls

Research date: 2026-11-12. Most sources are from 2025–2026; older ones are dated. Each source is tagged **[first-hand]** (the team describes its own migration), **[vendor-first-hand]** (an agency or seller describes a client project, so it has a commercial interest), **[plan]** (a stated intention, not an outcome) or **[opinion]** (comparison or advice pieces).

## 1. Published case studies: team size, app size, duration, motivations, results

### Takeaway
There are only a handful of real, first-hand MUI-to-shadcn (or MUI-to-headless) write-ups.
- **What drove them:** teams had overridden most of MUI to look like their own brand ("fighting MUI"), they were juggling several design systems, and they wanted smaller bundles or code AI tools could follow.
- **How long it took:** reported durations run from about 2 weeks with heavy AI-agent use (Ambrook, very large codebase) to about 18 months under a strangler-fig rule (Thrive, 50+ engineers).
- **Results:** reports agree on one design system, faster UI assembly and smaller bundles. The only hard bundle numbers come from a vendor and lack methodology.

### Cited Findings
- **Thrive Learning [first-hand], 12 Aug 2026, Staff Engineer Michael Hutchinson.**
  - Started January 2025; results written up at about 18 months.
  - More than 50 engineers made about 670 commits to the new library: about 70 core primitives, about 100 product components and over 120 Storybook stories.
  - Motivation: three competing UI libraries, drift between Figma and production, two earlier attempts that stalled, and MUI code that was "mostly layers of overrides trying to make Material UI look like Thrive."
  - Approach: strangler fig with three enforced rules. All new work uses the new system. Any old screen a team touches gets migrated. Old systems stay working until they are deleted.
  - Where it ended: imports of the previous kit are at zero, and MUI is down to "its last few dozen files."
  - Every component had to meet WCAG 2.2 AA and support RTL (right-to-left).
  - Quotes: "Expect an ugly middle." "An unfinished migration leaves you with one more design system than you started with." "The process matters more than the framework."
  - [Thrive](https://www.thrivelearning.com/blog-news/from-three-design-systems-to-one-our-migration-to-shadcn-ui)
- **Ambrook [first-hand], 6 Aug 2026, MUI → Base UI (headless, not shadcn).**
  - Motivation: "having overridden nearly all of MUI's style defaults in favor of our own styles."
  - Scope: 794 files and about 54,000 changed lines across a cross-platform design system (React web and React Native).
  - Duration: just over 2 weeks from first commit to launch.
  - Method: a planner agent (in Claude Code) plus parallel cloud agents produced 60 PRs over 120+ agent sessions, using about 4.5B tokens. Adversarial review agents checked the work, and humans reviewed every PR.
  - Before any swaps, they added about 1,270 component test cases and dozens of Storybook stories, because bugs only showed up in specific prop combinations.
  - Component props were frozen during the work, and an icon codemod touching 600+ files ran before the component swaps.
  - Outcome: no major regressions. Post-launch work still included accessibility fixes, new React Aria date pickers and a smaller bundle from removing MUI and Emotion.
  - [Ambrook](https://ambrook.com/engineering/ai/migrating-fast-with-agent-graphs-design-system-material-ui-base-ui)
- **MetaDesign Solutions [vendor-first-hand], 17 Sep 2026.**
  - App: an unnamed client's enterprise SaaS dashboard with 120+ screens, 38 distinct MUI components and 187 npm dependencies.
  - Duration: a 2-week audit plus about 7 weeks of incremental, page-by-page migration. Leaf components went first. DataGrid, Autocomplete, DatePicker and Dialog came last. MUI was removed in the final week.
  - Claimed results (no methodology):

    | Metric | Before | After |
    |---|---|---|
    | Gzipped JS | 1.8 MB | 680 KB (−62%) |
    | First Contentful Paint (FCP) | 4.2 s | 1.4 s |
    | Time to Interactive (TTI) | 8.7 s | 3.2 s |
    | Build time | 94 s | 41 s |
    | npm dependencies | 187 | 134 |
    | AI-generated code rejected | 45% | 8% (after adding a `rules.md` for AI tools) |

  - Self-reported mistakes:
    - Starting the DataGrid in week 3 blocked other work.
    - The `rules.md` came too late, so AI tools kept generating MUI-style code.
    - Visual regressions were caught only because they used Chromatic (visual snapshot testing).
  - [MetaDesign](https://metadesignsolutions.com/blog/migrating-react-app-from-mui-to-shadcn-ui-design-system-case-study)
- **coder/coder (open source) [plan, then abandoned as an epic].**
  - Issue opened 22 Jul 2025 to move from MUI to shadcn and from Emotion to Tailwind.
  - Scope: 1,077 TS/React files. About 220 use MUI (546 imports across 61 components) and 189 use Emotion (1,275 usages). There was already a partial start: 673 Tailwind classes and 20 files using Radix.
  - Estimate: **5.5–8 weeks (28–41 days)**.
  - Motivation: one component library, removing the Emotion runtime, a better developer experience, and Radix's accessibility.
  - Closed 26 Oct 2025 "in favor of more granular handling," with no sub-issues linked. The migration is evidently ongoing piecemeal rather than finished as planned.
  - [coder #18993](https://github.com/coder/coder/issues/18993)
- **Open Targets [plan].**
  - Issue opened 18 Sep 2026, right after an MUI v5 → v7 upgrade.
  - Plan: swap the ~60 MUI primitives in their `packages/ui` facade one by one, keeping the same exports, so the app and MUI coexist during the work.
  - Order: map the MUI theme to Tailwind config and CSS variables; get Storybook coverage as the baseline; swap Chip, Button and Tooltip first; check each swap with `tsc` plus a build.
  - "Solo effort for now." No progress yet.
  - [opentargets #4537](https://github.com/opentargets/issues/issues/4537)
- **Swizec Teller [first-hand], 1 Aug 2026. This is Bootstrap → Tailwind with a custom shadcn theme, not MUI, but it is directly relevant to AI-assisted migration.**
  - Scale: hundreds of pages; a ~22,000-line diff; class tokens reduced from 33,017 to 12,765.
  - Time: a few hours of agent work, about a day of manual testing, 13 bugs fixed the same day, and "a team's worth of work in 5 days."
  - His earlier attempt (JoyUI → MUI v7 via Claude, an 8-hour "monster PR") was abandoned: "we got the same mess as before but in a new library."
  - Lesson: "we need to do the human taste step first."
  - [Swizec](https://swizec.com/blog/agents-change-the-math-on-big-bang-migrations)
- **Other bundle figures [opinion]:** one comparison blog reports about 1.2 MB → about 600 KB after an MUI → shadcn move on a "mid-sized project," without details ([Easton Dev, Mar 2026](https://eastondev.com/blog/en/posts/dev/20260326-shadcn-ui-vs-component-libraries/)).

### Inferences
- Every successful first-hand case was driven by "we already override MUI everywhere" or by having several competing systems. None migrated an app that was happy with MUI's look.
- In the reports, timelines depend on process (enforcement rules, test baselines, AI tooling) more than on codebase size.
- For a ~36-file, ~5,000-line app, the reported scales suggest roughly days to two weeks of focused work. This app is far smaller than coder (220 MUI files, estimated 5.5–8 weeks) or the MetaDesign client (120+ screens, about 7 weeks).

### Gaps
- No first-hand case found for a small app (under 50 files) or a small team (1–3 developers) with measured before/after numbers.
- No independently measured bundle or performance figures. The 62% claim is vendor-reported.
- No Hacker News threads with first-hand MUI → shadcn migration stories surfaced in search.

## 2. Running MUI (Emotion) and Tailwind/shadcn side by side

### Takeaway
Coexistence is officially supported and is the norm in every case study.
- **Clean path:** MUI v7 plus Tailwind v4 with `enableCssLayer` puts MUI styles in a `@layer mui` that Tailwind utilities override without `!important`.
- **Older or hacky paths:** an `important: '#app-root'` selector or a class prefix. Both break for portaled content such as menus, popovers and dialogs.
- **Preflight:** Tailwind's base reset can still clash with MUI's buttons.
- **Visual side:** sharing theme tokens through CSS variables is what keeps half-migrated screens looking coherent.

### Cited Findings
- **Official MUI Tailwind v4 setup for Vite:**
  - Wrap the app in `<StyledEngineProvider enableCssLayer>`.
  - Make `<GlobalStyles styles="@layer theme, base, mui, components, utilities;" />` its first child.
  - Troubleshooting: requires Tailwind v4 or later, and in DevTools the `mui` layer must come before `utilities`.
  - An optional theme-token snippet adds `@layer base` styles to `h1`–`h6`, `p` and `span`.
  - [MUI docs](https://mui.com/material-ui/integrations/tailwindcss/tailwindcss-v4); [MUI CSS layers](https://mui.com/material-ui/customization/css-layers/)
- The MUI v7 announcement covers the CSS-layers feature and says it was backported to v6 ([MUI v7 blog](https://mui.com/blog/material-ui-v7-is-here/)).
- **Preflight conflict:** Tailwind's button reset (`background-color: transparent`) made MUI Button backgrounds transparent after the Tailwind 3.0 upgrade, and it was still happening in 3.1.2. Workarounds in community threads:
  - put an override after the reset;
  - use a custom preflight with that one line removed;
  - disable preflight entirely, which breaks Tailwind styles that rely on the reset;
  - prefix Tailwind classes.
  - [Tailwind discussion #5969](https://github.com/tailwindlabs/tailwindcss/discussions/5969) (2021–2022, Tailwind v3 era; pre-dates CSS layers)
- **Older interop path:** the `important` selector approach "doesn't reach Popover/Menu content rendered under body," because portals render outside the React root. [Lightrun answer summarizing a MUI issue](https://lightrun.com/answers/mui-material-ui-tailwind-styles-arent-applied-to-popover-menus-when-following-tailwind-mui-interoperability-docs) (older, pre-v7)
- MetaDesign scoped Tailwind's `important` to `#app-root` and wrapped each component in a temporary compatibility wrapper during the migration ([MetaDesign](https://metadesignsolutions.com/blog/migrating-react-app-from-mui-to-shadcn-ui-design-system-case-study)).
- Thrive mapped its design tokens onto the CSS variables shadcn uses, so half-migrated screens stayed coherent; dark and light mode came along as a side effect ([Thrive](https://www.thrivelearning.com/blog-news/from-three-design-systems-to-one-our-migration-to-shadcn-ui)).
- Open Targets' first planned step is to map the MUI theme (palette, typography, spacing, radii) to Tailwind config and CSS variables ([opentargets #4537](https://github.com/opentargets/issues/issues/4537)).
- Mixing both libraries on one screen produces "two focus treatments, two spacing scales, and two notions of size." Converting a theme object into CSS variables and utility classes is design work that codemods cannot do. [21st.dev, Aug 2026, opinion; the publisher sells copy-paste components]([21st.dev](https://21st.dev/blog/mui-vs-shadcn))
- Emotion styles injected later in the document can beat Tailwind utilities on specificity, which is a separate problem from the preflight reset ([Kitemetric blog](https://kitemetric.com/blogs/tailwind-css-production-breakage-case-sensitivity-material-ui-conflicts)).

### Inferences
- For this app (MUI 7, React 19, Vite): the setup with the least friction is Tailwind v4 plus `StyledEngineProvider enableCssLayer` plus the explicit layer order.
- The 5 themes should become the single source of truth as CSS variables, with the MUI `createTheme` palette reading those same variables, so both systems stay in sync while they coexist.
- Portaled MUI components (Menu, Dialog, Popover, and Drawer, which the softphone dock and main menu use) are where the older `important` or prefix strategies fail. The layer approach avoids that.

### Gaps
- I found no first-hand report on preflight under Tailwind v4 with MUI v7 and `enableCssLayer`. MUI's guide does not mention preflight. My working assumption is that preflight in `@layer base` loses to `@layer mui` and so stops clashing, but this needs testing.
- I found no report on whether MUI's RTL setup (Emotion `stylis-plugin-rtl`) still works with `enableCssLayer`.

## 3. Common pitfalls: complex components, RTL, accessibility, design drift, AI-assisted migration

### Takeaway
Pitfalls reported again and again:
- **Complex components:** DataGrid, date pickers and Autocomplete have no drop-in replacement and should be done late (or kept on MUI).
- **Design drift:** copy-paste components get re-implemented slightly differently by each developer.
- **Big-bang rewrites:** reviewers can't keep up.
- **RTL:** shadcn's RTL support is new, with sharp edges: Radix needs an explicit `DirectionProvider` and ignores `<html dir="rtl">`; portals need a `dir` prop; some components need manual migration.
- **AI-assisted migration:** it works when a human sets the taste and rules first and there is a test or visual baseline; otherwise you get "the same mess in a new library."

### Cited Findings
**Complex components**
- MUI X DataGrid has no shadcn equivalent; the usual replacement is TanStack Table plus shadcn's Table ([SERP blocks blog, 2026](https://blocks.serp.co/blog/shadcn-ui-vs-material-ui-comparison)).
- Date pickers need alternatives, and MUI's built-in animations must be added by hand ([Easton Dev](https://eastondev.com/blog/en/posts/dev/20260326-shadcn-ui-vs-component-libraries/)).
- MetaDesign starting the DataGrid in week 3 blocked other work; they moved complex components to the end ([MetaDesign](https://metadesignsolutions.com/blog/migrating-react-app-from-mui-to-shadcn-ui-design-system-case-study)).
- Ambrook built new React Aria date pickers after launch ([Ambrook](https://ambrook.com/engineering/ai/migrating-fast-with-agent-graphs-design-system-material-ui-base-ui)).
- One 2026 write-up advises against shadcn if you need a heavy data grid or want upgrades handled for you ([tiennguyen.dev](https://tiennguyen.dev/is-shadcn-worth-it/)).

**RTL**
- How shadcn's RTL support works:
  - Setting `rtl: true` in `components.json` makes the CLI rewrite physical classes to logical ones (`left`/`right` → `start`/`end`, including spacing and alignment), turn directional animations into logical ones, and add `rtl:rotate-180` to supported icons.
  - Automatic conversion only applies to projects created with `shadcn create` using the new styles (`base-nova`, `radix-nova`).
  - Existing components can be converted with `migrate rtl`, but **Calendar, Pagination and Sidebar must be migrated manually**.
  - Portal content (Popover, Tooltip) needs an explicit `dir` prop because of a tw-animate-css issue.
  - Some icons still need `rtl:rotate-180` added by hand.
  - [shadcn RTL docs](https://ui.shadcn.com/docs/rtl)
- Radix's `useDirection()` falls back to `'ltr'` and ignores `<html dir="rtl">` when there is no `DirectionProvider`. Reported for dropdowns, dialogs, popovers and scroll areas (13 Mar 2026). Closed "not planned" on 7 Jun 2026 because the fix would cause server-rendering hydration mismatches. Workaround: wrap the app in `DirectionProvider` (the reporter kept it in sync with a `MutationObserver`). [radix-ui/primitives #3830](https://github.com/radix-ui/primitives/issues/3830)
- A blind regex sweep from `ml-`/`mr-` to `ms-`/`me-` needs a manual review of the diff. Transforms and icons need the `rtl:` and `ltr:` variants. Some icons should not flip. Text alignment has gaps in some kits. [Untitled UI RTL docs](https://www.untitledui.com/react/docs/rtl); [Tabler RTL](https://docs.tabler.io/ui/getting-started/rtl); [shadcnstudio](https://shadcnstudio.com/blog/shadcn-rtl-support-nextjs/)
- Thrive treated RTL plus WCAG 2.2 AA as a requirement for every primitive, so it was built in rather than retrofitted ([Thrive](https://www.thrivelearning.com/blog-news/from-three-design-systems-to-one-our-migration-to-shadcn-ui)).

**Accessibility, design drift and maintenance**
- **LogRocket, 14 Oct 2025 [first-hand, but Mantine → shadcn, not MUI]:**
  - "Different teammates would implement the same button slightly differently, and before long, our UI felt fragmented."
  - "we were maintaining our own shadow version of the library on top of the product itself."
  - Components weren't always keyboard-friendly or screen-reader-ready out of the box, so they built workarounds.
  - A test build showed slowdowns on mobile.
  - "Our worst mistake was a 'big bang' switch."
  - Fixes adopted: governance, token linting, visual regression tests, and incremental adoption.
  - [LogRocket](https://blog.logrocket.com/good-dx-not-enough/)
- MUI fixes arrive with a package update, while shadcn fixes have to be merged into your own copies by hand ([Easton Dev](https://eastondev.com/blog/en/posts/dev/20260326-shadcn-ui-vs-component-libraries/)).

**AI-assisted migration**
- Ambrook: about 2 weeks with planner and worker agents, humans reviewing every PR, and test and Storybook baselines written first ([Ambrook](https://ambrook.com/engineering/ai/migrating-fast-with-agent-graphs-design-system-material-ui-base-ui)).
- Swizec: 5 days, with human taste set first ([Swizec](https://swizec.com/blog/agents-change-the-math-on-big-bang-migrations)).
  - A missed deploy step broke half the Tailwind styles in production.
  - A 22,000-line PR was impossible to review, so he relied on manual acceptance testing.
- MetaDesign: without a `rules.md`, AI tools kept generating MUI-style code ([MetaDesign](https://metadesignsolutions.com/blog/migrating-react-app-from-mui-to-shadcn-ui-design-system-case-study)).
- An open-source codemod, `mui-to-shadcn`, converts MUI components and icons, with a report mode and a setup step for projects without Tailwind ([GitHub](https://github.com/marcelbaklouti/mui-to-shadcn)). I found no reports on how well it works.
- One tracker found Claude Code recommends shadcn/ui by default in 90% of UI-component answers and MUI in 0%. This is a single tracker's measurement. [amplifying.ai](https://amplifying.ai/tech/mui)

### Inferences
- For this app, the riskiest areas are portaled overlays in RTL and the softphone dock (which uses a `persistent` Drawer):
  - MUI currently flips Drawer anchors under RTL. CLAUDE.md notes the code picks anchors from `isRTL` to keep the phone on the right and the menu on the left.
  - With shadcn's Sheet plus Radix, that logic has to be redone, with `DirectionProvider` and explicit `dir` on portals.
  - The header is forced to `dir="ltr"` and the phone panel to `dir="ltr"`. Radix components inside those subtrees need their own `DirectionProvider`, or `dir`, set to `ltr`, because Radix does not read DOM ancestors.
- The inbox has no DataGrid or date-picker dependency (calls and reports tables may), so the hardest-component risk is lower than in the case studies. Any MUI `Autocomplete` or `DatePicker` uses would be the long pole.

### Gaps
- I found no first-hand report on a Hebrew-specific MUI → shadcn migration.
- I found no measured accessibility comparison (axe scores before and after) from any migration.

## 4. Reports of moving back, or staying on MUI and restyling

### Takeaway
I found **no first-hand report of a team reverting from shadcn back to MUI**. Regret stories that exist are about governance and drift (LogRocket, coming from Mantine), not about wanting MUI back. Advice to stay on MUI is common but mostly opinion: don't migrate for its own sake, MUI X is still the better choice for data-heavy apps, and building new surfaces in shadcn while leaving old ones alone is the lower-risk path.

### Cited Findings
- "An existing MUI application should not migrate for its own sake." A theme object, wrappers and team habits are real assets. The lower-risk option is to build new surfaces in the new model. [21st.dev, Aug 2026, opinion with a commercial interest](https://21st.dev/blog/mui-vs-shadcn)
- MUI remains the better pick for data-heavy apps because of the MUI X data grid, pickers and charts ([alekseialeinikov.com](https://www.alekseialeinikov.com/en/blog/topics/programming/shadcn-ui-vs-mui-vs-mantine); [CodeFalconX](https://dev.to/codefalconx/design-system-comparison-matrix-562e)).
- On Reddit (r/react), one commenter said that if you want rapid development and aren't forced into a specific design, go with MUI ([r/react thread via redlib](https://redlib.hackliberty.org/r/react/comments/1klxv12/your_component_library_of_choice_and_why/msesglx/?context=3), 2025).
- In an r/reactjs thread (2025), the poster assumed shadcn was the default but saw negative comments about it and asked what people were happiest with ([redlib mirror](https://red.127.pp.ua/r/reactjs/comments/1k1gerj/in_2025_whats_the_goto_reactjs_ui_library)).
- Swizec abandoned an AI-driven JoyUI → MUI v7 rewrite because it was "not a meaningful improvement," then chose Tailwind plus a shadcn theme for his other codebase instead ([Swizec](https://swizec.com/blog/agents-change-the-math-on-big-bang-migrations)).
- Two of Thrive's earlier consolidation attempts stalled before the rule-enforced attempt succeeded ([Thrive](https://www.thrivelearning.com/blog-news/from-three-design-systems-to-one-our-migration-to-shadcn-ui)).
- coder/coder closed its big MUI → shadcn epic after 3 months, without visible completion, in favor of "more granular handling" ([coder #18993](https://github.com/coder/coder/issues/18993)).

### Inferences
- The realistic failure mode is not reverting but stalling halfway, ending up with two systems ("one more design system than you started with").
- For a small team, the risk depends on finishing, not on the choice of library.

### Gaps
- No "why we went back to MUI" posts surfaced. Reddit and Hacker News first-hand threads were hard to reach through search (mostly mirrors). This should be read as "not found," not as evidence that reverts never happen.

## 5. Rough effort heuristics

### Takeaway
Reported heuristics are coarse:
- **Size bands (opinion blogs):** about 1–2 weeks for a small project, 2–4 weeks for medium, 4–8 weeks for large, or 3–8 weeks depending on component count.
- **coder's per-task estimate:** 5.5–8 weeks for about 220 MUI files.
- **Approach heuristics:** go leaf-first, do complex components last, work in batches of 5–10 components, and expect theming to be most of the effort.
- **AI agents:** compress the mechanical part to days, but only with test and visual baselines.

### Cited Findings
- 1–2 weeks for a small project, 2–4 for medium, 4–8 for large ([Easton Dev, Mar 2026](https://eastondev.com/blog/en/posts/dev/20260326-shadcn-ui-vs-component-libraries/)).
- "Budget three to eight weeks depending on the number of components"; start with buttons and inputs ([MG Software](https://www.mgsoftware.nl/en/vergelijking/shadcn-ui-vs-material-ui)).
- coder: 28–41 days for 220 MUI files, 61 component types and 1,275 Emotion usages, which is about 0.13–0.19 days per MUI-using file ([coder #18993](https://github.com/coder/coder/issues/18993)).
- MetaDesign: about 7 weeks for 120+ screens and 38 MUI components, plus a 2-week audit. A spreadsheet mapping every MUI prop to its shadcn equivalent "saved significant time." ([MetaDesign](https://metadesignsolutions.com/blog/migrating-react-app-from-mui-to-shadcn-ui-design-system-case-study))
- Ambrook: 794 files in about 2 weeks with agents; Swizec: hundreds of pages in 5 days with agents ([Ambrook](https://ambrook.com/engineering/ai/migrating-fast-with-agent-graphs-design-system-material-ui-base-ui); [Swizec](https://swizec.com/blog/agents-change-the-math-on-big-bang-migrations)).
- A community migration skill suggests batches of 5–10 components, grouped by type (layout, forms, data display, navigation) and ordered simple to complex, converting dependencies first ([skills.sh migration skill](https://skills.sh/alan-ws/migent/migration)).
- "Behaviour maps almost one to one … theming is most of the effort and is design work" ([21st.dev](https://21st.dev/blog/mui-vs-shadcn)).

### Inferences
- Scaling coder's per-file estimate to about 36 files gives roughly 5–7 developer-days of mechanical migration.
- On top of that, budget for:
  - a design and theming pass: turning 5 themes into CSS variables plus a dark variant;
  - RTL QA for every overlay;
  - softphone-dock and drawer behaviour (pin/persistent, physical anchoring);
  - visual-regression baselines (Playwright screenshots).
- A plausible total for a small team is about 1.5–3 weeks. With AI agents, it could be under a week of wall-clock time if Playwright screenshot baselines exist first. This is an inference, not a reported figure.

### Gaps
- No per-component or per-screen hour figures were published by any first-hand source.
- No effort data specific to RTL apps.
