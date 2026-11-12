# AIREBER AI Production — deployment and operations

## Production modules

- AI Production Workspace: website, web application, chat assistant, and agent/workflow briefs.
- Member registry: registration, login, profile, account status, and administrator role.
- Quota enforcement: one AI request consumes one monthly request unit; the server enforces the limit before model execution.
- Monitoring: per-member usage history and administrator-wide quota overview.
- File Manager: user-owned AIREBER files remain isolated by account ID.

## Required deployment steps

1. Deploy the `aireber/` application on Netlify with Netlify Database enabled. GitHub Pages is static hosting and cannot run the account or AI server routes.
2. Apply the new migration at `netlify/database/migrations/20261112130000_aireber_production_quota/migration.sql` after the account-registry migration.
3. Set `AIREBER_ADMIN_EMAILS` to a comma-separated list of administrator email addresses **before those addresses register**. Do not put credentials in Git.
4. Configure at least one model provider secret on the Netlify site, such as `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`.
5. Confirm the deployed `/api/account?action=health` endpoint and sign in before enabling member production access.

## Membership tiers currently seeded

| Plan | Monthly requests | Indicative monthly price |
|---|---:|---:|
| Free | 30 | Rp0 |
| Creator | 500 | Rp99.000 |
| Pro | 3.000 | Rp299.000 |
| Enterprise | 30.000 | Contact / custom |

Prices are initial product configuration values. Update the plan seed and account UI together before public launch.

## Payment and revenue status

Membership tiers, member assignment, quota accounting, and estimated package value are implemented. **Automatic payment collection is not enabled yet.** No payment provider or merchant credentials have been configured. Before charging members, select a provider (for example Midtrans or Xendit), configure its server-side secrets and webhook URL, and add verified payment-status reconciliation. The administrator revenue figure is an estimate based on assigned plans, not settled transactions.

## Security notes

- Passwords are hashed server-side using PBKDF2; session tokens are stored hashed in the database.
- The AI server endpoint requires a valid AIREBER session cookie and checks quota server-side.
- Admin access is granted only to emails listed in `AIREBER_ADMIN_EMAILS` at registration time.
- Do not expose model keys, database credentials, or payment secrets in client-side code.
