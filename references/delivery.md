# Optional draft PR delivery

The batch helper still generates private proposals. Delivery is a separate opt-in stage: enable `delivery.mode: draft-pr`, `delivery.repository: owner/repo` and `delivery.baseBranch: main` in private config only with the user's authorization. Git SSH push access and an authenticated host tool for GitHub PR creation are required. The helper uses Git; the agent host owns PR API calls, check reporting and scheduling. No automatic merge, release or deployment.

## Before collection

Query open PRs in the target repository, including pagination. Recognize only PRs created by this workflow by their `codex/portfolio-editor-` head and `<!-- portfolio-editor -->` body marker. If one is pending, retain it: verify its stored head, recheck its preview, update its description/check status if needed, and keep new candidates private until it is merged or closed. Do not replace reviewer's edits or accumulate competing content PRs. Closed unmerged proposals are rejected, not permission to reopen; remember their claim IDs privately until explicitly reconsidered. Uncertain PR lookup blocks delivery.

Use a clean isolated checkout of the current remote default branch for comparison and proposal generation. Do not reset the user's working checkout. Keep configuration, batches and state outside Git. Generate an effective private config pointing `repository` to this fresh baseline while preserving the source registry and stateDirectory. Install the portfolio dependencies in the isolated checkout, or reuse an existing installation only when dependency manifests match. The registered Git source paths are not permission to pull/reset those source repositories.

## Prepare and validate

1. Run the batch helper against the fresh baseline. No accepted proposals means no new PR or preview. An unchanged but never-delivered accepted proposal may still need delivery; do not equate report.notify=false with successful prior delivery.
2. Prepare and verify one combined preview with preview.cjs; inspect the changed pages. A localhost URL works only on the same computer. Prefer a verified temporary HTTPS tunnel for the PR; report its limited lifetime. Keep private evidence outside the served root.
3. Run `node scripts/delivery.cjs prepare CONFIG REPORT`. It requires opt-in, verified recent matching preview hashes and an unchanged remote base. It copies only proposed project Markdown into a separate delivery checkout, commits it and writes delivery.json privately. It never stages the input batch or private reports.
4. Run appropriate checks in the delivery checkout, separate from the live dev server. For a website use its normal production build; retain results and any known warnings privately. A failed required check blocks pushing. Review the exact diff and PR-SUMMARY.md for disclosure.
5. Reverify the preview immediately before delivery, then run `node scripts/delivery.cjs push CONFIG REPORT`. It verifies the base, committed file allowlist and hashes, and refuses remote branch changes. Never force-push. A moved default branch means regenerate and preview against the new baseline.

The helper serializes delivery operations with delivery.lock. Do not remove a lock without checking its recorded PID. The host must coordinate the overall collection/preview/PR flow too.

## Create or recover the draft PR

Search again for an existing PR by the exact head branch before creation (including closed PRs); on an ambiguous create response, repeat the lookup, not the create. If absent, use the host GitHub create-pull-request tool with draft=true, the configured repository/base, delivery.json's branch and a body containing the marker, public change summary, actual validation results, preview URL and affected-page links. Never post REVIEW.md or private source notes. Record PR URL/number, contentId, head SHA and last notification fingerprint in a private delivery-state.json before notifying. Attach the PR to the current task when the host supports it.

Fetch the resulting PR and verify draft status, head, base and changed files. Report CI for that exact head: pending, failed and unavailable are distinct from passed. Do not merge or mark ready automatically. Keep the draft if its temporary preview expires; mark the preview unavailable in its body and only replace it with a URL verified against the same snapshot. Do not post duplicate comments for unchanged status.

Authentication/permission failures stop delivery and are actionable once. Persist the blocked phase in delivery-state.json; do not repeat unchanged denied calls on every schedule. Resume only after the user confirms access was repaired. Do not switch credentials or access methods to evade a denial. Git push success does not prove PR-write access. A pushed branch without a PR is an incomplete delivery; persist it for recovery. No-change scheduled runs remain quiet unless a pending failure meaningfully changes.
