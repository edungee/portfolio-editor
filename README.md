# Portfolio Editor

An agent skill that turns approved work evidence into private portfolio change proposals, readable review summaries and combined site previews.

**Status: experimental, private-dry-run release candidate.** Draft PR delivery is opt-in and requires host GitHub tools plus Git SSH access. The helpers do not crawl accounts or schedule themselves. The scripted adapter handles Markdown project milestones; a host-managed editorial workflow covers new projects, speaking, writing and other repository-backed surfaces. The Codex install target and synthetic demo have been tested; full first-use walkthroughs on other hosts still need validation (see [validation](references/validation.md)).

## What works where

The skill checks what the current agent can do and picks a mode ([details](references/modes.md)):

| Mode | Needs | You get |
| --- | --- | --- |
| **Full** | Shell, Node.js 22+, Git, a local checkout of your portfolio | Helper-validated proposals, a combined site preview, optional draft PR |
| **Helper** | Shell, Node.js 22+, Git (for example a chat app's code sandbox) | Helper-validated proposals and review files for an uploaded snapshot; no preview or PR |
| **Review-only** | Read access to your approved sources | Batch JSON, proposed milestone YAML and a private review, labelled as not validated by the helper |

Coding agents (Codex, Claude Code, Cursor) usually run in Full mode. Chat apps (Claude.ai, ChatGPT) usually run in Helper or Review-only mode. No mode merges, deploys or emails anything.

## Choose your destination

Choose the app where you want to run Portfolio Editor. Each guide covers installation, checking that the skill is available, connecting your portfolio and evidence, and completing a first private review.

- **[Codex](references/setup/codex.md)** — local portfolio checkout, preview and optional draft PR. The install target and synthetic demo have been tested.
- **[Claude Code](references/setup/claude-code.md)** — local setup using Claude Code's skill directory. Host walkthrough awaiting validation.
- **[Cursor](references/setup/cursor.md)** — local setup in your portfolio workspace. Host walkthrough awaiting validation.
- **[ZIP uploads and chat apps](references/setup/uploads.md)** — Claude upload instructions and a file-based fallback for other hosts; capabilities depend on the app. Host walkthrough awaiting validation.

Start with one destination and one approved evidence source. Installation does not connect your accounts or enable a schedule. The guides link to official host documentation; that is separate from testing this skill on each host. See [what has been validated](references/validation.md).

### Get the skill files

The helpers have no runtime npm dependencies: the YAML parser is bundled. For the published default branch, the tested Codex installer command is:

```sh
npx skills add edungee/portfolio-editor --skill portfolio-editor --agent codex
```

**Testing the portability changes before they are merged:** use the `portability` checkout, not the default-branch installer above. In a terminal, from a folder outside your portfolio repository:

```sh
git clone --branch portability https://github.com/edungee/portfolio-editor.git portfolio-editor-portability
cd portfolio-editor-portability
node scripts/package.cjs
```

This requires Git and Node.js 22+. Extract `dist/portfolio-editor.zip`; it contains one `portfolio-editor/` folder. Follow your destination guide to install that folder or upload the ZIP. Keep the source checkout outside the destination skill folder. A GitHub source-code ZIP is not the generated skill ZIP. When a release publishes a skill ZIP, you can use that asset instead of building it.

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
