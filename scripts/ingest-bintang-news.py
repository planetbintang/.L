#!/usr/bin/env python3
"""Build BINTANG's public news metadata index from curated and REIC-imported RSS/Atom feeds."""
from __future__ import annotations
import html, json, re, hashlib
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
NEWS=ROOT/"bintang/news"
SOURCES=NEWS/"sources.json"
REGISTRY=NEWS/"reic-domain-registry.json"
OUTPUT=NEWS/"news-index.json"
UA="PlanetBintangNewsBot/1.1 (+https://planetbintang.github.io/.L/bintang/)"
MAX_SUMMARY=720
MAX_REIC_FEEDS_PER_RUN=20

def clean(value):
    value=html.unescape(re.sub(r"<[^>]+>"," ",value or ""))
    return re.sub(r"\s+"," ",value).strip()

def child_text(node,names):
    for child in list(node):
        tag=child.tag.rsplit("}",1)[-1].lower()
        if tag in names:
            if tag=="link":
                href=child.attrib.get("href")
                if href: return href
            if child.text: return child.text
    return ""

def parse_date(value):
    if not value: return ""
    try:
        dt=parsedate_to_datetime(value)
        if dt.tzinfo is None: dt=dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        try: return datetime.fromisoformat(value.replace("Z","+00:00")).astimezone(timezone.utc).isoformat()
        except Exception: return ""

def fetch_feed(feed,limit):
    req=Request(feed["url"],headers={"User-Agent":UA,"Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml"})
    with urlopen(req,timeout=8) as response: payload=response.read(1_500_000)
    root=ET.fromstring(payload)
    nodes=root.findall(".//item") or root.findall(".//{*}entry")
    results=[]
    for node in nodes[:limit]:
        title=clean(child_text(node,{"title"}))
        link=child_text(node,{"link"}).strip()
        if not link:
            guid=child_text(node,{"guid","id"})
            link=guid if guid.startswith("http") else ""
        summary=clean(child_text(node,{"description","summary","encoded","content"}))
        date=parse_date(child_text(node,{"pubdate","published","updated","date"}))
        if not title or not link: continue
        parsed=urlparse(link)
        if parsed.scheme not in ("http","https") or not parsed.netloc: continue
        key=hashlib.sha256(link.split("#")[0].encode()).hexdigest()
        results.append({"id":key,"title":title,"url":link,"summary":summary[:MAX_SUMMARY],
          "publishedAt":date,"source":feed["name"],"domain":parsed.netloc.lower(),
          "category":feed.get("category","Umum"),"language":feed.get("language","und")})
    return results

def main():
    config=json.loads(SOURCES.read_text(encoding="utf-8"))
    curated=list(config.get("feeds",[]))
    registry={}
    if REGISTRY.exists():
        try: registry=json.loads(REGISTRY.read_text(encoding="utf-8"))
        except Exception: registry={}
    reic=[]
    seen={str(x.get("url","")).lower() for x in curated}
    for domain in registry.get("domains",[]):
        url=str(domain.get("feedUrl","")).strip()
        if domain.get("kind","").lower()!="news" or not url or url.lower() in seen: continue
        host=(urlparse(url).hostname or "").lower()
        if host!=str(domain.get("domain","")).lower(): continue
        reic.append({"name":domain.get("domain",host),"url":url,
          "category":domain.get("category","Umum"),"language":domain.get("language","und"),
          "_registryDomain":domain.get("domain")})
        seen.add(url.lower())
    feeds=curated+reic[:MAX_REIC_FEEDS_PER_RUN]
    all_items,statuses={},[]
    checked_at=datetime.now(timezone.utc).isoformat()
    verification={}
    for feed in feeds:
        try:
            items=fetch_feed(feed,int(config.get("max_items_per_feed",30) if not feed.get("_registryDomain") else 12))
            for item in items:
                old=all_items.get(item["id"])
                if not old or len(item["summary"])>len(old["summary"]): all_items[item["id"]]=item
            statuses.append({"source":feed["name"],"ok":True,"items":len(items),"type":"REIC" if feed.get("_registryDomain") else "curated"})
            if feed.get("_registryDomain"): verification[feed["_registryDomain"]]=(True,"")
        except Exception as exc:
            statuses.append({"source":feed["name"],"ok":False,"error":str(exc)[:160],"type":"REIC" if feed.get("_registryDomain") else "curated"})
            if feed.get("_registryDomain"): verification[feed["_registryDomain"]]=(False,str(exc)[:160])
    if registry.get("domains"):
        for domain in registry["domains"]:
            outcome=verification.get(domain.get("domain"))
            if outcome is None: continue
            ok,error=outcome
            domain["status"]="verified-feed" if ok else "feed-unavailable"
            domain["lastCheckedAt"]=checked_at
            domain["lastError"]=error
        registry["verifiedNewsDomains"]=sum(1 for d in registry["domains"] if d.get("status")=="verified-feed")
        registry["pendingReview"]=sum(1 for d in registry["domains"] if d.get("status")!="verified-feed")
        registry["candidateNewsDomains"]=sum(1 for d in registry["domains"] if d.get("kind","").lower()=="news" and d.get("feedUrl"))
        registry["generatedAt"]=checked_at
        REGISTRY.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    items=list(all_items.values())
    items.sort(key=lambda x:x["publishedAt"] or "",reverse=True)
    payload={"generatedAt":checked_at,"sourceCount":len(feeds),"curatedSourceCount":len(curated),
      "reicSourceCount":len(reic[:MAX_REIC_FEEDS_PER_RUN]),"itemCount":len(items),
      "sources":statuses,"items":items[:500]}
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Indexed {len(payload['items'])} stories; {sum(s['ok'] for s in statuses)}/{len(statuses)} feeds succeeded; {payload['reicSourceCount']} REIC candidates checked.")
if __name__=="__main__": main()
