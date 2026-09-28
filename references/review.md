# Review package and preview
Every run writes REVIEW.md (private explanation and before/after wording) and PR-SUMMARY.md (only cleared public wording). Proposed Markdown and baseline versions live alongside the run report. Do not copy private source notes or the whole review into a public PR.

For a meaningful proposal, prepare one combined site snapshot:
`node scripts/preview.cjs prepare CONFIG REPORT`
It pins the baseline commit, rejects tracked local edits or changed proposals, archives committed site files into the private run's site-preview directory and overlays all accepted project changes. Private batch inputs, reports and state are outside the server root. node_modules is shared; .next is isolated. Do not build in an active preview directory.

Start Next from the returned directory with a free dedicated port, bound to 127.0.0.1. Use the host's background process facility and retain its process/session ID. Then run:
`node scripts/preview.cjs verify CONFIG REPORT http://127.0.0.1:PORT`
The helper checks snapshot identity and the homepage, project listing and affected project/history routes. Inspect affected pages visually before saying the visual review passed.

When a shareable preview is requested, start an available temporary Cloudflare tunnel to this server, retain its process/session ID, and verify the returned HTTPS origin with the same command. Never reuse an old tunnel URL without checking it. If the tunnel cannot start, report that clearly and provide the working local link. Temporary links require the computer, dev server and tunnel to remain running; do not promise permanent hosting.

Notification: summarize proposed additions by project and why they matter, link the private REVIEW.md and verified combined preview, give direct affected-page links, validation status, and PR link when implemented. Explain baseline-only previews when no changes qualify. No-change scheduled runs should not start servers or send routine notifications. Notify a new actionable preview failure without claiming a working URL.

A verified preview is evidence of HTTP availability and snapshot identity, not a successful production build or a permanent guarantee. Recheck immediately before sending. Changing proposals requires a fresh prepared snapshot and verification. Stop only processes owned by that preview when retiring it; never stop unrelated dev servers.

For explicitly enabled draft PR delivery, follow references/delivery.md. Generate the PR from these exact proposed file hashes and baseline; regenerate review and preview if they change. Public previews contain only publication-cleared content; private evidence remains in the separate review report.
