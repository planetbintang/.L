# Planetbintang .L — Enterprise Menu Registry

The **Menu Registry** page adds a local-first catalog and menu builder based on the supplied Enterprise Map List.

## Included
- 20 architecture groups spanning core code management, planning, CI/CD, security, packages, insights, access control, settings, audit, billing, domain/DNS, hosting/IP, monitoring, CDN/WAF, content moderation, alerts/incidents, IAM, storage, metering, and marketplace.
- Seed entries for features actually enumerated in the specification, including DNS Zone Editor/Failover, IPAM, uptime/TLS monitoring, WAF, upload moderation, RBAC, object storage, billing metering, and developer API keys.
- Search across menu name, group, parent, route, and description; filters for architecture and active/inactive state.
- Add, edit, activate/deactivate, and delete entries; export/import JSON; restore the seed catalog.
- Responsive cards and safe DOM text rendering for user-entered values.

## Important implementation boundaries
- The source specification describes ranges up to 5,000 features, but does not enumerate 5,000 individual records. This implementation seeds only the features actually listed in that document; it does not claim 5,000 backend modules exist.
- Entries are catalog metadata, not live backend implementations. Adding a custom route does not create a server endpoint or automatically add a global navigation route.
- Data is stored in this browser's localStorage and is not synced to GitHub or other devices. Use JSON export for backup.
- Imported JSON is limited to 5 MiB and 10,000 entries; each entry must use one of the known architecture groups.
