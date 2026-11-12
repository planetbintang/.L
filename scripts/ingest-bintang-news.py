#!/usr/bin/env python3
"""Fetch public RSS/Atom metadata into the static BINTANG News index.

Only publisher-provided titles, links and short feed summaries are stored.
Full article text is not copied unless a publisher explicitly syndicates it in
its feed. The reader stays on BINTANG and clearly attributes every source.
"""
from __future__ import annotations
import html, json, re, time, hashlib
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "bintang" / "news" / "sources.json"
OUTPUT = ROOT / "bintang" / "news" / "news-index.json"
UA = "PlanetBintangNewsBot/1.0 (+https://planetbintang.github.io/.L/bintang/)"
MAX_SUMMARY = 720

def clean(value):
    value = html.unescape(re.sub(r"<[^>]+>", " ", value or ""))
    return re.sub(r"\s+", " ", value).strip()

def child_text(node, names):
    for child in list(node):
        tag = child.tag.rsplit("}", 1)[-1].lower()
        if tag in names:
            if tag == "link":
                href = child.attrib.get("href")
                if href: return href
            if child.text: return child.text
    return ""

def parse_date(value):
    if not value: return ""
    try:
        dt = parsedate_to_datetime(value)
        if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        try:
            return datetime.fromisoformat(value.replace("Z","+00:00")).astimezone(timezone.utc).isoformat()
        except Exception: return ""

def fetch_feed(feed, limit):
    req = Request(feed["url"], headers={"User-Agent": UA, "Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml"})
    with urlopen(req, timeout=18) as response:
        payload = response.read(2_500_000)
    root = ET.fromstring(payload)
    nodes = root.findall(".//item") or root.findall(".//{*}entry")
    results = []
    for node in nodes[:limit]:
        title = clean(child_text(node, {"title"}))
        link = child_text(node, {"link"}).strip()
        if not link:
            guid = child_text(node, {"guid","id"})
            link = guid if guid.startswith("http") else ""
        summary = clean(child_text(node, {"description","summary","encoded","content"}))
        date = parse_date(child_text(node, {"pubdate","published","updated","date"}))
        if not title or not link: continue
        parsed = urlparse(link)
        if parsed.scheme not in ("http","https") or not parsed.netloc: continue
        key = hashlib.sha256(link.split("#")[0].encode()).hexdigest()
        results.append({
            "id": key, "title": title, "url": link, "summary": summary[:MAX_SUMMARY],
            "publishedAt": date, "source": feed["name"], "domain": parsed.netloc.lower(),
            "category": feed.get("category","Umum"), "language": feed.get("language","und")
        })
    return results

def main():
    config = json.loads(SOURCES.read_text(encoding="utf-8"))
    all_items, statuses = {}, []
    for feed in config["feeds"]:
        try:
            items = fetch_feed(feed, int(config.get("max_items_per_feed",30)))
            for item in items:
                old = all_items.get(item["id"])
                if not old or len(item["summary"]) > len(old["summary"]): all_items[item["id"]] = item
            statuses.append({"source":feed["name"],"ok":True,"items":len(items)})
        except Exception as exc:
            statuses.append({"source":feed["name"],"ok":False,"error":str(exc)[:180]})
    items = list(all_items.values())
    items.sort(key=lambda x: x["publishedAt"] or "", reverse=True)
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceCount": len(config["feeds"]), "itemCount": len(items),
        "sources": statuses, "items": items[:500]
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"Indexed {len(payload['items'])} stories from {len(statuses)} feeds; {sum(s['ok'] for s in statuses)} feeds succeeded.")

if __name__ == "__main__": main()
