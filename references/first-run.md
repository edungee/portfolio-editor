# First run

Use this guide when the user has no private configuration yet or requests onboarding.

## Check the installation

Locate this skill's directory from SKILL.md. Check Node.js >=22, npm, Git and tar. From that directory, install dependencies with `npm ci --ignore-scripts`. Run `npm run demo` if the user wants a demonstration without connecting private sources. The printed REVIEW.md is a synthetic example, not an assessment of their work. The fixture is not a running website.

## Check the portfolio before collecting evidence

Ask for the repository path if it is not already known. Inspect that repository only. It must have a committed Git baseline and `content/projects/<slug>.md` files whose frontmatter contains a matching slug, title and a quoted YYYY-MM-DD date. Existing milestones need unique lowercase/hyphen IDs, quoted dates, title, summary, kind and rationale. The current adapter appends milestones to existing project files; it cannot create projects or update an arbitrary CMS. See scripts/fixture.cjs for a minimal content example.

Check each selected project and existing milestone for compatibility, and whether the site actually renders milestones. If unsupported, explain the mismatch and stop the real review; offer the synthetic demo or a separately scoped adapter change. Do not rewrite the site merely to complete onboarding. For a preview, also check the site's dev command and installed dependencies, and require a clean tracked working tree. Preview is optional for the initial private report; state explicitly when it is unavailable.

## Create private inputs

Use information already provided, then ask only for missing project selections, exact approved source locators/scopes, and the private storage location. Do not infer authorization for an entire account. Identify the required local or connected read capability for each source; if unavailable, report that limitation and ask for an accessible approved source or mark coverage incomplete.

Copy examples/config.example.json to the selected private directory outside all Git repositories. Set absolute repository and state paths, selected project slugs, and a source registry containing stable IDs, project, kind, locator and bounded scope. Replace all example placeholders. Keep mode `private-dry-run`. Do not include credentials in config.

Copy examples/editorial-policy.example.md beside it. Help the user specify positioning, meaningful-change criteria, disclosure rules and tone; record the policy version in config.policyVersion. The agent reads the policy separately: no policy-path config field exists. Give the user both absolute paths for future runs. Store batches, policy, config and state outside Git and outside any served site directory.

## Run and deliver

Read the policy and references/editorial.md, collection.md and batch.md. Collect only the selected sources, preserving completeness and provenance. Build a private batch, then run the helper using absolute config and batch paths from the installed skill directory. Open the generated REVIEW.md and inspect the proposed files. Report included, deferred and ignored changes plus source gaps; no proposals is a valid result.

For meaningful changes on a compatible site, follow references/review.md to prepare and verify a combined preview. Never invent a preview URL or imply the synthetic fixture provides one. Deliver the private review path, public-safe PR summary, any verified preview link and limitations. Keep raw evidence private. This release does not create PRs, merge or deploy.

Only configure a scheduler when requested, using examples/schedule.md and the selected host's actual capabilities. Installation alone schedules nothing.
