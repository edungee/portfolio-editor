# Set up Portfolio Editor in Claude Code

[Choose another destination](../../README.md#choose-your-destination)

**Validation status:** This follows the documented Claude Code skill layout. A complete Portfolio Editor run in Claude Code has not yet been validated.

## 1. Prepare your workspace

Use the local coding agent with your portfolio repository open. Install Node.js 22 or later and Git, and make sure the agent can use its terminal and read the checkout. Ask it to report `node --version`, `git --version` and the portfolio's absolute path. If these capabilities are missing, use the [upload guide](uploads.md) and let the skill choose Helper or Review-only mode.

Keep an existing working copy's uncommitted changes intact. A later preview must use an isolated snapshot and the site's own build requirements.

## 2. Install the skill

[Get and extract the skill package](../../README.md#get-the-skill-files). In your portfolio's root directory, create `.claude/skills/` and place the extracted `portfolio-editor` folder inside it. The result must be:

```text
.claude/skills/portfolio-editor/SKILL.md
.claude/skills/portfolio-editor/scripts/
.claude/skills/portfolio-editor/references/
.claude/skills/portfolio-editor/examples/
```

Copy the whole folder, not just SKILL.md. Do not put your private configuration or evidence in it. Avoid installing a second copy if the skill is already present. This project-level location follows the [official Claude Code skill documentation](https://code.claude.com/docs/en/skills); these steps target local sessions, not remote or cloud agents.

## 3. Confirm discovery and run the demo

Start a fresh agent session in the portfolio workspace and send:

> Find the installed portfolio-editor skill. Read its SKILL.md, tell me the path you loaded and which mode this environment supports, then run its synthetic demo. Do not collect real sources or modify my portfolio yet.

The demo command, from the portfolio root, is:

```sh
node .claude/skills/portfolio-editor/scripts/demo.cjs
```

Success means the agent finds the expected skill and the demo prints a private review location, with one synthetic proposal followed by duplicate-notification suppression on replay. Read the generated review. The demo does not prove connector access or start a website. If the skill is missing, check the folder nesting and restart the session; if Node is too old, fix that before continuing.

## 4. Provide your portfolio and editorial policy

Send the absolute portfolio path. Ask the agent to check the content format using [first-run guidance](../first-run.md). For Full mode, have it copy the [configuration example](../../examples/config.example.json) and [policy example](../../examples/editorial-policy.example.md) into a private directory outside all Git repositories and outside the served site. Replace sample project IDs and paths with your own; keep delivery in private-dry-run mode.

Edit the policy to say what is suitable for public disclosure. The milestone helper supports Markdown project milestones. Speaking, writing, new projects and mixed edits follow the [editorial workflow](../editorial-changes.md); an unsupported CMS needs a separate adapter or a review-only proposal.

## 5. Provide one approved evidence source

Choose one exact chat, document or exported file that the agent may read. Enable your host's appropriate connector if available, or provide a selected export. Ask the agent to confirm it can read that source and record any missing or partial access. Installation does not connect Notion or grant access to chat history. Account-wide discovery is a separate [explicit opt-in](../discovery.md).

## 6. Run your first private review

Replace the bracketed values and send:

> Use portfolio-editor for a first private review of [absolute portfolio path]. Use my private config at [absolute config path] and editorial policy at [absolute policy path]. Read only [approved source]. Check the execution mode and content compatibility first. Collect fresh evidence, compare it with current content and prior decisions, and produce REVIEW.md and PR-SUMMARY.md for supported proposals. Include editorial proposals for other relevant surfaces separately. Explain access gaps and validation limits. Keep source evidence private. Do not push, open a PR, merge, deploy or schedule anything.

## 7. Check the result

Open the reported private output directory. Check that REVIEW.md explains each include/defer/ignore decision, identifies partial sources and points to the proposed changes. PR-SUMMARY.md must contain only public-safe copy. A review with no qualifying changes is a valid result; do not manufacture a proposal to pass this step.

For qualifying changes in Full mode, ask the agent to follow [review and preview preparation](../review.md), build one isolated snapshot, start its dev server and verify the URL against that snapshot. Expect a project-by-project summary, private review path, verified preview URL, changed-page links and validation status. A failed preview must be labelled unavailable. No-change runs need no preview.

## 8. Add delivery and scheduling when ready

After reviewing a successful run, explicitly opt into [draft PR delivery](../delivery.md) if desired. The agent must check repository access, Git SSH and host PR tools; a successful read does not prove push permission. Draft creation remains separate from merge and deployment.

For recurring reviews, use the [schedule template](../../examples/schedule.md) with your host's scheduler. Set timezone, source scope, durable private state, overlap handling and missed-run behavior. Ensure the scheduled environment can access the skill, portfolio and sources. Record an actual triggered run before calling scheduling validated. A local installation alone does not create a schedule.
