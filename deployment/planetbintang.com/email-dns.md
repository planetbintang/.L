# Email DNS setup

Email provider is not specified yet. Do not invent MX, SPF, DKIM, or DMARC values; incorrect records can interrupt mail delivery.

When a provider is selected, copy its exact records from its administration panel:
- MX hostnames and priorities
- SPF TXT record (merge with existing authorized senders; keep only one SPF record)
- DKIM selector and TXT/CNAME target
- DMARC TXT policy and reporting mailbox

Keep website A/CNAME records separate from email records. Verify sending, receiving, and account recovery before changing production DNS.
