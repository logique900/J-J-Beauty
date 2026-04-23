# Security Specification

## Data Invariants
1. Users can only read and write their own profile and address data.
2. Only Admins can modify other users' profiles, and only Admins can read the full list of users.
3. Users cannot elevate their own role to 'admin' (this is checked upon create and update).
4. Products, Categories, and Brands are readable by everyone, but can only be created/updated/deleted by Admins.
5. Orders can only be created by the user ordering it. Users can read their own orders. Only Admins can list all orders or update order states (e.g. tracking, shipments).
6. IDs must be valid alphanumeric sequences (no massive sizes or junk).
7. Timestamps must be valid server timestamps where created.

## 12 "Dirty Dozen" Payloads (Examples to Reject)
1. **User Role Spoofing (Create)**: Creating a new user with `role: "admin"`.
2. **User Role Spoofing (Update)**: Standard user updating their own profile adding `role: "admin"`.
3. **Ghost Field Update**: Updating a user with unapproved keys like `isVerified: true`.
4. **ID Poisoning**: Attempting to read or write a document with an ID that is > 128 characters or contains invalid characters.
5. **Cross-User Modification**: User A attempts to update User B's profile.
6. **Cross-User Order Creation**: User A attempts to create an order where `userId` is User B's ID.
7. **Order Status Tampering**: Customer trying to update their own order status to `shipped`.
8. **Product Tampering**: Non-admin attempting to change a product price.
9. **Admin Modification Bypass**: Non-admin attempting to delete a product.
10. **Denial of Wallet**: Creating a product with an images array containing 1,000 items.
11. **Type Spoofing**: Setting `totalAmount` in an order to a massive String instead of a number.
12. **Missing Invariants**: Creating an address without a `zip` code, violating strict schema bounds.

## Test Runner
A test file `firestore.rules.test.ts` will strictly enforce these rules.
