# BINTANG Global News

BINTANG News aggregates public RSS/Atom feeds from a curated set of international and Indonesian publishers.

## Pipeline
- Source registry: `bintang/news/sources.json`
- Ingestion: `scripts/ingest-bintang-news.py`
- Published index: `bintang/news/news-index.json`
- Schedule: every 30 minutes through `.github/workflows/bintang-news-ingestion.yml`

The ingestion process stores publisher titles, canonical links, timestamps, source names, categories, and short feed-provided summaries. It does not scrape or republish full copyrighted articles. BINTANG's internal reader displays available feed content and attribution without automatically navigating to the publisher's domain. Full text is shown only when a publisher supplies it through an authorized feed/API integration.

Add feeds only when their terms and robots/publisher policies permit automated indexing. Monitor feed failures and remove discontinued or restricted sources.
