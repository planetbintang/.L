# MONITORING, BACKUP, RECOVERY & SECURITY

Metrik, log, alert, backup, restore, disaster recovery, vulnerability dan incident.

Semua komponen merupakan kontrak manual

- [Pemantauan Kesehatan](./health-monitor.reic) — `PB-OPERATIONS-01`, aksi `monitor.health`, tabel `service_health`.
- [Metrik dan Alert](./metrics-alerts.reic) — `PB-OPERATIONS-02`, aksi `monitor.alert`, tabel `alert_rules`.
- [Log Terpusat](./central-logging.reic) — `PB-OPERATIONS-03`, aksi `logging.ingest`, tabel `log_streams`.
- [Penjadwal Backup](./backup-scheduler.reic) — `PB-OPERATIONS-04`, aksi `backup.create`, tabel `backup_jobs`.
- [Pemulihan dan DR](./restore-drill.reic) — `PB-OPERATIONS-05`, aksi `recovery.restore`, tabel `recovery_drills`.
- [Postur Keamanan](./security-posture.reic) — `PB-OPERATIONS-06`, aksi `security.scan`, tabel `security_findings`.

Setiap kontrak memakai deny-by-default, isolasi tenant, audit, idempotency, server-side provider adapter, serta persetujuan Owner/SNAPS untuk operasi berisiko. Status kontrak tidak menyatakan layanan provider sudah aktif.
