# MUI (Material UI v7/v9) vs shadcn/ui + Tailwind: size, ecosystem, maintenance (as of Nov 2026)

Project context (from this repo's `package.json`, checked 2026-11-12): `@mui/material ^7.1.1`, `@emotion/react ^11.14`, `stylis-plugin-rtl ^2.1.1`, `recharts ^3.8.1`, `tailwindcss ^3.4.18`, `tailwindcss-animate ^1.0.7`. No `@mui/x-*` packages are installed. The app already mixes MUI with Tailwind/shadcn pieces.

**Version note:** Material UI went from v7 straight to **v9** (there is no v8). v9 is the current major in late 2026, not v7.

## Bundle size and runtime performance

### Takeaway
MUI still runs on Emotion, a CSS-in-JS runtime. Its zero-runtime replacement, Pigment CSS, is **on hold in alpha** as of 2026, and v9 only names "independence from Emotion" as a goal for a future major. shadcn + Tailwind produces static CSS with no runtime styling cost. I found no rigorous, independent, head-to-head benchmark. The figures below are MUI's own estimates or come from unverified blogs.

### Cited Findings
- Pigment CSS is "not being developed at the moment." It is listed as alpha and on hold, and MUI says the underlying problems weren't fully solved and progress would need a different approach (Jan 1, 2026). — [MUI blog: 2026 and beyond](https://mui.com/blog/2026-and-beyond/)
- The v9 announcement (Apr 8, 2026) mentions "Target independence from Emotion" only as a direction for a future major. v9 itself keeps Emotion. — [Introducing Material UI and MUI X v9](https://mui.com/blog/introducing-mui-v9/)
- In v6 (2024), Pigment CSS was opt-in, and MUI said future majors would "likely" make it the default. That plan has since stalled (see above). — [Upgrade to v6](https://mui.com/material-ui/migration/upgrade-to-v6/)
- The v6 upgrade guide says v6 cut about 2.5 MB (25%) from the `@mui/material` npm package. That is install size, not the gzipped bundle. — [Upgrade to v6](https://v7.mui.com/material-ui/migration/upgrade-to-v6.md)
- MUI estimates about **20 kB gzipped** of core overhead (styling and theming) when importing even one component. A mirror of MUI's guide also gives about 90 kB gzipped for a button-only app including React and Emotion, and about 140 kB for a 50+ component app, of which about 75 kB is MUI. The build setup behind these numbers is unclear. — [MUI minimizing-bundle-size guide (Mintlify mirror)](https://www.mintlify.com/mui/material-ui/guides/minimizing-bundle-size)
- The official guide gives no size figures. It says tree-shaking removes unused code in production, and that barrel imports mainly slow down dev startup and rebuilds. Named imports from `@mui/icons-material` can be "up to six times slower" in dev than path imports. — [mui.com minimizing bundle size](https://mui.com/material-ui/guides/minimizing-bundle-size/)
- `@emotion/react` alone is about 7.9 kB min+gz (third-party comparison site). — [devcompare: emotion vs goober](https://devcompare.5-101-118-104.sslip.io/compare/emotion-react-vs-goober)
- A blog claims rendering 1,000 elements with `sx` adds about 200 ms versus static styles. It is **unverified** and I found no MUI primary source. — [pagespeedfix blog](https://pagespeedfix.pages.dev/blog/mui-material-ui-performance)
- v9 release focus, per release-tracker summaries: accessibility, **`sx` prop performance**, and removing deprecated APIs. I found no published numbers. — [newreleases.io v9.0.0](https://newreleases.io/project/github/mui/material-ui/release/v9.0.0); [Upgrade to v9](https://mui.com/material-ui/migration/upgrade-to-v9/)
- v7 requires `react-is@19` because React 19 changed how elements are identified. v7 also moved to a package `exports` field with an ESM fallback, so Vite aliases that forced ESM for icons can be removed. — [Upgrade to v7](https://v7.mui.com/material-ui/migration/upgrade-to-v7.md)
- shadcn components are thin wrappers over Base UI or Radix primitives, styled with Tailwind utilities and CSS variables. The styling is static CSS, and each component's code lives in the app. — [shadcn theming docs](https://ui.shadcn.com/docs/theming)
- A third-party case study of migrating an app from MUI to shadcn exists, but I did not verify its numbers. — [MetaDesign Solutions case study](https://metadesignsolutions.com/blog/migrating-react-app-from-mui-to-shadcn-ui-design-system-case-study)

### Inferences
- In a Vite SPA (no Server Components), Emotion's cost is mainly 1) about 8 to 20 kB gz of baseline JS and 2) style serialization and injection at render time, which grows with `sx`/`styled` use and re-renders. In a list-heavy live inbox, frequent re-renders of rows using `sx` are the likely hotspot. Static Tailwind classes avoid that cost.
- RSC compatibility mostly matters for Next.js. For a React 19 + Vite SPA it is a minor factor.
- Because Pigment is stalled, don't plan on MUI becoming zero-runtime within the next 1 to 2 years.

### Gaps
- No independent, reproducible gzipped benchmark comparing equivalent screens built in MUI and in shadcn. Measuring this repo's own build (for example with `vite-bundle-visualizer`) would be authoritative.
- I could not get bundlephobia numbers for `@mui/material@9` (not fetched).
- I found no source quantifying the v9 `sx` performance improvements.

## Ecosystem for complex parts (grids, pickers, combobox, charts) and licensing

### Takeaway
MUI X is the most complete off-the-shelf option. The MIT Data Grid, Date Pickers and Charts are capable, but the advanced features cost money: Pro is **$299/dev/year** and Premium **$599/dev/year** under the April 2026 application-based licensing. shadcn's equivalents are free recipes over headless libraries (TanStack Table, react-day-picker, Recharts v3, a Combobox), plus community registries. You get more control and pay nothing, but you build features like virtualization, grouping and pivoting yourself.

### Cited Findings
- **MUI X list prices (late 2026):** Community free (MIT). **Pro $299/dev/yr**, **Premium $599/dev/yr**, **Enterprise $1,399/dev/yr** (15-seat minimum). The page also shows a perpetual/annual toggle. — [mui.com/pricing](https://mui.com/pricing/)
  - Older or third-party figures: Pro $180/dev/yr, Premium $588/dev/yr before April 2026. — [Vendr](https://www.vendr.com/marketplace/material-ui); [ToolRadar](https://toolradar.com/tools/material-ui/pricing)
- **The 2026 licensing change took effect Apr 8, 2026:** Pro and Premium are now application-based (single- or multi-application licenses), and "each developer must still be licensed." Enterprise is always multi-app with at least 15 seats. Priority support is Enterprise-only. Existing v8 licenses keep renewing at the old pricing, but upgrading to v9 triggers the new pricing. — [2026 MUI X price changes](https://mui.com/blog/2026-MUI-X-price-changes/); [v9 announcement](https://mui.com/blog/introducing-mui-v9/)
- The license shows in the package name: `@mui/x-data-grid` is MIT, `@mui/x-data-grid-pro` is commercial. Pro adds "10+" Data Grid features and Premium "5+" more (the exact matrix didn't come through in the fetch). From prior knowledge, not re-verified: column pinning, tree data, row reorder and lazy loading are Pro; row grouping, aggregation, pivoting and Excel export are Premium; the date *range* pickers are Pro. — [mui.com/pricing](https://mui.com/pricing/)
- **MUI X v9 (Apr 8, 2026):**
  - Data Grid: dynamic data and lazy loading hardened, stable in-grid Charts integration, AI Assistant.
  - Charts: keyboard navigation on by default, Candlestick added in Premium, tooltips portaled so `overflow` doesn't clip them.
  - Pickers: keyboard calendar navigation, `fieldRef.clearValue`.
  - New **alpha** components: Scheduler and **Chat** (conversational UI with adapters), which is relevant to an inbox.
  - Telemetry for commercial components is on by default in dev and off in production.
  - — [Introducing MUI v9](https://mui.com/blog/introducing-mui-v9/)
- The MUI X Charts catalog includes Line, Bar, Scatter, Pie, Sparkline, Gauge, Radar, Heatmap, Funnel, Sankey, Treemap and Gantt. The pricing page marks some tiers as TBD. — [mui.com/pricing](https://mui.com/pricing/)
- **shadcn charts now use Recharts v3:** "The `chart` component now uses Recharts v3." Colors are CSS variables (`--chart-1…`) with separate `:root` and `.dark` values, referenced as `var(--color-KEY)`. — [shadcn chart docs](https://ui.shadcn.com/docs/components/chart)
- The shadcn data-table guide is built on TanStack Table. Community registries extend it (tablecn, bazza data-table-filter, shadcntable), with filter variants such as select, multi-select and date range. The CLI pulls in `@tanstack/react-table` and `react-day-picker` as dependencies. — [shadcn data-table](https://ui-v4.shadcn.com/docs/components/data-table); [tablecn](https://cdn.jsdelivr.net/gh/sadmann7/tablecn@main/README.md); [bazza data-table-filter](https://ui.bazza.dev/docs/data-table-filter); [Refine shadcn DataTable](https://refine.dev/docs/ui-integrations/shadcn/components/data-table)
- shadcn added a Calendar component (react-day-picker based) in June 2025. Other changelog entries: Toast for Base UI (Jul 2026); chat-interface components (Jun 2026); Questionnaire (Aug 2026); Trace, Code Block and 21 "AI Elements" patterns (Oct 2026). — [shadcn changelog](https://ui.shadcn.com/docs/changelog)
- Radix has been slow to ship complex components such as Combobox and multi-select. This is a third-party, opinionated source. — [PkgPulse](https://www.pkgpulse.com/guides/shadcn-ui-vs-base-ui-vs-radix-components-2026)

### Inferences
- For an RTL conversation inbox, the heavy parts are a virtualized thread list, a message composer, comboboxes or tag pickers, date-range filters, and a few KPI charts. All of these work in both stacks with no licensing cost, as long as you avoid MUI X Pro/Premium-only features (for example date range pickers or advanced grid features).
- The repo already depends on Recharts v3, which is what shadcn charts now use. Adopting shadcn charts adds no new charting dependency.
- If the app ever needs Excel-like grids (grouping, pivoting, aggregation), MUI X Premium at $599/dev/yr is the turnkey route. Doing it in shadcn means TanStack Table plus custom work or AG Grid, which is not researched here.

### Gaps
- I could not extract the exact per-feature tier matrix from mui.com/pricing (the checkmarks were lost in the fetch). Verify which picker and grid features are free.
- The single-application vs multi-application price difference wasn't visible on the pricing page.
- Maturity of the MUI X Chat alpha for production inbox use is unknown.

## Maintenance and upgrade burden

### Takeaway
MUI ships one major roughly every 1 to 2 years:
- v5 in 2021, which changed the styling engine from JSS to Emotion
- v6 in Aug 2024, Pigment opt-in
- v7 on Mar 26, 2025
- v9 on Apr 8, 2026, skipping v8

Each major comes with codemods and a deprecate-then-remove policy. The upgrades are usually mechanical but touch many files, and MUI X majors bring licensing changes. shadcn has no "upgrade" in the usual sense because the component code is copied into the app. Instead, you watch the base library (Radix or Base UI), Tailwind majors (v3 to v4), and the CLI's migrate commands, and you carry the drift.

### Cited Findings
- **v7 (stable Mar 26, 2025):**
  - Deprecated APIs still work and can be removed later; they are deleted in the next major.
  - Requires `react-is@19`.
  - Deep imports more than one level down no longer work because of the `exports` field.
  - Grid codemod: `npx @mui/codemod@^7.0.0 v7.0.0/grid-props`.
  - The theme no longer changes between modes when CSS variables and color schemes are used.
  - — [Upgrade to v7](https://v7.mui.com/material-ui/migration/upgrade-to-v7.md); [System upgrade to v7](https://mui.com/system/migration/upgrade-to-v7/)
- **MUI X v7:** the `preset-safe` codemod (`npx @mui/x-codemod@latest v7.0.0/preset-safe`) does most of the work; props deprecated in v6 were removed in favor of `slots`/`slotProps`. — [MUI X Data Grid v6→v7 migration](https://v7.mui.com/x/migration/migration-data-grid-v6/)
- **v9 (Apr 8, 2026):** jumps from v7 to v9 to align with MUI X; removes deprecated APIs; makes slot and slotProps APIs more consistent; adds NumberField and Menubar; uses `color-mix()` for derived theme colors. The upgrade guide covers v7 to v9 directly. — [Introducing MUI v9](https://mui.com/blog/introducing-mui-v9/); [Upgrade to v9](https://mui.com/material-ui/migration/upgrade-to-v9/)
- **v9 patch cadence:** v9.0.1 on May 6, 2026; v9.1.0 around Jun 8, 2026; v9.1.1 and v9.1.2 around Jun 23, 2026 (autocomplete, focus and form fixes). — [Releasebot MUI](https://releasebot.io/updates/mui/material-ui); [newreleases v9.1.2](https://newreleases.io/project/github/mui/material-ui/release/v9.1.2)
- **MUI portfolio contraction (Jan 2026):** Joy UI is on hold, Toolpad is not maintained, Pigment CSS is on hold, and MUI Base is deprecated in favor of **Base UI**, which MUI calls "where we are concentrating our foundational work." — [2026 and beyond](https://mui.com/blog/2026-and-beyond/)
- **v4→v5 (2021):** moved styling from JSS to Emotion and deprecated `makeStyles`/`withStyles`. This was the most painful MUI migration. Prior knowledge, not re-fetched. — [MUI v4→v5 migration](https://mui.com/material-ui/migration/migration-v4/)
- **shadcn update model:**
  - The CLI overwrites components when re-added, so commit first.
  - CLI milestones: v3 plus MCP server (Aug 2025); v4 (Mar 2026); `shadcn apply` and `preset` (Apr 2026); `shadcn eject` (May 2026); `shadcn migrate cn` (Sep 2026); `migrate rtl` (Jan 2026).
  - I found no changelog entry for a dedicated "diff" command.
  - — [shadcn Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4); [shadcn changelog](https://ui.shadcn.com/docs/changelog)
- **Base UI is now the shadcn default (Jul 2026):** `npx shadcn init` picks Base UI; Radix "remains fully supported" and existing projects stay on their current base (`-b radix` keeps Radix). React Aria was also added as a base in Jul 2026. Base UI 1.0 shipped in Dec 2025 (`@base-ui/react`), 1.1 in Jan 2026, and reached about 1.8 by Sep 2026. The exact 1.8 date comes from a third party. — [shadcn changelog: Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default); [shadcn changelog: React Aria](https://ui.shadcn.com/docs/changelog/2026-07-react-aria); [OpenReplay](https://blog.openreplay.com/shadcn-ui-radix-base-ui-switch/); [MUI 2026 blog](https://mui.com/blog/2026-and-beyond/)
- **Radix status:** owned by WorkOS. Commentators describe it as slower-moving, but WorkOS has reassigned developers to fix issues, so "abandoned" is not supported. These are blog and opinion sources, and the claims are contested. Radix packages were consolidated into one `radix-ui` package (shadcn migration Jun 2025; unified package Feb 2026). — [DEV Community](https://dev.to/mashuktamim/is-your-shadcn-ui-project-at-risk-a-deep-dive-into-radixs-future-45ei); [designrevision](https://designrevision.com/alternatives/radix-ui); [shadcn changelog](https://ui.shadcn.com/docs/changelog)
- **Tailwind v3→v4 impact on shadcn (Feb 2025):**
  - Config moves to CSS (`@theme`, `@theme inline`), colors change from HSL to **OKLCH**, and `tailwindcss-animate` is replaced by **`tw-animate-css`**.
  - Components drop `forwardRef` (React 19, with the `remove-forward-ref` codemod) and add `data-slot` attributes. `toast` is deprecated in favor of `sonner`, and the `default` style in favor of `new-york`.
  - The upgrade is run with `@tailwindcss/upgrade`. Tailwind v4 targets modern browsers only.
  - The change is non-breaking: v3 + React 18 apps keep working, and newly added components stay on v3 until the project upgrades.
  - — [shadcn Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4)

### Inferences
- MUI burden: expect one codemod-driven major about every 12 to 18 months, plus possible re-licensing if MUI X Pro is adopted. The 2025 to 2026 pattern (v7 to v9 in about 12 months, v9 removing v7's deprecations) suggests deprecation warnings should be cleared continuously. Pigment and Joy show that MUI's announced directions can stall.
- shadcn burden: low churn per component, but the work lands on you. Because code is copied in, upstream fixes (accessibility, Base UI changes) only arrive if you re-add or merge by hand. Drift grows with local edits. The base-library switch (Radix to Base UI) is opt-in, not forced.
- This repo is on Tailwind 3.4 with `tailwindcss-animate`. Going further into shadcn means planning a Tailwind v4 migration: CSS-first config, OKLCH tokens, swapping in `tw-animate-css`. That is a one-time cost and a prerequisite for current shadcn components and the RTL CLI.

### Gaps
- I found no official MUI release-cadence policy (for example "annual majors").
- I found no hard data on Radix commit or release frequency in 2026 (e.g. GitHub activity stats).
- The v4→v5 details are from prior knowledge and were not re-verified this session.

## Theming several themes (light plus multiple dark levels) and RTL

### Takeaway
Both can do it. shadcn/Tailwind is the more direct route: a theme is just another class or data attribute that overrides the same CSS variables, so "dim / dark / darker" is three more selector blocks. MUI v6+ CSS theme variables have built-in `light`/`dark` schemes and `useColorScheme`. The configuration docs I fetched only document those two. Extra named schemes need verification, or a custom-selector or CSS-variable override workaround. For RTL, shadcn shipped first-class RTL in Jan 2026. MUI's RTL needs an Emotion cache with `@mui/stylis-plugin-rtl` and `dir` set on portals.

### Cited Findings
- **MUI color schemes:**
  - Configured as `colorSchemes: { light: true, dark: true }`.
  - `colorSchemeSelector` can be `class`, `data`, or a custom pattern such as `'.theme-%s'`.
  - `InitColorSchemeScript` prevents flicker.
  - `useColorScheme()` returns `mode`/`setMode`, which accepts `'light' | 'dark' | 'system'`.
  - Use `theme.applyStyles()` instead of `palette.mode` checks.
  - The page does not document schemes beyond light and dark.
  - — [MUI CSS theme variables configuration](https://mui.com/material-ui/customization/css-theme-variables/configuration/)
- **shadcn theming:**
  - Semantic tokens (`background`, `primary`, …) are defined in `:root`, and dark mode "works by overriding the same tokens inside a `.dark` selector."
  - Tokens are mapped to Tailwind with `@theme inline`; all defaults are OKLCH.
  - Adding a token means defining it in `:root` and `.dark`, then exposing it in `@theme inline`.
  - The docs describe no built-in multi-theme system, only seven base colors and presets.
  - — [shadcn theming](https://ui.shadcn.com/docs/theming)
- **shadcn RTL (Jan 2026):**
  - Enabled with `rtl: true` in `components.json` (or `init --rtl`, or `migrate rtl` for existing code).
  - The CLI rewrites physical classes to logical ones (`ml-*`→`ms-*`, `left-*`→`start-*`, `text-left`→`text-start`), flips icons with `rtl:rotate-180`, and changes slide animations to start/end.
  - Every component has an RTL example, and there is a `Direction` component.
  - — [shadcn RTL changelog](https://ui.shadcn.com/docs/changelog/2026-01-rtl)
- **MUI RTL:** set `dir="rtl"` on the root, and directly on portal components (Dialog etc.) because they don't inherit it. Use `createTheme({ direction: 'rtl' })`. Install `stylis` and `@mui/stylis-plugin-rtl` and create an Emotion `createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] })` in a `CacheProvider`. Switching direction at runtime means swapping caches. — [MUI RTL guide](https://mui.com/material-ui/customization/right-to-left/)

### Inferences
- Several dark levels in shadcn come down to a few CSS blocks, such as `[data-theme="dim"]` and `[data-theme="darker"]`, that override the token set. Switching themes changes no JS and causes no re-render of styled components.
- In MUI, switching between schemes defined as CSS variables also avoids re-creating the theme in v7+. But more than two levels may mean pairing extra palettes with a custom selector, or overriding `--mui-palette-*` variables in CSS by hand.
- This repo uses `stylis-plugin-rtl` (the older generic package), not `@mui/stylis-plugin-rtl`. That is worth checking if MUI stays.
- The CLAUDE.md note that MUI flips `Drawer` anchors under RTL is a typical source of MUI RTL friction. shadcn's logical-class approach avoids the dual-cache setup.

### Gaps
- I did not confirm whether MUI v9 officially supports more than two named color schemes (e.g. a `colorSchemes.dim` key). Check the MUI "dark mode"/"color schemes" docs.
- I found no benchmark of theme-switch cost in either approach.
