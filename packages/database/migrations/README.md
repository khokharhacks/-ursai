# Database migrations

Migrations are ordered, immutable SQL files. Apply them with a dedicated migration role; the
application runtime role must not own tables or have `BYPASSRLS`.

`0001_identity_and_tenants.sql` establishes the first identity and tenant boundary. Future changes
will add new numbered migrations and must not edit an already-applied migration.
