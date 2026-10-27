# DNS records for planetbintang.com on GitHub Pages

Configure these at the authoritative DNS provider after adding the custom domain in GitHub Pages.

## Apex domain
Create four `A` records:
| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Optional IPv6: use all four official GitHub Pages `AAAA` values only if IPv6 is intended:
- 2606:50c0:8000::153
- 2606:50c0:8001::153
- 2606:50c0:8002::153
- 2606:50c0:8003::153

## www
| Type | Name | Value |
|---|---|---|
| CNAME | www | planetbintang.github.io |

Remove conflicting old records only after confirming they do not serve another active service. Do not create wildcard records.

## Email
Do not alter MX/SPF/DKIM/DMARC until the email provider is known. These records are independent of the website's A/CNAME records.

DNS changes can take up to 24 hours. Source: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
