# MUI vs shadcn/ui: RTL/Hebrew, UX, accessibility and mobile/touch for a Hebrew-first inbox

Research date: 2026-11-12. **Version note:** MUI is no longer on v7. Material UI v9.0 shipped on April 8, 2026, and the live docs show **v9.5.0** ([MUI v9 blog](https://mui.com/blog/introducing-material-ui-v9/), [MUI RTL docs](https://mui.com/material-ui/customization/right-to-left/)). The project currently uses MUI 7.1+ (CLAUDE.md). The RTL model is the same in v7 and v9 (Emotion plus stylis RTL plugin), so the v7 caveats below still apply. On shadcn: since July 2026 **Base UI is the default primitive layer**, Radix is still supported, and **React Aria** was added as a third base.

## How does MUI handle RTL (theme direction, stylis-plugin-rtl, Drawer/Popover/Tooltip placement, icon flipping)? Known caveats 2025–2026?

### Takeaway
MUI's RTL support is mature and runs at build time through CSS transforms: theme `direction: 'rtl'`, `dir="rtl"` on the `<html>` element, and an Emotion cache with `@mui/stylis-plugin-rtl` that flips physical CSS. The plugin's left/right flipping also mirrors any `sx` or `styled` styles you write, so you usually keep writing `left`/`marginLeft`. Known weak spots: portals need `dir`, icons are not auto-mirrored, `@noflip` misbehaves with `sx`, and as of November 2026 the plugin does not flip declarations inside `@container` queries.

### Cited Findings
- Setup is three parts: `createTheme({ direction: 'rtl' })`, `dir="rtl"` on `<html>` (or `document.documentElement.setAttribute('dir','rtl')`), and an Emotion cache (`key: 'muirtl'`, `stylisPlugins: [prefixer, rtlPlugin]`) passed to `CacheProvider`. styled-components uses `StyleSheetManager stylisPlugins` instead. — [MUI RTL docs (v9.5.0)](https://mui.com/material-ui/customization/right-to-left/)
- Opt-out uses the `/* @noflip */` comment directive. Portal components such as Dialog "don't inherit `dir` from their parents", so set `dir` on them directly unless RTL is set globally. — [MUI RTL docs](https://mui.com/material-ui/customization/right-to-left/)
- `/* @noflip */` reportedly does not work inside the `sx` prop (MUI v5-era issue, about 4 years old, so it may or may not be fixed). — [mui/material-ui #33563](https://github.com/mui/material-ui/issues/33563)
- The Drawer swaps horizontal anchors under RTL. MUI v9.5.0 source: `getAnchor` returns `direction === 'rtl' && isHorizontal(anchor) ? oppositeDirection[anchor] : anchor`. So `anchor="left"` opens on the right in RTL. This matches the project's own CLAUDE.md note that the shell picks the anchor from `isRTL` to stay physical. — [@mui/material@9.5.0 Drawer.js](https://cdn.jsdelivr.net/npm/@mui/material@9/Drawer/Drawer.js)
- Slider reads direction via `useRtl()` from `@mui/system/RtlProvider` (v9.5.0 source). — [@mui/material@9 Slider.js](https://cdn.jsdelivr.net/npm/@mui/material@9/Slider/Slider.js)
- Historical RTL bugs, all closed and old: Drawer slid across the whole screen during its animation in RTL ([#33981](https://github.com/mui/material-ui/issues/33981)); Slider keyboard handling in RTL differed from native (v4.9, [#20785](https://github.com/mui/material-ui/issues/20785)); Slider/LinearProgress could not opt out of RTL (2020, [#23782](https://github.com/mui/material-ui/issues/23782)). I found no open 2025–2026 Drawer, Popover or Slider RTL bug in a quick search. — sources inline
- v9.0.1 reworked the Tooltip's RTL styles to use CSS logical properties (#48351). So MUI is starting to move from plugin flipping toward logical properties, component by component. — [MUI 9.0.1 changelog via newreleases.io](https://newreleases.io/project/github/mui/material-ui/release/v9.0.0); [CHANGELOG](https://cdn.jsdelivr.net/npm/@mui/material@9.0.1/CHANGELOG.md). (A v9.1.2 entry "Fix RTG import" refers to react-transition-group, not RTL.)
- An open PR from November 2026 says `@mui/stylis-plugin-rtl` 9.5.0 does not flip declarations inside `@container` queries, so layouts mirror everywhere except at container breakpoints. — [PR #49739](https://github.com/mui/material-ui/pull/49739)
- MUI icons are not auto-mirrored in RTL. Developers swap icons by direction. MUI X's own scheduler uses `useRtl()` to swap prev/next arrows and `scaleX(-1)` for icons with no mirrored counterpart. In the same PR, a hardcoded `left: 0` was flipped by the plugin to `right: 0` and stretched a toolbar. — [mui-x PR #23955](https://github.com/mui/mui-x/pull/23955); [Q&A on icons not flipping](https://www.bytearray.pub/archives/2680005.html)
- The v9 release notes do not mention RTL. The roadmap lists "Remove dependency on Emotion", which would change the RTL mechanism (the stylis plugin is Emotion-based). — [MUI v9 blog](https://mui.com/blog/introducing-material-ui-v9/)

### Inferences
- In a Hebrew-default app with a runtime he⇄en switch, MUI needs two Emotion caches (rtl and ltr) or a cache swap, plus `theme.direction` and `dir` kept in sync. Any portal content (Menu, Popover, Dialog, Snackbar) only flips correctly if `dir` is global on `<html>`.
- Because the plugin rewrites physical CSS, writing logical CSS (`marginInlineStart`) together with the plugin can double-flip or confuse code. Pick one convention.
- If MUI drops Emotion (roadmap), the RTL story may move to logical properties. That is good long term, but it means migration churn.

### Gaps
- I did not confirm whether `@noflip` in `sx` works today.
- I found no 2025–2026 list of MUI X Date Picker RTL issues with Hebrew calendars or locales.

## How does shadcn/ui handle RTL (logical classes, Tailwind rtl:/ltr:, DirectionProvider, official support)? Component-level problems?

### Takeaway
shadcn added **official RTL support in January 2026**. A CLI transform (`"rtl": true` in `components.json`, `init/create --rtl`, `shadcn migrate rtl`) rewrites physical Tailwind classes to logical ones, makes slide animations logical, and adds `rtl:rotate-180` to supported icons. A `direction` component (DirectionProvider) and per-component RTL examples ship with it. Known gaps: tw-animate-css logical slides need `dir` passed to portalled content; Calendar, Pagination and Sidebar must be migrated by hand; the transform is only automatic for the newer `shadcn create` styles; and the migration is reportedly not idempotent.

### Cited Findings
- January 2026 changelog: the CLI converts physical to logical classes (`ml-4` to `ms-4`, `left-*`/`right-*` to `start-*`/`end-*`, `pr-*` to `pe-*`, `text-left` to `text-start`). It also updates directional props to logical values, flips supported icons with `rtl:rotate-180`, and converts `slide-in-from-left` to `slide-in-from-start`. New projects use `init --rtl` / `create --rtl`; existing ones run `migrate rtl [path|glob]`. Every component page has RTL examples. — [shadcn changelog 2026-01 RTL](https://ui.shadcn.com/docs/changelog/2026-01-rtl)
- The automatic transform is "only available for projects created using `shadcn create`" with the newer styles (`base-nova`, `radix-nova`, etc.). Other styles need the manual migration guide. Add the provider with `shadcn add direction`. — [shadcn RTL docs](https://ui.shadcn.com/docs/rtl)
- Known issue: tw-animate-css logical slide utilities "don't work as expected". The workaround is to pass `dir` to portal content, e.g. `<PopoverContent dir="rtl">`, `<TooltipContent dir="rtl">`. The CLI does **not** migrate Calendar, Pagination or Sidebar; each has its own manual RTL section. Icons outside the supported set need `rtl:rotate-180` added by hand. — [shadcn RTL docs](https://ui.shadcn.com/docs/rtl)
- Vite setup: `<html lang=".." dir="rtl">`, wrap the app in `<DirectionProvider direction="rtl">` from `@/components/ui/direction`, and use a Noto font (`@fontsource-variable/noto-sans-hebrew` for Hebrew) set via `@theme inline { --font-sans: ... }`. — [shadcn RTL Vite guide](https://ui.shadcn.com/docs/rtl/vite)
- January 2026: Base UI-based styles accept logical `side="inline-start" | "inline-end"` on Tooltip, Popover, Combobox, Context Menu, Dropdown Menu, Hover Card, Menubar and Select, with matching `data-[side=...]` animation classes. The post does not mention Radix. — [shadcn changelog 2026-01 inline side styles](https://ui.shadcn.com/docs/changelog/2026-01-inline-side-styles)
- May 2026: bugs found during the RTL work were one reason for centralising shared styles in a new `shadcn/tailwind.css`. — [shadcn changelog 2026-05 eject](https://ui.shadcn.com/docs/changelog/2026-05-shadcn-eject) (via search summary)
- A third-party guide warns that `migrate rtl` is not fully idempotent and repeat runs can duplicate classes. Run it once and commit the diff. — [shadcnstudio blog](https://shadcnstudio.com/blog/shadcn-rtl-support-nextjs/) (secondary)
- Tailwind v4.3 `rtl:`/`ltr:` variants compile to `&:where(:dir(rtl), [dir="rtl"], [dir="rtl"] *)`. The docs say they are only needed when you support both directions. — [Tailwind docs v4.3](https://tailwindcss.com/docs/hover-focus-and-other-states)
- Registry source detail: the newer style files still contain some physical classes before transformation (e.g. Nova's button uses `has-data-[icon=inline-end]:pr-2 ... pl-2`). RTL correctness therefore depends on the CLI transform running at add time, or on a manual migration. — [style-nova.css on GitHub](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/styles/style-nova.css)

### Inferences
- shadcn's RTL is now first-class, but it is **opt-in and code-generation based**. Components already copied into this repo (`src/components/ui/`, older new-york style) would need `shadcn migrate rtl` plus manual checks of Calendar and Sidebar.
- Logical CSS mirrors natively at runtime, so a he⇄en toggle only needs `dir` flipped on `<html>` and the DirectionProvider value changed. No cache swap is needed, which is simpler than MUI's plugin approach.
- Sheet: I found no explicit doc. Sheet's `side="left|right"` is physical, so check whether the RTL transform makes it logical or leaves it physical. For this app's physical layout (phone always on the right), physical may actually be wanted.

### Gaps
- I did not verify Slider (keyboard direction under RTL), Carousel (Embla `direction: 'rtl'` option), DropdownMenu sub-menu direction, or Sheet behaviour against current shadcn source.
- I did not confirm whether the Radix-based styles get the `inline-start`/`inline-end` side values.

## Accessibility: Radix / Base UI primitives vs MUI components

### Takeaway
All three (MUI, Radix, Base UI) target WAI-ARIA Authoring Practices, and none has a public independent head-to-head audit I could find. Radix has several open screen-reader issues tied to its `aria-hidden` "hide others" approach: live regions muted under dialogs, Select inside Dialog, and Toast inside a Dialog's hidden subtree. MUI v9 made concrete a11y changes (Backdrop no longer sets `aria-hidden`, better roving tabindex). Base UI, now shadcn's default and built by MUI engineers, is the actively developed primitive layer.

### Cited Findings
- MUI v9 a11y changes: Backdrop no longer sets `aria-hidden` by default; improved roving-tabindex keyboard navigation for Stepper, Tabs and MenuList; Autocomplete no longer opens on right-click; ButtonBase propagates `onClick` for non-native buttons. Tabs and Menu had breaking a11y changes. — [MUI v9 blog](https://mui.com/blog/introducing-material-ui-v9/)
- MUI v9 adds NumberField and Menubar built on Base UI and plans to adopt more Base UI internals, so MUI and shadcn-on-Base-UI increasingly share primitives. — [MUI v9 blog](https://mui.com/blog/introducing-material-ui-v9/)
- Radix: live regions and `role="alert"` outside an open Dialog or Dropdown go unannounced because the app root gets `aria-hidden` (old issue, Radix 1.0.1). — [radix-ui/primitives #1820](https://github.com/radix-ui/primitives/issues/1820)
- Radix open issues (per a search summary of the issue tracker): a Toast viewport enters a Dialog's aria-hidden subtree from react-toast 1.2.15 while staying clickable ([#4115](https://github.com/radix-ui/primitives/issues/4115)); Select inside Dialog causes an aria-hidden focus freeze (#3701, October 2025); wrong Select count in VoiceOver/Chrome (#3962); first option not announced when nothing is preselected (#4110). — [radix-ui/primitives issues](https://github.com/radix-ui/primitives/issues). I verified only #1820 and #4115 by title.
- A downstream axe report: with a Radix Select or DropdownMenu open, there is 1 serious `aria-hidden-focus` violation on `#root`. The author did not verify this against current Radix. — [beaket/ui #930](https://github.com/beaket/ui/issues/930)
- Explainer on why the "Blocked aria-hidden" warning is real and common fixes are wrong. — [CSS-Tricks](https://css-tricks.com/blocked-aria-hidden-fix/)
- Maintenance: secondary sources say Radix development slowed after the WorkOS acquisition (complex components like Combobox and multi-select lag). Others say WorkOS still invests. Treat both as commentary. — [dev.to on Radix's future](https://dev.to/mashuktamim/is-your-shadcn-ui-project-at-risk-a-deep-dive-into-radixs-future-45ei); [designrevision](https://designrevision.com/alternatives/radix-ui)
- shadcn made Base UI the default in July 2026. Stated reasons: Base UI "at 1.6.0 with 6M+ weekly downloads", ships new components regularly, all new shadcn-team projects use it, and shadcn/create users pick it 2:1 over Radix. Radix is not deprecated (`-b radix`). A migration skill converts components one at a time (e.g. `asChild` becomes `render`) and flags behaviour changes. — [shadcn changelog 2026-07 Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- July 2026: React Aria (Adobe) became a first-class shadcn base (`init --base aria`). The changelog makes no a11y, touch or RTL claims. — [shadcn changelog 2026-07 React Aria](https://ui.shadcn.com/docs/changelog/2026-07-react-aria)
- shadcn bases timeline: December 2025, `shadcn create` offered Radix or Base UI; January 2026, full Base UI docs. — [shadcn create changelog](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create); [2026-01 Base UI](https://ui.shadcn.com/docs/changelog/2026-01-base-ui)

### Inferences
- For an inbox (toasts for incoming messages and calls, live updates, dialogs), Radix's aria-hidden and live-region issues matter directly: new-message announcements could be muted while a dialog is open. Base UI or React Aria are the safer shadcn bases. MUI's v9 removal of Backdrop `aria-hidden` targets the same class of problem.
- React Aria is widely known for strong i18n, RTL and touch handling, but the shadcn changelog makes no such claim. Verify before relying on it.

### Gaps
- I found no independent WCAG audit (e.g. Deque or TPGi) comparing MUI v9, Radix and Base UI. Vendor-adjacent comparison blogs with pass-rate tables looked unreliable and were excluded.

## Mobile/touch: touch targets, drawers/sheets, pickers, default density

### Takeaway
shadcn's newer default styles are **compact**: Nova's default button is `h-8` (32px), Vega's and new-york-v4's are `h-9` (36px). Both are below the 44px touch guidance, though above WCAG 2.2 AA's 24px minimum. MUI ships a dedicated `SwipeableDrawer` with iOS-specific tuning. For non-technical users on phones, either library needs a "comfortable" size override; shadcn needs it more.

### Cited Findings
- shadcn new-york-v4 button sizes: default `h-9` (36px), sm `h-8`, lg `h-10`, icon `size-9`, icon-xs `size-6` (24px). — [new-york-v4 button.tsx](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx)
- shadcn 2026 styles: Nova default button `h-8` (32px), sm `h-7` (28px), icon `size-8`; Vega default `h-9`, sm `h-8`. Other styles exist: luma, lyra, maia, mira, rhea, sera. — [style-nova.css](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/styles/style-nova.css); [style-vega.css](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/styles/style-vega.css)
- WCAG 2.2 AA 2.5.8 requires 24×24 CSS px (or 24px spacing). The 44×44 figure is AAA 2.5.5. iOS and Android guidance is about 44pt/48dp. — [frontendchecklist](https://frontendchecklist.io/rules/accessibility/touch-targets); [Deque](https://docs.deque.com/issue-help/1.0.0/en/touch-size-small/)
- A third-party design system built on shadcn drops shadcn's 36px size and treats 44px as the hit-target floor on touch. — [sportingscouter design button](https://design.sportingscouter.com/button/)
- MUI SwipeableDrawer adds about 2 kB gzipped. Low-end phones may not track the finger at 60 FPS (suggested fix: `disableBackdropTransition`). The docs use `disableDiscovery={iOS}` because iOS swipe-back conflicts with edge discovery. Recommended pattern: `temporary` drawer on mobile, `permanent` on desktop. — [MUI Drawer docs v9.5.0](https://mui.com/material-ui/react-drawer/)
- iOS Safari: the on-screen keyboard's scroll-into-view can move content behind an open dialog and defeat the scroll lock (secondary blog, not an official Radix doc). — via [Radix search summary / fixdevs](https://fixdevs.com/blog/radix-ui-not-working/)

### Inferences
- MUI defaults (Material Design density, 48dp-oriented components) are likely friendlier out of the box for non-technical touch users. shadcn's 2026 "Nova" look is tuned for dense desktop SaaS and should get a size bump on touch (e.g. `pointer-coarse:` variants or a larger default size).
- shadcn's Sheet/Drawer (vaul-based Drawer for bottom sheets) suits mobile, but I did not verify its swipe behaviour in this research.

### Gaps
- I did not verify MUI's exact default button and IconButton pixel heights in v9.
- I found no source on mobile pickers (MUI X MobileDatePicker vs shadcn Calendar+Popover/Drawer) in 2026.

## Default visual UX: modernity, density, animation, theming effort

### Takeaway
I found no rigorous comparative source. Evidence is limited to what each project ships. shadcn's 2026 styles (Nova, Vega and others, with Base UI defaults and many presets) are the "modern SaaS" look, compact and neutral. MUI v9 keeps the Material look and invests in theme tooling (`color-mix()`-derived colors in CSS variables), but usually needs theming so it doesn't look "Google-ish".

### Cited Findings
- MUI v9: theme and CSS variables generate `color-mix()`-derived colors; up to 30% faster `sx`; about 3% smaller bundle than v7; Joy UI removed. — [MUI v9 blog](https://mui.com/blog/introducing-material-ui-v9/)
- shadcn ships multiple named visual styles and presets through `shadcn create` (style files: luma, lyra, maia, mira, nova, rhea, sera, vega). — [shadcn registry styles dir](https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/styles); [shadcn create changelog](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create)
- shadcn's RTL animations are logical (`slide-in-from-start`), apart from the tw-animate-css portal caveat. — [shadcn RTL docs](https://ui.shadcn.com/docs/rtl)

### Inferences
- For "looks good with little effort" in 2026, shadcn's presets give a modern look immediately but default to compact density. MUI gives larger, more forgiving controls but needs theme work for a modern feel.
- Mixing both in one app (the current repo has MUI plus Radix/shadcn) means two RTL mechanisms (stylis flipping vs logical classes) and two focus-trap/aria-hidden systems that can conflict, for example nested MUI Dialog and Radix Select portals.

### Gaps
- I found no user-testing data or credible survey on perceived modernity or usability of MUI vs shadcn for non-technical users. All such claims online were opinion pieces.
