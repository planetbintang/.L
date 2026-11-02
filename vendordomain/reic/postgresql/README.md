# POSTGRESQL & DATA SYNCHRONIZATION

Koneksi PostgreSQL, migrasi, transaksi, replikasi, sinkronisasi dan retensi data.

Semua komponen merupakan kontrak manual

- [Koneksi PostgreSQL](./postgres-connection.reic) — `PB-POSTGRESQL-01`, aksi `database.connect`, tabel `database_connections`.
- [Migrasi Skema](./schema-migrations.reic) — `PB-POSTGRESQL-02`, aksi `database.migrate`, tabel `schema_migrations`.
- [Manajer Transaksi](./transaction-manager.reic) — `PB-POSTGRESQL-03`, aksi `database.transaction`, tabel `transactions`.
- [Replikasi Data](./data-replication.reic) — `PB-POSTGRESQL-04`, aksi `database.replica`, tabel `replication_targets`.
- [Mesin Sinkronisasi](./sync-engine.reic) — `PB-POSTGRESQL-05`, aksi `data.sync`, tabel `sync_jobs`.
- [Retensi dan Privasi](./retention-privacy.reic) — `PB-POSTGRESQL-06`, aksi `data.retention`, tabel `data_policies`.

Setiap kontrak memakai deny-by-default, isolasi tenant, audit, idempotency, server-side provider adapter, serta persetujuan Owner/SNAPS untuk operasi berisiko. Status kontrak tidak menyatakan layanan provider sudah aktif.
