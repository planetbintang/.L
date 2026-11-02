# IDENTITY & MULTI-USER ACCESS

Identitas pengguna, autentikasi, sesi, tenant, RBAC, MFA dan audit akses.

Semua komponen merupakan kontrak manual

- [Registri Pengguna](./user-registry.reic) — `PB-IDENTITY-01`, aksi `user.create`, tabel `users`.
- [Autentikasi](./authentication.reic) — `PB-IDENTITY-02`, aksi `auth.authenticate`, tabel `users`.
- [Manajemen Sesi](./session-management.reic) — `PB-IDENTITY-03`, aksi `session.revoke`, tabel `sessions`.
- [Keanggotaan Tenant](./tenant-membership.reic) — `PB-IDENTITY-04`, aksi `membership.manage`, tabel `tenant_memberships`.
- [Peran dan Izin](./role-permission.reic) — `PB-IDENTITY-05`, aksi `access.evaluate`, tabel `role_permissions`.
- [MFA dan Pemulihan](./mfa-recovery.reic) — `PB-IDENTITY-06`, aksi `mfa.verify`, tabel `auth_factors`.

Setiap kontrak memakai deny-by-default, isolasi tenant, audit, idempotency, server-side provider adapter, serta persetujuan Owner/SNAPS untuk operasi berisiko. Status kontrak tidak menyatakan layanan provider sudah aktif.
