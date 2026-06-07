# Security Spec

## Data Invariants
- A student document must contain `userId` matching the authenticated user.
- The `id`, `name`, `className`, `score`, `performance`, `status` must be present.
- A user can only read, create, update, and delete their own students.

## Dirty Dozen Payloads (Conceptual)
1. Missing `userId`
2. `userId` doesn't match `request.auth.uid`.
3. Score is string instead of number.
4. List query bypassing `userId == request.auth.uid`.
5. Missing `createdAt`.
6. Modifying `createdAt` during update.

... etc
