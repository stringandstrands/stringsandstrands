# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

"""
fix_image_urls.py
==================
Runs once Supabase billing resets.

What it does:
  1. Fetches ALL products from Supabase DB
  2. Checks which ones still have supabase.co/storage image URLs
  3. Fetches all 102 images from Cloudinary
  4. Tries to match old Supabase URLs → existing Cloudinary URLs by filename
  5. Updates the DB rows with Cloudinary URLs
  6. Reports anything that couldn't be matched (needs manual fix)

Run with:
    python fix_image_urls.py
"""

import urllib.request
import urllib.error
import base64
import json
import time
import re

# ─── CONFIG ────────────────────────────────────────────────────────────────────

SUPABASE_URL = "https://nxlarmjrnxkinbflzzxr.supabase.co"
SUPABASE_SERVICE_KEY = "<YOUR_SUPABASE_SERVICE_KEY>"

CLOUDINARY_CLOUD   = "j9iatw4p"
CLOUDINARY_API_KEY = "562556275998157"
CLOUDINARY_SECRET  = "bjmuLJjyf3dseSQ5aK4WAlqQbHI"

SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

CLOUDINARY_CREDS = base64.b64encode(
    f"{CLOUDINARY_API_KEY}:{CLOUDINARY_SECRET}".encode()
).decode()


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def supabase_get(path):
    req = urllib.request.Request(
        f"{SUPABASE_URL}{path}",
        headers=SUPABASE_HEADERS,
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def supabase_patch(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}{path}",
        data=data,
        headers={**SUPABASE_HEADERS, "Prefer": "return=minimal"},
        method="PATCH",
    )
    with urllib.request.urlopen(req) as r:
        return r.status


def cloudinary_get(path):
    req = urllib.request.Request(
        f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD}{path}",
        headers={"Authorization": f"Basic {CLOUDINARY_CREDS}"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def extract_filename(url):
    """Get the bare filename (no ext) from any URL for fuzzy matching."""
    name = url.rstrip("/").split("/")[-1]
    name = re.sub(r"\?.*$", "", name)          # strip query params
    name = re.sub(r"\.[^.]+$", "", name)        # strip extension
    return name.lower()


# ─── STEP 1: fetch all Cloudinary images ──────────────────────────────────────

def get_all_cloudinary_images():
    print("📦 Fetching all images from Cloudinary...")
    all_resources = []
    next_cursor = None

    while True:
        url = (
            f"/resources/image"
            f"?prefix=product-images&max_results=500&type=upload"
        )
        if next_cursor:
            url += f"&next_cursor={next_cursor}"
        data = cloudinary_get(url)
        all_resources.extend(data.get("resources", []))
        next_cursor = data.get("next_cursor")
        if not next_cursor:
            break

    print(f"   ✅ {len(all_resources)} images found in Cloudinary")

    # Build lookup: filename → secure_url
    lookup = {}
    for r in all_resources:
        fname = extract_filename(r["public_id"])
        lookup[fname] = r["secure_url"]

    return all_resources, lookup


# ─── STEP 2: fetch all products from Supabase ─────────────────────────────────

def get_all_products():
    print("📋 Fetching all products from Supabase DB...")
    all_products = []
    offset = 0
    limit = 500

    while True:
        data = supabase_get(
            f"/rest/v1/products?select=id,name,images"
            f"&limit={limit}&offset={offset}"
        )
        all_products.extend(data)
        if len(data) < limit:
            break
        offset += limit

    print(f"   ✅ {len(all_products)} products found")
    return all_products


# ─── STEP 3: analyse & fix ────────────────────────────────────────────────────

def fix_products(products, cloudinary_lookup, all_cloudinary):
    already_cloudinary = 0
    fixed = 0
    could_not_match = []
    no_images = 0

    for product in products:
        images = product.get("images") or []
        if not images:
            no_images += 1
            continue

        needs_fix = any("supabase.co" in (img or "") for img in images)
        if not needs_fix:
            already_cloudinary += 1
            continue

        # Try to replace each supabase URL with a Cloudinary URL
        new_images = []
        product_unmatched = []

        for img_url in images:
            if "supabase.co" not in (img_url or ""):
                new_images.append(img_url)
                continue

            # Match by filename
            fname = extract_filename(img_url)
            if fname in cloudinary_lookup:
                new_images.append(cloudinary_lookup[fname])
                print(f"   🔗 Matched: {fname}")
            else:
                # Try partial match (filename may differ slightly)
                partial_match = None
                for cld_fname, cld_url in cloudinary_lookup.items():
                    if fname in cld_fname or cld_fname in fname:
                        partial_match = cld_url
                        print(f"   🔗 Partial match: {fname} → {cld_fname}")
                        break

                if partial_match:
                    new_images.append(partial_match)
                else:
                    # Can't match — keep old URL for now, flag it
                    new_images.append(img_url)
                    product_unmatched.append(img_url)
                    print(f"   ⚠️  No match found for: {img_url[-60:]}")

        if product_unmatched:
            could_not_match.append({
                "id": product["id"],
                "name": product.get("name"),
                "unmatched_urls": product_unmatched,
            })

        # Update DB with new image URLs
        try:
            status = supabase_patch(
                f"/rest/v1/products?id=eq.{product['id']}",
                {"images": new_images},
            )
            print(f"   ✅ Updated: {product.get('name', product['id'])}")
            fixed += 1
        except Exception as e:
            print(f"   ❌ DB update failed for {product['id']}: {e}")

        time.sleep(0.1)  # be gentle

    return already_cloudinary, fixed, could_not_match, no_images


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Strings & Strands — Cloudinary Image URL Fix")
    print("=" * 60)
    print()

    # Check if Supabase is accessible first
    print("🔌 Checking Supabase connectivity...")
    try:
        test = supabase_get("/rest/v1/products?select=id&limit=1")
        print("   ✅ Supabase is accessible!\n")
    except urllib.error.HTTPError as e:
        if e.code == 402:
            print("   ❌ Supabase is still restricted (402 — billing limit).")
            print("   ⏳ Please wait for your billing period to reset, then run this script again.")
            return
        raise

    # Proceed with migration
    all_cloudinary, cloudinary_lookup = get_all_cloudinary_images()
    print()

    products = get_all_products()
    print()

    print("🔄 Analysing and fixing products...")
    already_ok, fixed, unmatched, no_images = fix_products(
        products, cloudinary_lookup, all_cloudinary
    )

    # Summary
    print()
    print("=" * 60)
    print("  DONE")
    print("=" * 60)
    print(f"  ✅ Already on Cloudinary (no change needed): {already_ok}")
    print(f"  ✅ Fixed (updated to Cloudinary URLs):       {fixed}")
    print(f"  ⚠️  No images:                               {no_images}")
    print(f"  ❌ Could not auto-match:                     {len(unmatched)}")
    print()

    if unmatched:
        print("Products that need manual URL fix:")
        for p in unmatched:
            print(f"  • {p['name']} (id: {p['id']})")
            for u in p["unmatched_urls"]:
                print(f"      {u}")
        print()
        print("For these, open the admin panel and re-upload their images.")

    if fixed > 0:
        print("🎉 Migration complete! Your site images now load from Cloudinary.")
        print("   Supabase Storage egress will be 0 going forward.")


if __name__ == "__main__":
    main()
