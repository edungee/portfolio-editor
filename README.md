# Portfolio Editor

An agent skill that turns approved work evidence into private portfolio change proposals, readable review summaries and combined site previews.

**Status: experimental, private-dry-run release candidate.** Draft PR delivery is opt-in and requires host GitHub tools plus Git SSH access. The helpers do not crawl accounts or schedule themselves. The scripted adapter handles Markdown project milestones; a host-managed editorial workflow covers new projects, speaking, writing and other repository-backed surfaces. Only the Codex install path has been validated end to end; other hosts are documented but unverified (see [validation](references/validation.md)).

## What works where

The skill checks what the current agent can do and picks a mode ([details](references/modes.md)):

| Mode | Needs | You get |
| --- | --- | --- |
| **Full** | Shell, Node.js 22+, Git, a local checkout of your portfolio | Helper-validated proposals, a combined site preview, optional draft PR |
| **Helper** | Shell, Node.js 22+, Git (for example a chat app's code sandbox) | Helper-validated proposals and review files for an uploaded snapshot; no preview or PR |
| **Review-only** | Read access to your approved sources | Batch JSON, proposed milestone YAML and a private review, labelled as not validated by the helper |

Coding agents (Codex, Claude Code, Cursor) usually run in Full mode. Chat apps (Claude.ai, ChatGPT) usually run in Helper or Review-only mode. No mode merges, deploys or emails anything.

## Install the skill

The helpers have **no npm dependencies** (the YAML parser is bundled), so there is no install step beyond copying the skill.

**Coding agents with the skills CLI** (Codex was tested; others unverified):

```sh
npx skills add edungee/portfolio-editor --skill portfolio-editor --agent codex   # or claude-code, cursor, ...
```

The installer prints the installed directory; the tested Codex location is `.agents/skills/portfolio-editor`. You can also copy this folder into your agent's skills directory (for Claude Code, `.claude/skills/portfolio-editor`).

**Apps that install skills by upload** (Claude.ai, Claude desktop, ChatGPT; unverified): download `portfolio-editor.zip` from the latest GitHub release, or build it with `npm run package` (output in `dist/`), and upload it in the app's skills settings. The zip contains one `portfolio-editor/` folder with SKILL.md, references, examples and scripts; tests and CI files are left out.

Check the installation from the installed directory:

```sh
node scripts/demo.cjs
```

The synthetic demo produces a private review without requiring source accounts or a compatible website. It does not start a preview server.

## Your first real review

Start with this prompt in an agent that can read local files and your selected sources:

> Use the portfolio-editor skill to help me set up my first private review. Check whether my portfolio uses the supported Markdown milestone format. Help me create a private configuration and editorial policy using the supplied examples, and ask me which exact sources may be read. Once configured, collect evidence and produce a private review. Explain any missing access or unsupported format. Keep scheduling separate; do not publish changes or create a PR.

Provide your portfolio's absolute path when asked. The agent should check compatibility before collecting evidence. See [first-run guidance](references/first-run.md) and the [sample editorial policy](examples/editorial-policy.example.md). The sample is a starting point to edit, not permission to disclose your work.

## Develop and test

Requires Node.js 22 or later, npm, Git and tar. `npm ci` installs only the dev dependency used for the gray-matter parity test.

```sh
npm ci
npm test
npm run demo
npm run package
```

The demo creates a temporary synthetic repository and private output directory, prints a review report path, and repeats the run to demonstrate duplicate-notification suppression. It does not start a website or publish anything. Delete the printed temporary demo folder when finished.

## Use with your portfolio

1. Install the skill as above. Host tools and installation methods differ; the skill reports which mode it can run in.
2. Copy examples/config.example.json to a private location outside Git. Set absolute repository/state paths and your approved project/source registry. Copy examples/editorial-policy.example.md alongside the private config, edit it, and provide both absolute paths to the agent. The policy is read by the agent; it is not a config field or automatically enforced by the helper.
3. Ask the agent to read SKILL.md with that configuration path (or set PORTFOLIO_EDITOR_CONFIG and provide it to the agent). It collects fresh evidence using available host tools and creates a private batch matching references/batch.md.
4. Run `node scripts/pilot.cjs /absolute/config.json /absolute/batch.json`.
5. Review REVIEW.md, proposed Markdown and PR-SUMMARY.md in the printed run directory. Private source notes belong only in the private review, never in PR text.

The supported portfolio has committed content/projects/SLUG.md files with title, slug, date and a milestones array. Each milestone has id, date, title, summary, kind, rationale and optional evidence. See the synthetic fixture and batch reference. Proposed changes currently append milestones; other repository-backed edits use the host editorial workflow, not this milestone helper. Generic CMS adapters are not implemented.

For explicitly authorized account-wide discovery, follow [discovery](references/discovery.md). Accessible chats and Notion documents are inventoried incrementally with durable backfill and honest coverage limits. Known sources are seeds, not a ceiling. Reading a source does not grant permission to publish its contents.

For speaking, writing, new projects or a mixed patch, use [whole-portfolio editorial changes](references/editorial-changes.md). The host reviews and validates a combined committed snapshot; the commands below are for milestone-only proposals.

## Preview all proposed changes

```sh
node scripts/preview.cjs prepare /absolute/config.json /absolute/run/report.json
```

This creates site-preview beside the private report, pins the baseline commit, overlays accepted files and isolates build output. It rejects tracked working-tree edits and proposals changed since generation. Your real site must already have its dependencies installed and support its normal dev command. The synthetic demo is not a Next.js site.

Start the site's dev server in the returned directory on a dedicated localhost port. For Next.js, for example:

```sh
npm run dev -- --hostname 127.0.0.1 --port 3112
node /absolute/skill/scripts/preview.cjs verify /absolute/config.json /absolute/run/report.json http://127.0.0.1:3112
```

A requested temporary Cloudflare tunnel can provide a shareable URL. Verify it with the same helper before sending it. Current URL verification supports localhost and trycloudflare.com only. The agent manages server/tunnel lifecycle; the helper does not provision hosting or guarantee availability. Read references/review.md.

## Scheduling and delivery

Use your host's scheduler to invoke the skill with fresh evidence. examples/schedule.md supplies an instruction template. Configure timezone, missed-run behavior, credentials and machine availability explicitly. Report meaningful new proposals and actionable failures; stay quiet on unchanged runs.

By default, PR-SUMMARY.md is a prepared artifact, not a posted PR. Opt-in [draft PR delivery](references/delivery.md) validates the preview snapshot and pushes only reviewed Markdown. The host creates the draft PR and reports checks. One managed draft PR stays pending at a time; new qualifying changes join that same draft with an updated combined preview and summary, preserving reviewer edits. Merging and deployment are never automatic. Dry runs need no GitHub write access.

## Validation

See [installation validation](references/validation.md) for tested environments and the limits of those checks, and [modes](references/modes.md) for per-host notes. Installation support does not mean source connectors or scheduling work on every agent host.

## Privacy and limitations

Keep source IDs, raw evidence, credentials, config and run output outside the public repository. Pattern checks do not certify privacy; evidence quotes do not prove truth. The agent must assess provenance and disclosure. Public previews are disclosures too. Do not expose a development server containing secrets. The site adapter assumes your committed site is safe to preview.

Run locking covers helper execution; source collection and server lifecycle still require host coordination. JSON state writes are individually atomic, not a transaction across every report file. Deferred candidates remain recorded, and partial sources do not advance checkpoints. A complete helper run does not prove exhaustive source coverage.

See CONTRIBUTING.md and SECURITY.md. Licensed under Apache 2.0. This package is not affiliated with any agent host or service provider.
