# Batch contract v1
A JSON object with `version: 1`, `sources` and `candidates` arrays.

Each source: `id` from the private registry, `status` (ok, partial, error), `complete` boolean, `revision` stable content hash or upstream revision, `note` describing exact scope, and `evidence` containing text actually fetched. Successful sources require complete evidence. Keep a partial source's readable text but do not mark it complete.

Each candidate: stable `id`, `project` slug, `claim`, `sourceIds`, `decision` (include, defer, ignore), and `reason`. Set `existingMilestoneId` when the fact is already documented. Source IDs must belong to the project. Semantic duplicate detection is the agent's responsibility; stable IDs and existing milestone checks also protect reruns.

Include additionally requires `eventDate` (YYYY-MM-DD), `kind` (decision, implementation, learning, release, publication), `evidenceQuote` found verbatim in source text, `milestoneId`, `publicationCleared: true`, and `publicCopy` with title, summary, rationale and evidence. Set `verifiedPublicArtifact: true` for a release/publication only after actually verifying it. These attestations are editorial judgments, not proof manufactured by the script. If uncertain, defer. All proposals remain private even when these gates pass.

Config: version 1, mode private-dry-run, repository absolute path, stateDirectory outside the repository, policyVersion, projects array, sources array of {id, project, kind, locator, scope}. Private config is never committed.

This is the milestone helper contract, not the whole-portfolio candidate ledger. Optional config.discovery is interpreted by the host (see discovery.md), not crawled by the helper. Discovered milestone sources can enter an effective per-run registry within authorized scope. Other portfolio surfaces and mixed packages follow editorial-changes.md instead of being forced into batch v1.
