"""
upload_sets.py
==============
Downloads the "Sets" subfolder from Google Drive and uploads products
directly to Supabase using the service-role key (no admin login needed).

Pricing logic (from filename):
  filename number = N  (e.g. "2200.jpg")
  discounted_price = N - 1   (e.g. 2199)
  price            = N + 150 (e.g. 2350)

Multiple images with the same base number are grouped as one product:
  2200.jpg, 2200_1.jpg, 2200_2.jpg → one "Sets Style 2200" product

Usage:
    python upload_sets.py

Requirements:
    pip install gdown requests supabase
"""

import os
import re
import sys
import json
import base64
import time
import shutil
import mimetypes

import gdown
import requests

# ─── CONFIG ──────────────────────────────────────────────────────────────────

ROOT_FOLDER_ID     = "1OaHWHC_tG5hFkzRjIgf2SGvhlb2ltMWe"   # Sets subfolder

SUPABASE_URL       = "https://nxlarmjrnxkinbflzzxr.supabase.co"
SERVICE_ROLE_KEY   = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFybWpybnhraW5iZmx6enhyIiwi"
    "cm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE1NjQ4NywiZXhwIjoyMTAw"
    "NzMyNDg3fQ.lkBkSBkTyvZ79Nnk2632U87w00NLEYrknWY5wvlzK_k"
)
STORAGE_BUCKET     = "product-images"
DOWNLOAD_DIR       = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sets_download_tmp")

# ─── MANUAL OVERRIDE (optional) ──────────────────────────────────────────────
# If gdown can't access the Drive folder (requires login),
# manually download the Sets folder to your PC and set the path here:
#   e.g. MANUAL_SETS_DIR = r"C:\Users\Monica\Downloads\Sets"
MANUAL_SETS_DIR    = ""    # leave empty to use gdown auto-download


HEADERS = {
    "apikey":        SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type":  "application/json",
}

# ─── STEP 1: DOWNLOAD DRIVE FOLDER ───────────────────────────────────────────

def download_sets_folder() -> str:
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    print(f"\nDownloading Drive folder -> {DOWNLOAD_DIR}")
    print("   This may take a few minutes depending on folder size...")
    print("   NOTE: The folder must be set to 'Anyone with the link can view' on Google Drive.")

    try:
        # gdown 6.x signature (no remaining_ok)
        downloaded = gdown.download_folder(
            id=ROOT_FOLDER_ID,
            output=DOWNLOAD_DIR,
            quiet=False,
            use_cookies=True,   # use browser cookies if available
            resume=True,
        )
        if downloaded:
            print(f"   Downloaded {len(downloaded)} file(s)")
        else:
            print("   gdown returned no files — folder may not be publicly accessible.")
    except Exception as e:
        print(f"   WARNING: gdown error: {e}")
        print("   Trying to continue with whatever was downloaded...")

    # Find a 'Sets' subfolder anywhere in the download tree (case-insensitive)
    sets_dir = None
    image_exts = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'}

    for root, dirs, files in os.walk(DOWNLOAD_DIR):
        for d in dirs:
            if d.strip().lower() == "sets":
                sets_dir = os.path.join(root, d)
                print(f"   Found 'Sets' subfolder: {sets_dir}")
                break
        if sets_dir:
            break

    if not sets_dir:
        # Show what was downloaded so the user can diagnose
        all_files = []
        for root, dirs, files in os.walk(DOWNLOAD_DIR):
            for f in files:
                all_files.append(os.path.relpath(os.path.join(root, f), DOWNLOAD_DIR))

        if not all_files:
            print("\nERROR: Nothing was downloaded from Google Drive.")
            print("Please make sure the folder is shared as 'Anyone with the link can view'.")
            print("You can also manually download the Sets folder and set MANUAL_SETS_DIR below.")
            # Check if manual override provided
            if MANUAL_SETS_DIR and os.path.isdir(MANUAL_SETS_DIR):
                print(f"   Using MANUAL_SETS_DIR: {MANUAL_SETS_DIR}")
                return MANUAL_SETS_DIR
            sys.exit(1)

        print(f"\nFiles downloaded ({len(all_files)}):")
        for f in all_files[:30]:
            print(f"   {f}")

        # Check if images are directly in DOWNLOAD_DIR
        direct_images = [f for f in os.listdir(DOWNLOAD_DIR)
                         if os.path.splitext(f)[1].lower() in image_exts]
        if direct_images:
            print(f"\n   {len(direct_images)} image(s) found directly — treating root as Sets folder.")
            sets_dir = DOWNLOAD_DIR
        else:
            # Try to find any subfolder that has images with numeric names
            for root, dirs, files in os.walk(DOWNLOAD_DIR):
                numeric_images = [
                    f for f in files
                    if os.path.splitext(f)[1].lower() in image_exts
                    and re.match(r'^\d+', f)
                ]
                if numeric_images:
                    print(f"\n   Found numeric images in: {root}")
                    sets_dir = root
                    break

        if not sets_dir:
            if MANUAL_SETS_DIR and os.path.isdir(MANUAL_SETS_DIR):
                print(f"   Using MANUAL_SETS_DIR override: {MANUAL_SETS_DIR}")
                return MANUAL_SETS_DIR
            print("\nERROR: Could not find Sets folder. Set MANUAL_SETS_DIR in the script.")
            sys.exit(1)

    print(f"\nSets folder: {sets_dir}")
    return sets_dir


# ─── STEP 2: GROUP IMAGES BY PRODUCT NUMBER ──────────────────────────────────

def parse_number(filename: str):
    """Extract leading number from filename. '2200.jpg' → 2200, '2200_1.jpg' → 2200"""
    base = os.path.splitext(filename)[0].strip()
    m = re.match(r'^(\d+)', base)
    return int(m.group(1)) if m else None

def group_by_product(sets_dir: str) -> dict:
    image_exts = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'}
    groups: dict[str, list] = {}

    for fname in sorted(os.listdir(sets_dir)):
        fpath = os.path.join(sets_dir, fname)
        if not os.path.isfile(fpath):
            continue
        if os.path.splitext(fname)[1].lower() not in image_exts:
            continue
        num = parse_number(fname)
        if num is None:
            print(f"  ⚠️  Skipping '{fname}' — cannot parse a price number from the name")
            continue
        key = str(num)
        groups.setdefault(key, []).append(fpath)

    return groups


# ─── STEP 3: UPLOAD IMAGE TO SUPABASE STORAGE ────────────────────────────────

def upload_image_to_storage(fpath: str) -> str | None:
    fname = os.path.basename(fpath)
    ext   = os.path.splitext(fname)[1].lower()
    mime  = mimetypes.types_map.get(ext, "image/jpeg")

    storage_path = f"sets/{int(time.time()*1000)}-{fname}"

    with open(fpath, "rb") as f:
        data = f.read()

    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{storage_path}"
    resp = requests.post(
        url,
        headers={
            "apikey":        SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
            "Content-Type":  mime,
            "x-upsert":      "true",
        },
        data=data,
        timeout=120,
    )

    if resp.status_code in (200, 201):
        public_url = (
            f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"
        )
        return public_url
    else:
        print(f"    ❌ Storage upload failed ({resp.status_code}): {resp.text[:200]}")
        return None


# ─── STEP 4: INSERT PRODUCT INTO SUPABASE ────────────────────────────────────

def insert_product(name: str, price: int, discounted_price: int, images: list) -> dict | None:
    product_id = (
        name.lower().replace(" ", "-").replace("/", "-") + f"-{int(time.time())}"
    )
    payload = {
        "id":               product_id,
        "name":             name,
        "category":         "Sets",
        "price":            price,
        "discounted_price": discounted_price,
        "stock":            50,
        "rating":           4.5,
        "is_bestseller":    False,
        "is_new":           True,
        "images":           images,
        "description":      "",
        "metal":            "",
        "color":            "",
        "occasion":         "",
        "type":             "",
    }

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/products",
        headers={**HEADERS, "Prefer": "return=representation"},
        json=payload,
        timeout=30,
    )

    if resp.status_code in (200, 201):
        result = resp.json()
        return result[0] if isinstance(result, list) else result
    else:
        print(f"    ❌ DB insert failed ({resp.status_code}): {resp.text[:300]}")
        return None


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    sets_dir = download_sets_folder()
    groups   = group_by_product(sets_dir)

    if not groups:
        print("❌ No numericly-named images found. Nothing to upload.")
        sys.exit(1)

    print(f"\n🏷️  Found {len(groups)} product(s) to create\n{'─'*55}")

    created = []
    skipped = []

    for num_str in sorted(groups, key=int):
        num              = int(num_str)
        discounted_price = num - 1
        price            = num + 150
        name             = f"Sets Style {num_str}"
        fpaths           = groups[num_str]

        print(f"\n📦  {name}  |  ₹{discounted_price} (MRP ₹{price})")
        print(f"    {len(fpaths)} image(s): {[os.path.basename(f) for f in fpaths]}")

        image_urls = []
        for fpath in fpaths:
            print(f"    ⬆️  Uploading {os.path.basename(fpath)}...")
            url = upload_image_to_storage(fpath)
            if url:
                image_urls.append(url)
                print(f"    ✅ {url[-50:]}")
            time.sleep(0.3)

        if not image_urls:
            print(f"    ⚠️  No images uploaded → skipping product")
            skipped.append(name)
            continue

        product = insert_product(name, price, discounted_price, image_urls)
        if product:
            print(f"    ✅ Created in DB: {product.get('id', '?')}")
            created.append({"name": name, "price": price, "discounted_price": discounted_price, "id": product.get("id")})
        else:
            skipped.append(name)

        time.sleep(0.3)

    # ── Summary ──────────────────────────────────────────────────────────────
    print(f"\n{'═'*55}")
    print(f"✅ Created {len(created)} Sets product(s):")
    for p in created:
        print(f"   • {p['name']}  →  ₹{p['discounted_price']} (MRP ₹{p['price']})  [{p['id']}]")

    if skipped:
        print(f"\n⚠️  Skipped {len(skipped)}: {skipped}")

    # Save a log
    log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sets_upload_log.json")
    with open(log_path, "w") as f:
        json.dump({"created": created, "skipped": skipped}, f, indent=2)
    print(f"\n📄 Log saved to: {log_path}")

    # Cleanup
    # ans = input("\n🗑️  Delete the downloaded temp folder? (y/n): ").strip().lower()
    ans = "y"
    if ans == "y":
        shutil.rmtree(DOWNLOAD_DIR, ignore_errors=True)
        print("   Cleaned up.")


if __name__ == "__main__":
    main()
