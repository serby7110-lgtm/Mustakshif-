# Security Specification for Firestore Rules

## 1. Data Invariants
1. **User Data Isolation**: Only authenticated users (`request.auth.uid == userId`) may read or write their own profile and subcollections (`/users/{userId}/**`).
2. **Strict Identity**: Document writes must ensure `uid` matches `request.auth.uid`.
3. **No Cross-User Access**: Users cannot read, query, or delete another user's bookmarks, reading progress, or creative notes.
4. **Safe Lengths & Boundaries**: String fields must be length-constrained (<= 128 for IDs, <= 100 for titles, <= 2000 for content).

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Read**: Attempting to read `/users/user123` with `request.auth == null` -> DENIED.
2. **Cross-User Profile Read**: User A (`auth.uid == 'user_a'`) reading `/users/user_b` -> DENIED.
3. **Cross-User Bookmark Write**: User A writing to `/users/user_b/bookmarks/bm1` -> DENIED.
4. **Identity Spoofing in Profile**: User A writing profile with `uid: 'user_b'` -> DENIED.
5. **Junk Character ID Injection**: Writing to `/users/user_a/bookmarks/../../../evil` -> DENIED.
6. **Oversized String Attack**: Writing a title exceeding 100 characters in creative notes -> DENIED.
7. **Oversized Note Content**: Writing note content exceeding 2000 characters -> DENIED.
8. **Unauthenticated List**: Querying `/users` without authentication -> DENIED.
9. **Cross-User List**: User A listing `/users/user_b/bookmarks` -> DENIED.
10. **Shadow Key Injection**: Injecting arbitrary ghost fields (e.g. `role: 'admin'`, `isSuperuser: true`) into userProfile -> DENIED.
11. **Type Poisoning**: Sending `chapterIndex: "not-a-number"` in reading progress -> DENIED.
12. **Root Catch-All Bypass**: Attempting to write to arbitrary collection `/system_secrets/keys` -> DENIED.
