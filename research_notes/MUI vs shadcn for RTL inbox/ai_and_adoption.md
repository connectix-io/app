# MUI (Material UI v7/v9) vs shadcn/ui — AI-tool friendliness and adoption trends (as of 2026-11-12)

Note on versions: Material UI went from v7 (2025-03-26) straight to **v9.0.0 (2026-04-07)**; there is no v8. The npm `latest` tag is now **9.5.0**, `latest-v7` is 7.3.11, and `next` is 10.0.0-alpha.0. This repo uses MUI 7.1+, so it is now one major behind. (Source: npm registry `https://registry.npmjs.org/@mui/material`, queried 2026-11-12; [MUI v9 blog](https://mui.com/blog/introducing-mui-v9/).) shadcn CLI: 3.0 came out 2025-08-27, 4.0 on 2026-03-06, and `latest` is 4.23.0 (npm registry `https://registry.npmjs.org/shadcn`, queried 2026-11-12).

## Q1. Which UI library do AI design and app-builder tools produce by default?

### Takeaway
Nearly every major AI app or design generator produces **React + Tailwind + shadcn/ui (Radix or Base UI primitives)** by default. None of the surveyed tools produces MUI by default. You only get MUI if you explicitly steer the tool, or from MUI's own "MUI Recipes" generator.

### Cited Findings
- **Lovable (official FAQ):** generated code is React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Radix UI. Next.js is not the default. — [Lovable FAQ: tech stack](https://lovable.dev/faq/capabilities/tech-stack/lovable-tech-stack); [Lovable FAQ](https://lovable.dev/faq/capabilities/tech-stack)
- **Vercel v0:** comparison sites consistently describe its output as Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui. shadcn's docs have an "Open in v0" registry integration (it appears in the docs nav). — [rework.com comparison 2026](https://resources.rework.com/tools/ai-coding/lovable-vs-bolt-new-vs-v0); [ui.shadcn.com/docs/mcp nav](https://ui.shadcn.com/docs/mcp)
- **Bolt.new:** sources disagree. It is framework-agnostic and runs any JS stack in the browser, but several reviews say its typical React output is React + Tailwind + shadcn + Vite. — [rework.com](https://resources.rework.com/tools/ai-coding/lovable-vs-bolt-new-vs-v0); [superframeworks](https://superframeworks.com/compare/lovable-vs-bolt-vs-v0)
- **Figma Make:** "Figma Make generally relies on shadcn/ui for most UI generation". This is a vendor claim from a shadcn Figma kit seller, not Figma docs. The kit page says you can publish a customized shadcn library to Make so output follows your brand. Figma's official page only says Make generates React code. — [Obra shadcn/ui Pro kit](https://shadcn-ui-kit.pages.dev/products/obra-shadcn-ui-pro); [Figma Make React generator (JP)](https://www.figma.com/ja-jp/solutions/ai-react-generator/); anecdote: [brainy.ink glossary](https://brainy.ink/paper/glossary/figma-make)
- **Google Stitch:** exports **HTML + Tailwind CSS**. React is reached through a conversion step, e.g. a coding agent via the Stitch MCP server or the community `stitch-to-react` skills. One blog claims direct React/Vue/Angular export, but other sources do not confirm it. Zapier calls the export "only a scaffold". — [LogRocket Stitch tutorial](https://blog.logrocket.com/google-stitch-tutorial/); [Zapier](https://zapier.com/blog/google-stitch/); [pasqualepillitteri.it (React claim)](https://pasqualepillitteri.it/en/news/647/google-stitch-mcp-export-claude-code-design-to-code); [Netlify KB on export issues](https://www.netlify.com/knowledge-base/deploy-your-google-stitch-app-to-netlify/)
- **Raw LLMs (bare prompt "build me an app"):** a May 2026 convergence table puts shadcn/ui as the component default for Claude, DeepSeek, Qwen Coder, v0 and Lovable (5/9). GPT, Gemini, Grok and Bolt are "mixed/project-dependent" (4/9). Tailwind is the styling default in 8/9, and GPT is "Tailwind or CSS". **MUI is chosen by 0/9.** Caveat: this is assembled from vendor docs and author observation, not a controlled test. — [saschb2b.com "LLM default React stack" (2026-05-04, upd. 2026-05-31)](https://saschb2b.com/blog/llm-default-react-stack)
- Tony Dinh (TypingMind) calls shadcn the "default UI lib of LLMs". Several blogs say AI app builders "all" generate shadcn components. — quoted in [inbuild blog, Apr 2026](https://inbuild-seven.vercel.app/blog/shadcn-vs-material-ui-2026)
- **MUI's own answer:** "MUI Recipes" (formerly MUI Chat) is a generator where "you describe the UI you want" and get React code using Material UI, MUI X or Base UI APIs. — [Introducing Material UI and MUI X v9 (2026-04-08)](https://mui.com/blog/introducing-mui-v9/)

### Inferences
- A team that prototypes in v0, Lovable, Figma Make or Stitch and then implements in an MUI codebase has to **translate every screen** (Tailwind classes → `sx`/theme, shadcn parts → MUI components). A shadcn codebase can often paste or `shadcn add` the output directly.
- Output from these generators also becomes training data, so the shadcn default reinforces itself.

### Gaps
- No official Vercel v0 or Figma doc confirming the default library was fetched in this pass. The v0 claim rests on consistent third-party reporting.
- Claude artifacts: Claude's in-chat React artifacts are widely known to offer Tailwind and shadcn/ui components, but I did not fetch a primary source this pass. Treat as unverified.
- No source found on whether any of these tools supports an MUI target in its settings.

## Q2. How accurate is AI code generation for MUI vs shadcn/Tailwind, and how does it fail?

### Takeaway
No controlled benchmark compares LLM accuracy on MUI vs shadcn. The evidence is mechanistic and anecdotal. MUI's main risk is **version drift**: v4/v5/v6/v7/v9 APIs mixed together, the Grid rewrite, renamed imports. shadcn's risks are **Tailwind v3 vs v4 config and class differences**, and the **Radix vs Base UI** primitive split that shadcn introduced in 2026.

### Cited Findings
- **MUI Grid churn (a key failure mode):** v6 replaced the `item` prop and the `xs/sm/md/lg/xl` props with a single `size` prop (`size={{ xs: 12, sm: 6 }}`, `size="grow"`) and renamed offset props. A codemod `v6.0.0/grid-v2-props` is provided. — [MUI: Upgrade to Grid v2](https://mui.com/material-ui/migration/upgrade-to-grid-v2/); [v7 md copy](https://v7.mui.com/material-ui/migration/upgrade-to-grid-v2.md)
- The Grid v2 component changed names across versions: `Unstable_Grid2` in v5, then `Grid2` in v6, then `Grid` in v7. That is a source of wrong imports. — [MUI Grid v2 migration](https://mui.com/material-ui/migration/upgrade-to-grid-v2/)
- v9 removed deprecated APIs ("cleanup of deprecated APIs"). Code generated from v5/v7-era training data may therefore break on v9. — [newreleases v9.0.0](https://newreleases.io/project/github/mui/material-ui/release/v9.0.0); [MUI v9 blog](https://mui.com/blog/introducing-material-ui-v9/)
- MUI itself acknowledges that AI assistants "hallucinate links" and cite non-existent docs on multi-part questions. That is its stated reason for shipping an MCP server. — [MUI MCP docs](https://mui.com/material-ui/getting-started/mcp/)
- Arguments for shadcn/Tailwind being easier for AI: Tailwind utilities are systematic and very common in training data, and they sit next to the JSX. CSS-in-JS (MUI) "produces less predictable output from AI generation". Copied-in shadcn source is visible to the agent, whereas packaged libraries hide their internals, which invites hallucinated props. These are opinion or vendor sources (some are shadcn-ecosystem sellers). — [inbuild 2026](https://inbuild-seven.vercel.app/blog/shadcn-vs-material-ui-2026); [shadcn.io "Why AI loves shadcn"](https://www.shadcn.io/ui/why-ai-loves-shadcn-ui); [Spatie: Tailwind to StyleX](https://spatie.be/blog/from-tailwind-to-stylex)
- Counterpoint: AI tends to write fixed-value Tailwind classes rather than mobile-first ones, and the gap "may be smaller than the marketing implies". — summarized from [DEV comments on CSS & generative AI](https://dev.to/asafaeirad/why-css-is-so-hard-for-generative-ais-to-understand-17fo/comments); [Untitled UI on vibe-coding libraries](https://www.untitledui.com/blog/vibe-coding-libraries)
- **shadcn-side drift:** Tailwind v4 support arrived Feb 2025, with CSS-first config and OKLCH colors. shadcn added Base UI docs (Jan 2026), blocks for both Radix and Base UI (Feb 2026), and **made Base UI the default (Jul 2026)**. Models trained on Radix-era or Tailwind v3 shadcn code can therefore generate the wrong primitive APIs or config. The shadcn Skill explicitly covers "Tailwind v3 and v4" and "base-specific APIs" to counter this. — [shadcn changelog](https://ui.shadcn.com/docs/changelog); [shadcn Skills](https://ui.shadcn.com/docs/skills)

### Inferences
- MUI's large public API surface plus five majors in roughly five years (v5 2021, v6 2024, v7 Mar 2025, v9 Apr 2026) is a known drift risk for LLMs. Pinning a version in agent rules and using `@mui/mcp` reduces it.
- shadcn's drift is shallower. The code is local, so the agent edits files it can read, but drift now exists along two axes: Tailwind v3/v4 and Radix/Base UI.

### Gaps
- No quantitative benchmark found (e.g., pass rate or compile-error rate of Claude, GPT, Cursor or Copilot on MUI vs shadcn tasks).
- No systematic study of hallucinated MUI components (e.g., invented props). Only anecdotes, such as [DEV rant](https://dev.to/rahucode/ai-is-still-useless-at-solving-real-ui-errors-a-brutally-honest-developer-rant-93j).

## Q3. AI-specific tooling: shadcn vs MUI

### Takeaway
Both now ship first-party AI tooling. **shadcn** has the deeper agent integration: an MCP server built into the CLI that works with any registry, an Agent Skill, llms.txt, and Open in v0. **MUI** has `@mui/mcp`, which serves docs only, plus llms.txt, the Data Grid AI Assistant, and MUI Recipes.

### Cited Findings
- **shadcn MCP server:** shipped with CLI 3.0 in Aug 2025 ("MCP server for all registries"). It runs as `npx shadcn@latest mcp` and is set up with `shadcn mcp init --client claude`. It lets assistants browse, search and install components, blocks and templates from the default, third-party, private or namespaced (`@acme`) registries, with auth headers for private ones. Documented clients: Claude Code, Cursor, VS Code, Codex, OpenCode. — [shadcn MCP docs](https://ui.shadcn.com/docs/mcp); [CLI 3.0 + MCP changelog](https://ui.shadcn.com/docs/changelog/2025-08-cli-3-mcp)
- **shadcn registry:** anyone can publish a registry (`registry.json`), and MCP or the CLI can install from it. Example: marmelab added MCP support to its shadcn-admin-kit registry. — [shadcn registry MCP](https://ui.shadcn.com/docs/registry/mcp); [marmelab blog 2025-08-19](https://marmelab.com/blog/2025/08/19/shadcn-admin-kit-mcp.html)
- **shadcn Skills:** installed with `pnpm dlx skills add shadcn/ui` and activated by `components.json`. It runs `shadcn info --json` to learn the framework, Tailwind version, base library (Radix or Base UI) and installed components. It teaches CLI usage, theming (CSS variables, OKLCH, dark mode), registry authoring and composition rules (e.g., `FieldGroup`, `ToggleGroup`). — [shadcn Skills](https://ui.shadcn.com/docs/skills)
- **shadcn llms.txt:** `https://ui.shadcn.com/llms.txt` returns HTTP 200 (checked 2026-11-12) and is linked from the docs. — [shadcn Skills page](https://ui.shadcn.com/docs/skills)
- **shadcn `create`** (Dec 2025) and **CLI v4** (Mar 2026). — [shadcn changelog](https://ui.shadcn.com/docs/changelog)
- **MUI MCP (`@mui/mcp`, official):** runs locally over stdio (`claude mcp add mui-mcp -- npx -y @mui/mcp@latest`). Tools: `useMuiDocs` and `fetchDocs`. Its purpose is to answer from real docs and registry code instead of hallucinating. Clients: VS Code, Cursor, Windsurf, JetBrains, Zed, Claude Code. It also covers MUI X, with optional `preferred_theme` and `component_filter`. — [MUI MCP docs](https://mui.com/material-ui/getting-started/mcp/); [MUI X MCP](https://mui.com/x/introduction/mcp/); [unpkg @mui/material@9.5.0 mcp.md](https://unpkg.com/@mui/material@9.5.0/docs/material-ui/getting-started/mcp.md)
- **MUI llms.txt:** `https://mui.com/material-ui/llms.txt` returns HTTP 200 (checked 2026-11-12). MUI also publishes version-pinned files such as `llms.mui.com/material-ui/7.1.0/llms.txt`. — [MUI MCP page nav](https://mui.com/material-ui/getting-started/mcp/); [llms.mui.com 7.1.0](https://llms.mui.com/material-ui/7.1.0/llms.txt)
- **MUI product AI:** the Data Grid AI Assistant changes grids from natural-language requests and needs MUI Console for license and API keys in production. MUI Recipes generates MUI, MUI X or Base UI code. — [MUI v9 blog 2026-04-08](https://mui.com/blog/introducing-mui-v9/)
- Many unofficial MCP servers exist for both libraries, e.g., jgentes/mui-mcp-cloudflare and Jpisnice/shadcn-ui-mcp-server. Check the publisher before installing. — [LobeHub jgentes](https://lobehub.com/en/mcp/jgentes-mui-mcp-cloudflare); [Glama shadcn-ui-mcp-server](https://glama.ai/mcp/servers/@Jpisnice/shadcn-ui-mcp-server)

### Inferences
- shadcn's MCP is **generative and installing**: the agent pulls real component source into the repo. MUI's MCP is **reference-only**: the agent still writes code against a package API. For agents, installing real source tends to be more reliable than recalling an API.
- Neither has an "Open in v0" equivalent on the MUI side. v0, Lovable and Figma Make speak shadcn natively.

### Gaps
- No release date found for `@mui/mcp` or the MUI llms.txt (both marked "New" in the docs nav).
- No official "MUI Agent Skill" found.

## Q4. How consistent does AI-generated UI stay over time with each approach?

### Takeaway
MUI enforces consistency through a **central theme**: components read palette, typography and spacing from `createTheme`, so ad-hoc AI code still inherits the look unless it hard-codes `sx` values. shadcn enforces it through **CSS-variable tokens plus local component variants (cva)**. Because the components are copied in, agents can and do edit or fork them, so consistency depends on rules, the Skill and registries.

### Cited Findings
- The shadcn Skill teaches "semantic colors", CSS-variable theming and composition rules specifically to keep agent output on-system. — [shadcn Skills](https://ui.shadcn.com/docs/skills)
- shadcn private or namespaced registries let a team publish its own approved components, which agents then install via MCP. This is the shadcn mechanism for org-wide consistency. — [shadcn MCP docs](https://ui.shadcn.com/docs/mcp)
- Figma Make can be pointed at a team's published shadcn library so generated screens follow the brand (vendor claim). — [Obra shadcn kit](https://shadcn-ui-kit.pages.dev/products/obra-shadcn-ui-pro)
- MUI v9 extends theme CSS variables with `color-mix()` for derived colors and has a roadmap item for Tailwind integration and independence from Emotion. — [MUI v9 blog](https://mui.com/blog/introducing-mui-v9/)
- RedMonk frames shadcn as "the revenge of copypasta": ownership and flexibility come at the cost of the drift and divergence that copied code allows. — [RedMonk, 2025-04-22](https://redmonk.com/kholterhoff/2025/04/22/ui-component-libraries-shadcn-ui-and-the-revenge-of-copypasta/)

### Inferences
- If a team lets many AI sessions edit UI unsupervised, MUI's package boundary is a guardrail: agents cannot quietly rewrite `Button`. With shadcn, `components/ui/*` should be treated as protected files, enforced via CLAUDE.md rules, the Skill and `shadcn diff`.
- Tailwind's arbitrary values (`text-[13px]`, `bg-[#3b4350]`) are the shadcn equivalent of MUI's hard-coded `sx` values. Both erode consistency and both need lint or rules.

### Gaps
- No empirical study measuring design drift in AI-generated codebases for either approach.

## Q5. Adoption trends: downloads, stars, surveys, companies, jobs

### Takeaway
MUI is still a very large and growing package (about 46M downloads/month in Oct 2026). But the shadcn ecosystem has grown much faster in 2025–2026: the shadcn CLI is up roughly 28x year over year, and its weekly downloads now exceed `@mui/material`'s. Base UI, also from the MUI team and now shadcn's default primitive layer, went from zero to about 83M downloads/month. In State of React 2025, MUI is still #1 by usage, but shadcn is "on the verge of overtaking it".

### Cited Findings — npm (api.npmjs.org, queried 2026-11-12)
| Package | Week 2026-11-04..10 | Oct 2025 (month) | Oct 2026 (month) |
|---|---|---|---|
| `@mui/material` | 13,887,211 | 27,697,825 | 45,721,559 |
| `shadcn` (CLI) | 17,908,605 | 1,862,177 | 55,145,782 |
| `@radix-ui/react-slot` (used by shadcn Radix variant) | 231,958,998 | 115,435,665 | 805,713,970 |
| `@base-ui/react` | 29,125,232 | 0 (pkg not yet published) | 82,883,122 |
| `radix-ui` (umbrella) | 27,354,123 | – | – |
| `tailwindcss` | 176,571,188 | – | – |
| `class-variance-authority` | 81,133,412 | – | – |
| `@mui/x-data-grid` | 4,306,505 | – | – |
| `antd` / `@mantine/core` / `@chakra-ui/react` | 5.27M / 3.75M / 2.06M | – | – |

Monthly series (api.npmjs.org): `@mui/material` 17.7M (Nov 2024) → 23.0M (May 2025) → 25.2M (Nov 2025) → 38.3M (May 2026) → 45.7M (Oct 2026). `shadcn` 0.40M → 0.69M → 1.95M → 20.3M → 55.1M over the same months. Source: `https://api.npmjs.org/downloads/point/<range>/<pkg>`.

### Cited Findings — GitHub stars (api.github.com, queried 2026-11-12)
- shadcn-ui/ui: **127,959**. mui/material-ui: **99,327**. radix-ui/primitives: 19,490. mui/base-ui: 11,378.
- Earlier reference point: MUI was at "95,000+ stars and 4 million+ weekly downloads" in Mar 2025. — [as summarized via search; third-party article Mar 2025](https://www.telerik.com/blogs/top-10-best-react-ui-libraries-2026-ai-dx-edition)

### Cited Findings — surveys
- **State of React 2024:** shadcn/ui usage doubled from 20% to 42% in one year and topped positivity at 80%. MUI remained #1 in usage. — [State of React 2024 component libraries](https://state-of-react-2024.onrender.com/en-US/libraries/component-libraries); [RedMonk 2025-04-22](https://redmonk.com/kholterhoff/2025/04/22/ui-component-libraries-shadcn-ui-and-the-revenge-of-copypasta/)
- **State of React 2025** (3,760 responses, Nov 2025–Jan 2026): "MUI is still number one in terms of usage" while "shadcn/ui is growing fast and on the verge of overtaking it". The average respondent uses 2.3 UI libraries, 1,246 use none, and the most-used libraries sit around 50–57% usage. In write-ins, Base UI was the top "other" library (49 mentions). — [State of React 2025: component libraries](https://2025.stateofreact.com/en-US/libraries/component-libraries/); [certificates.dev breakdown](https://certificates.dev/blog/breaking-down-state-of-react-2025-results); [Telerik 2026](https://www.telerik.com/blogs/top-10-best-react-ui-libraries-2026-ai-dx-edition)

### Inferences
- **npm counts are inflated by AI tooling.** Every v0, Lovable or Bolt sandbox and every agent run of `npx shadcn add` or `npx shadcn mcp` counts as a download, so the 28x shadcn CLI jump and Radix's 805M/month partly measure **AI-builder and CI volume, not distinct human teams**. MUI's +65% year over year (Oct 2025 → Oct 2026) is still strong organic growth.
- The `@base-ui/react` surge lines up with shadcn making Base UI its default in July 2026. Ironically, MUI's own team benefits from shadcn's momentum through Base UI.
- Direct npm comparison is apples to oranges. `@mui/material` is a runtime dependency installed on every CI build. `shadcn` is a dev CLI run occasionally, so per-project its count should be *lower*. That it is higher points to very large AI-driven project-creation volume.

### Gaps
- **Job market:** I found no reliable 2025–2026 data on job-posting mentions of MUI vs shadcn. Not researched to a citable level.
- **Notable companies:** no primary-source list fetched this pass for either library. Not cited, to avoid fabrication.
- The exact State of React 2025 percentages for MUI and shadcn are not in the page text; they are only in interactive charts or the data export.
- State of JS 2025 results for UI libraries were not checked.
