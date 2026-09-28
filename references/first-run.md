# First run

Use this guide when the user has no private configuration yet or requests onboarding.

## Onboarding without a shell (Review-only)

Choose the mode before following the filesystem instructions below. In Review-only mode, ask only for missing current portfolio content (uploaded files or pasted text), approved source scope and editorial preferences. Do not require local paths, Git history, environment variables or config files. Accept the policy and source registry as inline structured text; obtain current content before claiming a change is new. Collect accessible evidence and return the mode-specific proposals, private review and public-safe summary described in modes.md. Configuration can be supplied as a draft for later helper use, with unresolved paths clearly marked; do not call it runnable or execute scripts. If a required source or current portfolio content is unavailable, state that limitation and defer dependent claims.

In Helper mode, follow modes.md to create a disclosed throwaway Git snapshot from uploaded content and keep session-private config/state outside it. In Full mode, use the real checkout. The remaining instructions apply to Helper and Full only.

## Check the installation

Locate this skill's directory from SKILL.md and choose a mode with modes.md. For Helper or Full mode check Node.js >=22 and Git (plus tar for previews). No dependency install is needed. Run `npm run demo` (or `node scripts/demo.cjs`) if the user wants a demonstration without connecting private sources. The printed REVIEW.md is a synthetic example, not an assessment of their work. The fixture is not a running website.

## Check the portfolio before collecting evidence

Ask for the repository path if it is not already known. Inspect that repository only. For the milestone helper, it must have a committed Git baseline and `content/projects/<slug>.md` files whose frontmatter contains a matching slug, title and a quoted YYYY-MM-DD date. Existing milestones need unique lowercase/hyphen IDs, quoted dates, title, summary, kind and rationale. The scripted adapter appends milestones to existing project files; new projects and other repository-backed changes use editorial-changes.md. An arbitrary CMS is not supported. See scripts/fixture.cjs for a minimal content example.

Check each selected project and existing milestone for compatibility, and whether the site actually renders milestones. If the milestone adapter is unsupported, use references/editorial-changes.md for repository-backed edits within the user’s scope. If the host cannot safely edit that site, retain proposals privately and explain the limitation. Do not rewrite the site merely to complete onboarding. For a preview, also check the site's dev command and installed dependencies, and require a clean tracked working tree. Preview is optional for the initial private report; state explicitly when it is unavailable.

## Create private inputs

Use information already provided, then ask only for missing project selections, exact approved source locators/scopes, and the private storage location. Do not infer authorization for an entire account. If the user explicitly requests all accessible chats and Notion documents, record config.discovery and follow discovery.md; do not require them to name every document. Identify the required local or connected read capability for each source; if unavailable, report that limitation and ask for an accessible approved source or mark coverage incomplete.

Copy examples/config.example.json to the selected private directory outside all Git repositories. Set absolute repository and state paths, selected project slugs, and a source registry containing stable IDs, project, kind, locator and bounded scope. Replace all example placeholders. Keep mode `private-dry-run`. Do not include credentials in config.

Copy examples/editorial-policy.example.md beside it. Help the user specify positioning, meaningful-change criteria, disclosure rules and tone; record the policy version in config.policyVersion. The agent reads the policy separately: no policy-path config field exists. Give the user both absolute paths for future runs. Store batches, policy, config and state outside Git and outside any served site directory.

## Run and deliver

Read the policy and references/editorial.md, collection.md and batch.md. Collect the authorized scope (selected sources or opted-in account-wide discovery), preserving completeness and provenance. Build a private batch, then run the helper using absolute config and batch paths from the installed skill directory. Open the generated REVIEW.md and inspect the proposed files. Report included, deferred and ignored changes plus source gaps; no proposals is a valid result.

For meaningful changes on a compatible site, follow references/review.md to prepare and verify a combined preview. Never invent a preview URL or imply the synthetic fixture provides one. Deliver the private review path, public-safe PR summary, any verified preview link and limitations. Keep raw evidence private. Draft PR delivery requires explicit opt-in under references/delivery.md; never merge or deploy automatically.

Only configure a scheduler when requested, using examples/schedule.md and the selected host's actual capabilities. Installation alone schedules nothing.
