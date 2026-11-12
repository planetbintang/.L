#!/usr/bin/env python3
"""Validate and merge REIC .NZ domain export batches into a compact registry."""
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
    p=urlparse(value)
    return value if p.scheme in ("http","https") and p.netloc else ""

def main():
    records={}
    if INPUT.exists():
        for line_no,line in enumerate(INPUT.read_text(encoding="utf-8").splitlines(),1):
            if not line.strip(): continue
            try: item=json.loads(line)
            except Exception: continue
            domain=str(item.get("domain","")).strip().lower().rstrip(".")
            if not HOST.fullmatch(domain): continue
            old=records.get(domain,{})
            feed=valid_feed(item.get("feed_url",""))
            records[domain]={
                "domain":domain,
                "kind":str(item.get("kind","unknown"))[:40],
                "country":str(item.get("country",""))[:8].upper(),
                "language":str(item.get("language",""))[:16].lower(),
                "category":str(item.get("category","Unclassified"))[:80],
                "feedUrl":feed or old.get("feedUrl",""),
                "source":str(item.get("source","REIC .NZ"))[:80],
                "status":"pending-verification"
            }
    domains=sorted(records.values(),key=lambda x:x["domain"])
    cats={}
    for d in domains: cats[d["category"]]=cats.get(d["category"],0)+1
    result={
      "schemaVersion":1,"registry":"REIC .NZ","targetDomains":TARGET,
      "indexedDomains":len(domains),
      "verifiedNewsDomains":sum(1 for d in domains if d["kind"].lower()=="news" and d["feedUrl"]),
      "pendingReview":len(domains),
      "generatedAt":datetime.now(timezone.utc).isoformat(),
      "importSource":"bintang/news/reic-domain-import.jsonl",
      "categories":cats,"domains":domains
    }
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"REIC domain records: {len(domains)} / {TARGET} target; pending verification: {len(domains)}")
if __name__=="__main__": main()
