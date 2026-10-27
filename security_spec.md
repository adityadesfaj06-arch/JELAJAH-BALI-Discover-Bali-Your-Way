# JELAJAH BALI — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Default-Deny Global Catch-All**: Every path not explicitly matched is denied (`allow read, write: if false;`).
2. **Verified Identity**: Write operations require an authenticated user with `request.auth != null && request.auth.token.email_verified == true`.
3. **Strict Ownership (`userId` / `uid`)**:
   - A `UserProfile` at `/users/{userId}` can only be read, created, updated, or deleted if `request.auth.uid == userId` and `incoming().uid == request.auth.uid`.
   - A `SavedPlace` at `/savedPlaces/{savedPlaceId}` can only be read, listed, created, updated, or deleted by its owner (`resource.data.userId == request.auth.uid`), with `isValidId(savedPlaceId)` enforced on single-doc operations.
   - A `Trip` at `/trips/{tripId}` can only be modified or deleted by its owner (`resource.data.userId == request.auth.uid`). It can be read by its owner or when `resource.data.visibility == 'shared'`. Once `status == 'archived'` (terminal state), non-admin updates are blocked.
   - An `EmergencyContact` at `/emergencyContacts/{contactId}` contains sensitive PII (`phone`) and is strictly isolated to `resource.data.userId == request.auth.uid`.
4. **Temporal & Immutable Integrity**:
   - `createdAt` must equal `request.time` on creation and remain immutable (`incoming().createdAt == existing().createdAt`) on updates.
   - `updatedAt` must equal `request.time` on both creation and updates.
   - Ownership fields (`uid`, `userId`) are immutable across all updates.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Unauthenticated Write**: Creating a `/trips/trip_1` with `auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Creating a `/users/user_1` where `auth.token.email_verified == false` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection**: Updating `/trips/trip_1` with an extra undeclared field `{"isVerifiedAdmin": true}` -> `PERMISSION_DENIED` via `hasOnly()`.
4. **Identity Spoofing on Create**: Creating `/savedPlaces/sp_1` with `userId: "victim_uid"` while authenticated as `"attacker_uid"` -> `PERMISSION_DENIED`.
5. **Ownership Hijack on Update**: Updating `/trips/trip_1` to change `userId` from `"user_1"` to `"user_2"` -> `PERMISSION_DENIED`.
6. **ID Poisoning Attack**: Creating `/savedPlaces/invalid$id!with*spaces` -> `PERMISSION_DENIED` via `isValidId()`.
7. **Denial-of-Wallet Oversized String**: Creating `/trips/trip_1` with a 5,000-character `tripName` (exceeding `maxLength: 120`) -> `PERMISSION_DENIED`.
8. **Timestamp Forgery**: Creating `/trips/trip_1` with a backdated `createdAt` instead of `request.time` -> `PERMISSION_DENIED`.
9. **Immortal Field Mutation**: Updating `/users/user_1` with a modified `createdAt` timestamp -> `PERMISSION_DENIED`.
10. **PII Blanket Read**: Authenticated `"user_2"` attempting `get` or `list` on `/emergencyContacts/ec_user_1` -> `PERMISSION_DENIED`.
11. **Terminal State Bypass**: Updating `/trips/trip_1` after its `status` has reached `'archived'` -> `PERMISSION_DENIED`.
12. **Value Poisoning on Whitelisted Key**: Updating `/trips/trip_1` field `travelers` with a string `"four"` instead of an integer `1..50` -> `PERMISSION_DENIED` because `isValidTrip(incoming())` wraps the entire `allow update` block.
