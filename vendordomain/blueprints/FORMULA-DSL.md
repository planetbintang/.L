# REIC Formula DSL — Review and Runtime Contract

This document defines the implementation boundary for the 51 blueprint sheets.
## Token model
- Bit values are unsigned 8-bit vectors (0b00000000 through 0b11111111).
- ∧, ∨, ⊕, ¬, ≡, → map to AND, OR, XOR, NOT, equivalence, and implication.
- Addition is unsigned and wrapped by mod 2^8.
- A parser must reject unknown operators, malformed literals, undefined identifiers, overflows not explicitly wrapped, and excessive expression depth.
## Evaluation order
1. Parse source and verify format_version.
2. Validate the document against reic-blueprint.schema.json.
3. Resolve trusted inputs from server-side context; never trust browser-supplied role or approval flags.
4. Evaluate expressions as pure functions in a resource-limited sandbox.
5. Apply SNAPS policy and tenant-scoped RBAC.
6. Require an Owner-signed approval token for privileged, destructive, billable, or externally visible operations.
7. Execute only a registered provider adapter; enforce idempotency and timeout.
8. Persist append-only audit evidence and emit a versioned event.
## Owner approval envelope
An implementation should bind approval to blueprint_id, exact artifact hash, operation, target resource, tenant, expiry, nonce, and policy version. Any changed field invalidates approval. Approval is not a reusable bearer permission.
## Extension pipeline
.reic = declarative contract → .json = schema/manifest → .js = parser/controller/adapter → .sql = durable state → .yaml = CI/CD → .html + .css = owner console → .md = human review and evidence.
## Non-goals
The formulas are not machine code and cannot directly provision infrastructure. This contract does not provide a registrar, payment gateway, cloud provider credentials, or production runtime. Such integrations must be separately implemented and tested.
