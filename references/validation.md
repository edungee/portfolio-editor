# Installation validation

Checked 25 September 2026 with skills CLI 1.7.0.

## Verified

- Installed the public GitHub repository at baseline commit `1231acf` into an isolated macOS project using `skills add edungee/portfolio-editor --skill portfolio-editor --agent codex -y`. The CLI discovered one skill and copied it to `.agents/skills/portfolio-editor`.
- Confirmed scripts, references, examples, package.json and package-lock.json were included. The installer did not install npm dependencies.
- Ran all 17 helper tests and the synthetic demo from that installed copy with Node.js 24.13.1. The first demo run created one proposal; replay suppressed repeat notification.
- Repeated installation from the revised local package in a separate isolated project. Ran the documented `npm ci --ignore-scripts`, `npm test` and `npm run demo` sequence with Node.js 24.13.1; all 17 tests passed. Inspected the generated review and proposal.
- The original GitHub Actions run passed on Ubuntu with Node.js 22 and 24. Each pull request runs the same tests and demo again.
- Skill frontmatter validation passed. Installation checks used disabled telemetry; they do not establish a skills.sh listing.

## Not established by these checks

The `--agent codex` install target was exercised, not an autonomous first-use conversation on every agent. Claude Code, Cursor, Windows and other hosts have not been validated. The synthetic demo does not test live connectors, real editorial judgments, unattended schedules or a running website. Preview snapshot and URL safeguards have helper tests; each real site's preview still needs its own verification. Draft PR delivery requires host integration; see delivery.md. Local Git tests exercise disabled mode, modified proposals, stale previews, moved base branches, exact file scope, retries and remote-edit refusal.

## Reproduce

In a disposable project, run the README install command with `--agent codex`, then run the dependency setup, tests and demo inside the directory printed by the installer. Read the generated REVIEW.md and proposed Markdown. For an unreleased change, use a local checkout path as the install source instead of the GitHub shorthand. Source credentials and private configuration are unnecessary for this synthetic check.
