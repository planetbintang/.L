# REIC .NZ domain import

This is the controlled import boundary for domain records exported from the REIC .NZ data system.

## Input
Place one JSON object per line in `bintang/news/reic-domain-import.jsonl`:
```json
{"domain":"example.com","kind":"news","country":"ID","language":"id","category":"Nasional","feed_url":"https://example.com/rss.xml","source":"REIC .NZ"}
```

Required: `domain`. Optional: `kind`, `country`, `language`, `category`, `feed_url`, `source`.

The importer normalizes domains, rejects malformed hosts and non-HTTP(S) feed URLs, deduplicates by domain, and marks entries as pending verification. A domain is not counted as a verified news publisher merely because it exists in the imported dataset. Feed availability and publisher relevance must be checked before it enters the active news feed list.

## Scale and honesty
The 450,000,000 value is a target coverage objective, not a measured current count. The public repository stores only a bounded, reviewed working index; it is not suitable for committing hundreds of millions of records. Large-scale imports should be processed in partitioned object storage / database infrastructure and expose aggregate counts plus paginated query APIs to BINTANG.

## Connect REIC .NZ
Export batches from REIC .NZ in the JSONL schema above and place them in this import path, or connect an authenticated export endpoint through a secured backend. Do not put API keys or credentials in this public repository.
