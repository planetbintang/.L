#!/usr/bin/env python3
"""Validate REIC .NZ import batches while preserving feed verification history."""
import json, re
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parents[1]
INPUT=ROOT/"bintang/news/reic-domain-import.jsonl"
OUTPUT=ROOT/"bintang/news/reic-domain-registry.json"
TARGET=450_000_000
HOST=re.compile(r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$",re.I)

def valid_feed(value):
    if not value: return ""
    p=urlparse(str(value))
    return str(value) if p.scheme in ("http","https") and p.netloc else ""

def main():
    previous={}
    if OUTPUT.exists():
        try:
            previous={x["domain"]:x for x in json.loads(OUTPUT.read_text(encoding="utf-8")).get("domains",[]) if x.get("domain")}
        except Exception:
            previous={}
    records={}
    if INPUT.exists():
        for line in INPUT.read_text(encoding="utf-8").splitlines():
            if not line.strip() or line.lstrip().startswith("#"): continue
            try: item=json.loads(line)
            except Exception: continue
            domain=str(item.get("domain","")).strip().lower().rstrip(".")
            if not HOST.fullmatch(domain): continue
            old=records.get(domain) or previous.get(domain,{})
            feed=valid_feed(item.get("feed_url","")) or old.get("feedUrl","")
            records[domain]={
                "domain":domain,
                "kind":str(item.get("kind",old.get("kind","unknown")))[:40],
                "country":str(item.get("country",old.get("country","")))[:8].upper(),
                "language":str(item.get("language",old.get("language","")))[:16].lower(),
                "category":str(item.get("category",old.get("category","Unclassified")))[:80],
                "feedUrl":feed,
                "source":str(item.get("source",old.get("source","REIC .NZ")))[:80],
                "status":old.get("status","pending-verification"),
                "lastCheckedAt":old.get("lastCheckedAt"),
                "lastError":old.get("lastError","")
            }
    # Retain previously imported domains not present in the latest append/import batch.
    for domain,old in previous.items():
        records.setdefault(domain,old)
    domains=sorted(records.values(),key=lambda x:x["domain"])
    cats={}
    for d in domains: cats[d.get("category","Unclassified")]=cats.get(d.get("category","Unclassified"),0)+1
    result={
      "schemaVersion":2,"registry":"REIC .NZ","targetDomains":TARGET,
      "indexedDomains":len(domains),
      "candidateNewsDomains":sum(1 for d in domains if d.get("kind","").lower()=="news" and d.get("feedUrl")),
      "verifiedNewsDomains":sum(1 for d in domains if d.get("status")=="verified-feed"),
      "pendingReview":sum(1 for d in domains if d.get("status")!="verified-feed"),
      "generatedAt":datetime.now(timezone.utc).isoformat(),
      "importSource":"bintang/news/reic-domain-import.jsonl",
      "storageNote":"Counts represent imported records only; targetDomains is a capacity goal, not discovered coverage.",
      "categories":cats,"domains":domains
    }
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Imported {len(domains)} unique domains; {result['verifiedNewsDomains']} feeds verified; {result['pendingReview']} pending.")
if __name__=="__main__": main()
