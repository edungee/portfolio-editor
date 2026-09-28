# Operating modes and host capabilities

Agent hosts differ. Choose the mode from what you can actually do in this session, not from the host's name or from this document. Never say a helper, build, preview or push ran unless you ran it and saw its output.

## Capability check

Run these checks once at the start of each session and state the results in one line to the user.

| Capability | How to check | Needed for |
| --- | --- | --- |
| Shell | You can run a command and see its output | Helper, Full |
| Node.js 22+ | `node --version` | Helper, Full |
| Git | `git --version` | Helper, Full |
| Portfolio checkout | `git -C <portfolio path> rev-parse HEAD` succeeds on the user's real repository | Full |
| Background processes on localhost | The host can keep a dev server running and fetch from 127.0.0.1 | Full (preview) |
| GitHub write | A host PR tool or authenticated `gh`, plus Git SSH push (`git ls-remote git@github.com:OWNER/REPO.git`) | Full (optional draft PR) |
| Source read tools | Connectors or local access for each approved source (Notion, Git, chats) | All modes |

No npm install is needed. The helpers only use Node built-ins and a bundled YAML parser. `npm ci` is only needed to run the gray-matter parity test.

## Modes

**Full.** All capabilities present. Follow SKILL.md as written: helper, combined preview, optional draft PR delivery.

**Helper.** Shell, Node 22+ and Git, but no checkout of the real repository, no persistent private storage, or no localhost preview (typical of a code-execution sandbox in a chat app).

- Ask the user to upload their portfolio's `content/projects/` folder or a repository archive. If it has no Git history, create a throwaway snapshot repository outside the state directory and tell the user the baseline is that local snapshot, not their default branch.
- Put config and state in a session-private directory outside that snapshot. Say that checkpoints and duplicate-notification state last only for this session unless the user saves and re-uploads the state directory.
- Run `scripts/pilot.cjs` as normal. Skip `preview.cjs` and `delivery.cjs`. Return the proposed Markdown files, REVIEW.md and PR-SUMMARY.md as downloadable files, and say that no site preview or production build was run.

**Review-only.** No shell, no Node 22+ or no Git.

- Collect evidence with whatever read tools the host has, applying collection.md and discovery.md limits honestly.
- For existing-project milestones, apply the batch.md gates yourself: complete supporting-source coverage, a verbatim evidence quote, a real non-future event date, stable IDs, no existing milestone, `publicationCleared`, verified public artifact for releases and publications, and no private locators or secrets in public copy. If a gate fails or is uncertain, defer that claim.
- For new projects, speaking/series, writing and profile edits, use the evidence and copy guidance in editorial-changes.md without its Git/build/delivery steps. Return an editorial proposal with a stable ID, intended surface, before/after public wording, private evidence references, include/defer/ignore decision and disclosure rationale. An undated series/profile entry needs no fabricated date or milestone ID. Record unknown placement or unavailable current content as a limitation; do not claim a patch was applied. Helper mode uses the same proposal format for changes outside the milestone adapter.
- Return batch JSON and proposed YAML for eligible milestones, plus editorial proposals for other surfaces. Include one combined private review of all included/deferred/ignored candidates and one public-safe summary. Label outputs **not validated by the helper**. Do not claim persistent checkpoints. For bounded discovery, include a portable continuation ledger (resource IDs, cursors, pending work and decisions) the user can retain and supply next time. Without it, disclose that prior coverage and duplicate suppression cannot be resumed.
- Do not claim a preview, build, commit or PR.

Mode-specific execution rules apply only to the selected mode. Full mode may keep checkpoints, build previews and deliver authorized draft PRs; Helper and Review-only restrictions do not override those capabilities. The privacy boundary, editorial policy and "never merge, deploy or email automatically" apply in every mode.

## Host notes

These notes describe where to look, not guarantees. Only the Codex install row has been exercised (see validation.md). Treat every other row as unverified until the capability check confirms it.

| Host | Typical mode | Install | Where the capabilities usually come from |
| --- | --- | --- | --- |
| Codex (CLI/app) | Full | `npx skills add edungee/portfolio-editor --skill portfolio-editor --agent codex` | Shell and Git locally. PR creation through the host's GitHub integration or `gh`. |
| Claude Code | Full | `npx skills add ... --agent claude-code`, or copy the folder to `.claude/skills/portfolio-editor` | Shell, Git, background processes. `gh` for PRs. Notion and other sources through MCP servers. |
| Claude Cowork (desktop) | Full or Helper, depending on whether the user's portfolio folder is connected | Upload the release zip as a skill | Shell in its workspace. Connected folders for the checkout. Connectors for Notion and GitHub. Scheduled tasks for scheduling. |
| Claude.ai (web/mobile) | Helper or Review-only | Upload the release zip in the Skills settings | Code-execution sandbox (confirm Node and Git versions). Connectors for sources. No push. |
| ChatGPT | Helper or Review-only | Upload the release zip as a skill | Code-execution sandbox (confirm Node and Git are present). Connected apps for sources. No push. |
| Cursor and other skills-compatible IDE agents | Full | `npx skills add ... --agent <agent>` or copy the folder into the agent's skills directory | Shell and Git from the IDE terminal. |

Generic terms used across the references:

- **Conversation or task history**: chat threads, agent tasks or sessions the host lets you enumerate and read. Many hosts expose none, or only recent ones. Record that as a coverage limitation. Never read local chat databases to work around it.
- **Host GitHub tool**: any authenticated way to list, create and update pull requests (a connector, an MCP server or `gh`). Git push success does not prove PR-write access.
- **Host scheduler**: the host's own scheduled or recurring task feature. Copying the skill creates no schedule.
- **Attach the PR to the task**: only if the host has such a feature. Otherwise include the PR link in the report.
