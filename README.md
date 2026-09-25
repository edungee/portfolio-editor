# Portfolio Editor

An agent skill that turns approved work evidence into private portfolio change proposals, readable review summaries and combined site previews.

**Status: experimental, private-dry-run release candidate.** Automatic PR delivery is not implemented. The helpers do not crawl accounts or schedule themselves. Only a Markdown project/milestone format is supported today. Cross-platform live integration has not been validated.

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
2. Copy examples/config.example.json to a private location outside Git. Set absolute repository/state paths and your approved project/source registry. Write your own editorial policy; the sample is not a recommendation about your projects.
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

## Privacy and limitations

Keep source IDs, raw evidence, credentials, config and run output outside the public repository. Pattern checks do not certify privacy; evidence quotes do not prove truth. The agent must assess provenance and disclosure. Public previews are disclosures too. Do not expose a development server containing secrets. The site adapter assumes your committed site is safe to preview.

Run locking covers helper execution; source collection and server lifecycle still require host coordination. JSON state writes are individually atomic, not a transaction across every report file. Deferred candidates remain recorded, and partial sources do not advance checkpoints. A complete helper run does not prove exhaustive source coverage.

See CONTRIBUTING.md and SECURITY.md. Licensed under Apache 2.0. This package is not affiliated with any agent host or service provider.
