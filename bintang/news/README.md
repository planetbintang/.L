# BINTANG Global News + REIC .NZ

BINTANG is the public news-view layer for a curated set of publisher RSS/Atom feeds and REIC .NZ imported news-domain feed candidates.

## Data flow

1. Append REIC domain records to `bintang/news/reic-domain-import.jsonl`, one JSON object per line.
2. `scripts/import-reic-news-domains.py` validates domains and feed URLs, de-duplicates by domain, and preserves verification history.
3. `scripts/ingest-bintang-news.py` reads curated feeds from `sources.json`, then checks up to 20 imported REIC news feeds per run.
4. Successful feed fetches are marked `verified-feed`; failed checks are marked `feed-unavailable` with a timestamp and short error.
5. The published JSON files are consumed by `bintang/index.html` in the Global News section.

Example import record:

```json
{"domain":"example.com","kind":"news","country":"ID","language":"id","category":"Nasional","feed_url":"https://example.com/rss.xml","source":"REIC .NZ"}
```

## Public index and workflow

- Curated source list: `bintang/news/sources.json`
- REIC import queue: `bintang/news/reic-domain-import.jsonl`
- REIC status registry: `bintang/news/reic-domain-registry.json`
- Published news metadata: `bintang/news/news-index.json`
- Ingestion code: `scripts/ingest-bintang-news.py`
- Registry importer: `scripts/import-reic-news-domains.py`
- Workflow: `.github/workflows/bintang-news-ingestion.yml`
- Schedule: every 30 minutes; manual run is also available in GitHub Actions.

The workflow validates both JSON outputs before committing the refreshed registry and news index to branch `io`. BINTANG shows the target catalogue capacity, imported-domain count, candidate news feeds, verified feeds, pending reviews, and indexed stories separately.

## Scale and accuracy

`450,000,000` is the requested REIC .NZ target capacity, not a measured count of imported or verified news sites. The current repository contains only the records actually supplied in the import JSONL file; an empty import file correctly produces zero imported domains. A 450-million-domain production catalogue requires a real upstream REIC export/API and scalable external storage or partitioned indexes. A static GitHub Pages JSON file is not a suitable database for hundreds of millions of records.

The current workflow tests a maximum of 20 REIC feed candidates per run to keep scheduled jobs bounded. Increase throughput only after providing the real source export and a storage/sharding design. The homepage never treats an unverified domain as a working news source.

## Content and publisher policy

The index stores publisher-provided titles, canonical links, timestamps, source names, categories, languages, and short feed summaries. It does not bypass paywalls or republish full copyrighted articles. The internal reader attributes the publisher and offers a direct link to the original article. Check each publisher's terms, robots policy, and syndication permissions before importing a feed.
