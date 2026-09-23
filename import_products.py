# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
import_products.py
==================
Imports all 151 products from products_cache.json into a NEW Supabase project.

Usage:
    python import_products.py
    
Set NEW_SUPABASE_URL and NEW_SERVICE_KEY below before running.
"""

import json
import urllib.request
import time
import os

# ─── SET THESE from your NEW Supabase project ─────────────────────────────────
# Dashboard -> Settings -> API
NEW_SUPABASE_URL = "https://acoeipjfdhumeurxspiv.supabase.co"         # e.g. https://abcxyz.supabase.co
NEW_SERVICE_KEY  = "<YOUR_NEW_SERVICE_KEY>"  # Settings -> API -> service_role key
# ──────────────────────────────────────────────────────────────────────────────

HEADERS = {
    "apikey":        NEW_SERVICE_KEY,
    "Authorization": f"Bearer {NEW_SERVICE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=minimal",
}

CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "products_cache.json")


def insert_product(p):
    # Convert back to DB column names
    payload = {
        "id":               p["id"],
        "name":             p["name"],
        "category":         p["category"],
        "price":            p["originalPrice"],
        "discounted_price": p["price"],
        "description":      p.get("description", ""),
        "images":           p.get("images", []),
        "stock":            p.get("stock", 50),
        "is_bestseller":    p.get("is_bestseller", False),
        "is_new":           p.get("is_new", False),
        "metal":            p.get("metal", ""),
        "color":            p.get("color", ""),
        "occasion":         p.get("occasion", ""),
        "type":             p.get("type", ""),
        "dropdown_options": p.get("dropdown_options", ""),
        "rating":           p.get("rating", 4.5),
    }
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{NEW_SUPABASE_URL}/rest/v1/products",
        data=body,
        headers={**HEADERS, "Prefer": "return=minimal"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            return True
    except urllib.request.HTTPError as e:
        err = e.read().decode()
        if "duplicate key" in err or "23505" in err:
            return True  # already exists, skip
        print(f"  FAILED ({e.code}): {err[:200]}")
        return False


def main():
    if NEW_SUPABASE_URL == "PASTE_NEW_URL_HERE":
        print("ERROR: Please set NEW_SUPABASE_URL and NEW_SERVICE_KEY in this script first!")
        return

    print("=" * 60)
    print("  Product Import -> New Supabase Project")
    print("=" * 60)
    print()

    with open(CACHE_PATH, encoding="utf-8") as f:
        products = json.load(f)
    print(f"Loaded {len(products)} products from cache")
    print()

    ok = 0
    failed = 0
    for i, p in enumerate(products):
        name = p.get("name", p.get("id"))
        success = insert_product(p)
        if success:
            ok += 1
            print(f"  [{i+1}/{len(products)}] OK  {name}")
        else:
            failed += 1
            print(f"  [{i+1}/{len(products)}] FAIL {name}")
        time.sleep(0.05)

    print()
    print("=" * 60)
    print(f"  Done! {ok} imported, {failed} failed")
    print("=" * 60)
    if ok == len(products):
        print()
        print("All products loaded! Now update your .env files:")
        print(f"  VITE_SUPABASE_URL={NEW_SUPABASE_URL}")
        print("  VITE_SUPABASE_ANON_KEY=<new anon key>")
        print("  SUPABASE_URL=<same>")
        print("  SUPABASE_SERVICE_ROLE_KEY=<new service role key>")


if __name__ == "__main__":
    main()
