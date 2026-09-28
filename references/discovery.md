# Account-wide discovery (opt-in)

A source registry is a set of known sources, not an exhaustive discovery boundary when the user explicitly authorizes account-wide discovery. Record that authorization privately under config.discovery with mode `all-accessible`, providers, authorization date and exclusions. Without this authorization, keep the selected-source scope. Authorization to read does not authorize publishing source text.

Discover all chats/tasks and Notion documents visible to the connected host, including new projects, archived conversations where supported, private/shared pages and accessible databases. Use provider inventory/list/search APIs before filtering for portfolio relevance; a keyword search or recent-page list alone is not an exhaustive inventory. The available API may not expose every item. Never claim access to all account content merely because a few reads work, and never scan local chat databases, credentials or unrelated filesystem locations to work around connector limits.

## Durable discovery state

Maintain `state/discovery-state.json` outside Git. For each provider retain scope, enumeration method, inventory cursor, inventoryComplete, inventory limitations, lastSuccessfulScan, and a queue of stable resource IDs. Per resource retain revision, lastSuccessfulRead, continuation cursor, status, candidate IDs and exclusion reason when applicable. Treat titles, summaries and assistant text as routing hints, not proof of a completed achievement. Exclusions must be explicit, not silently inferred from absence in the old registry.

On first adoption, inventory the accessible surface and enqueue a historical backfill. Process new/changed resources using an overlapping lookback, then spend remaining budget on the oldest unfinished backfill so old content is not starved. Deduplicate resource IDs and semantic claims across Notion and chats. For a missed run resume from successful provider/resource checkpoints; never assume a scheduled run occurred.

Bound each run with private config budgets (default 20 task-history pages and 20 Notion content pages, plus 10 inventory pages per provider). These are work budgets, not permission to drop remaining sources. Persist every continuation and queue item. If a host only supplies a limited recent-task listing, record `inventoryComplete: false` and the visible window; do not invent a cursor or report full account coverage. Report new actionable access gaps once and leave unchanged backlog quiet.

Notion: respect the connection's access result, enumerate using supported APIs, fetch page blocks and database content with pagination, and record unread/unsupported blocks or attachments. Chats: use supported live and archive inventories, then read user/assistant messages with pagination; filter binary images and tool outputs before saving evidence. Missing bodies or material attachments mean partial. Stop after two transient attempts and immediately on authentication/permission denial; do not switch access methods to evade a denial.

A resource checkpoint advances only after the intended read interval is complete. Inventory and content completeness are separate. Every private review records discovered/read/pending/error counts, available time window and provider limitations. Publish independently verified candidates while leaving unrelated coverage partial; do not imply exhaustive review. No-change is not evidence that every source was examined.

## Route evidence to changes

Keep a private candidate ledger for ALL relevant developments, including new projects, speaking/series, writing, positioning and existing milestones. Record stable claim ID, source IDs/revisions, evidence, affected surface, include/defer/ignore, rationale and disclosure decision. `Considered` is not `implemented`: accepted but undelivered items remain pending until mapped to a verified PR head or current default-branch content. A complete run accounts for every included candidate in the combined patch or explicitly defers it with a reason.

For existing project milestones, generate an effective per-run registry/config containing the discovered supporting sources and exact project mappings, then use batch v1. This is allowed only within the authorized discovery scope; keep the original known Git-source scopes. Do not force new projects or speaking claims into an unrelated registered project. Route other edits through editorial-changes.md. Public copy must not contain raw chat text, private URLs, IDs or source notes. A broad discovery grant is not blanket disclosure clearance.
