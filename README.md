# Portfolio Editor

An agent skill that turns approved work evidence into private portfolio change proposals, readable review summaries and combined site previews.

**Status: experimental, private-dry-run release candidate.** Automatic PR delivery is not implemented. The helpers do not crawl accounts or schedule themselves. Only a Markdown project/milestone format is supported today. Cross-platform live integration has not been validated.

## Install the skill

Requires Node.js 22 or later, npm, Git and tar. In the project where you want to use the skill:

```sh
npx skills add edungee/portfolio-editor --skill portfolio-editor
```

Choose your agent when prompted. For a project-local Codex installation, use `--agent codex`. The installer prints the installed directory; the tested Codex location is `.agents/skills/portfolio-editor`. Installation copies the skill resources but does **not** install the helper's npm dependencies or configure a schedule.

From the installed directory (adjust this path to the installer's output):

```sh
cd .agents/skills/portfolio-editor
npm ci --ignore-scripts
npm test
npm run demo
```

Run these commands in the skill directory, not your portfolio root. The synthetic demo produces a private review without requiring source accounts or a compatible website. It does not start a preview server.

## Your first real review

Start with this prompt in an agent that can read local files and your selected sources:

> Use the portfolio-editor skill to help me set up my first private review. Check whether my portfolio uses the supported Markdown milestone format. Help me create a private configuration and editorial policy using the supplied examples, and ask me which exact sources may be read. Once configured, collect evidence and produce a private review. Explain any missing access or unsupported format. Keep scheduling separate; do not publish changes or create a PR.

Provide your portfolio's absolute path when asked. The agent should check compatibility before collecting evidence. See [first-run guidance](references/first-run.md) and the [sample editorial policy](examples/editorial-policy.example.md). The sample is a starting point to edit, not permission to disclose your work.

## Try it without private data

Requires Node.js 22 or later, npm, Git and tar. The test fixture is generated locally; it does not use a personal repository or cloud account.

```sh
npm ci
npm test
npm run demo
```

The demo creates a temporary synthetic repository and private output directory, prints a review report path, and repeats the run to demonstrate duplicate-notification suppression. It does not start a website or publish anything. Delete the printed temporary demo folder when finished.

## Use with your portfolio

1. Copy this folder to your agent host's supported skill directory, or explicitly provide SKILL.md. Host tools and installation methods differ.
2. Copy examples/config.example.json to a private location outside Git. Set absolute repository/state paths and your approved project/source registry. Copy examples/editorial-policy.example.md alongside the private config, edit it, and provide both absolute paths to the agent. The policy is read by the agent; it is not a config field or automatically enforced by the helper.
3. Ask the agent to read SKILL.md with that configuration path (or set PORTFOLIO_EDITOR_CONFIG and provide it to the agent). It collects fresh evidence using available host tools and creates a private batch matching references/batch.md.
4. Run `node scripts/pilot.cjs /absolute/config.json /absolute/batch.json`.
5. Review REVIEW.md, proposed Markdown and PR-SUMMARY.md in the printed run directory. Private source notes belong only in the private review, never in PR text.

The supported portfolio has committed content/projects/SLUG.md files with title, slug, date and a milestones array. Each milestone has id, date, title, summary, kind, rationale and optional evidence. See the synthetic fixture and batch reference. Proposed changes currently append milestones; arbitrary body rewrites and CMS adapters are not implemented.

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

PR-SUMMARY.md is a prepared artifact, not a posted PR. Planned delivery: create/update one draft PR from the exact reviewed snapshot, verify checks, then notify with PR and preview links. No GitHub write credentials are needed for this release.

## Validation

See [installation validation](references/validation.md) for tested environments and the limits of those checks. Installation support does not mean source connectors or scheduling work on every agent host.

## Privacy and limitations

Keep source IDs, raw evidence, credentials, config and run output outside the public repository. Pattern checks do not certify privacy; evidence quotes do not prove truth. The agent must assess provenance and disclosure. Public previews are disclosures too. Do not expose a development server containing secrets. The site adapter assumes your committed site is safe to preview.

Run locking covers helper execution; source collection and server lifecycle still require host coordination. JSON state writes are individually atomic, not a transaction across every report file. Deferred candidates remain recorded, and partial sources do not advance checkpoints. A complete helper run does not prove exhaustive source coverage.

See CONTRIBUTING.md and SECURITY.md. Licensed under Apache 2.0. This package is not affiliated with any agent host or service provider.
