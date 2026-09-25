# Contributing

Run npm ci, npm test and npm run demo before proposing a change. Add behavioral tests for changed evidence, privacy, duplicate detection and preview boundaries. Use synthetic fixtures only; never submit real chat exports, source IDs, credentials or run reports.

Keep workflow instructions, processing helpers and host adapters separate. Describe supported behavior and limitations accurately. New source integrations must explain authorization, pagination, truncation and failure behavior. New delivery integrations need idempotency, snapshot consistency and an explicit disclosure boundary.

Open an issue or pull request in the repository hosting your copy. Contributions are provided under the project's Apache 2.0 license. Review security-sensitive changes privately first; see SECURITY.md.
