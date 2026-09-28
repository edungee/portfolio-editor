# Set up Portfolio Editor through uploads

[Choose another destination](../../README.md#choose-your-destination)

**Validation status:** The generated ZIP and its synthetic demo have been checked outside chat apps. Uploading and completing a review inside Claude or another chat host still needs a host-specific test.

## 1. Choose an installation method your app supports

For Claude's documented custom skill upload flow, use **Customize → Skills → + → Create skill → Upload a skill**, upload the generated ZIP, then enable the skill. Skills and code execution may depend on your workspace policy. See [Claude's official instructions](https://support.claude.com/en/articles/12512180-use-skills-in-claude).

For other chat hosts, including ChatGPT, do not assume there is an equivalent ZIP skill installer. If your app exposes a documented skill installation flow, follow it. Otherwise provide the extracted SKILL.md and the referenced files the agent needs as task attachments. That is a session-based workflow, not a persistent skill installation. If the host cannot read those files, use one of the local coding-agent destinations instead.

## 2. Get the correct package

Follow [Get the skill files](../../README.md#get-the-skill-files) to build `dist/portfolio-editor.zip` from the portability checkout. Use a published skill ZIP asset when one is available. Do not upload GitHub's source-code archive as a skill package. The generated ZIP contains one `portfolio-editor/` folder with SKILL.md, scripts, references and examples.

Upload the package for a supported installer, or extract it for the attachment fallback above. Do not add private source evidence or credentials to the install ZIP.

## 3. Confirm the available mode

Start a new conversation and send:

> Read portfolio-editor's SKILL.md and references/modes.md. Confirm which files you can access and whether shell execution, Node.js 22+ and Git are available. Select Helper or Review-only mode based on actual capabilities. Do not claim persistent installation, filesystem state or tools you cannot verify.

In Helper mode, ask the agent to run `node scripts/demo.cjs` from the extracted skill directory. It should produce a synthetic private review and suppress repeat notification on replay. In Review-only mode, skip execution and label proposals as not validated by the helper. Missing Node or Git should cause a mode downgrade, not a fabricated successful test.

## 4. Provide current portfolio content and policy

Upload or paste the relevant current pages and their content files. For Helper mode, provide a minimal content snapshot so the agent can create the throwaway Git repository described in [first-run guidance](../first-run.md). Exclude secrets, credentials, private configuration and unrelated files. A URL alone may not provide the editable content the helper needs.

Provide your editorial policy as text or a file using the [example](../../examples/editorial-policy.example.md). Review-only mode does not require local absolute paths or runnable configuration. If the agent cannot read current content, it must defer dependent comparisons.

## 5. Provide approved evidence

Select one chat, document or exported excerpt. Use an available connector or upload the selected evidence separately from the skill. State the permitted scope and what may be disclosed publicly. If history is truncated, have the agent record partial coverage. Account-wide discovery requires [separate authorization](../discovery.md) and suitable discovery tools.

## 6. Start the first review

Send:

> Use portfolio-editor with the portfolio content and editorial policy I provided. Read only [approved source]. Compare supported claims with the current content and produce a private review with include/defer/ignore decisions and public-safe draft copy. In Helper mode, run the helper and return its review files. In Review-only mode, return proposed batch JSON and milestone YAML only where applicable; describe speaking, writing or other changes as separate editorial proposals. Label validation and coverage accurately. Do not publish, create a PR or schedule anything.

## 7. Save and inspect the result

Helper mode should return REVIEW.md, PR-SUMMARY.md and supported proposed content. Review-only mode should return a clearly labelled private review, public-safe summary and applicable draft artifacts without claiming helper validation. Undated series or profile edits must not be forced into a dated milestone.

Save outputs privately before the session expires. For Review-only runs, retain the continuation ledger and prior decisions yourself and supply them next time; do not assume persistent checkpoints. No qualifying changes is a valid review result.

## 8. Continue to previews, PRs or recurring runs

Helper and Review-only modes do not produce a verified site preview or deliver a PR. Move the public-safe proposed changes to a [Codex](codex.md), [Claude Code](claude-code.md) or [Cursor](cursor.md) environment with Full capabilities, then revalidate against the current checkout using the [review workflow](../review.md). Keep private evidence outside the repository and preview.

Scheduling is a separate host capability. Only configure it after checking that a future run can access the installed instructions, approved sources and retained state. A reusable prompt, uploaded ZIP or successful interactive review does not prove an unattended run will work.
