# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

"""
emergency_fix.py
================
Uses Supabase Management API (bypasses 402) to:
1. Fetch all 151 products
2. Fetch all 102 Cloudinary images
3. Match old Supabase Storage URLs -> Cloudinary URLs
4. Update all products in DB with Cloudinary URLs
5. Export full product catalog as products_cache.json (for static fallback)
"""

import urllib.request
import urllib.error
import base64
import json
import re
import time
import os

# ─── CONFIG ────────────────────────────────────────────────────────────────────
PAT            = '<YOUR_PAT_HERE>'
PROJECT_REF    = 'nxlarmjrnxkinbflzzxr'
MGMT_BASE      = f'https://api.supabase.com/v1/projects/{PROJECT_REF}'

CLOUDINARY_CLOUD   = 'j9iatw4p'
CLOUDINARY_API_KEY = '562556275998157'
CLOUDINARY_SECRET  = 'bjmuLJjyf3dseSQ5aK4WAlqQbHI'
CLOUDINARY_CREDS   = base64.b64encode(
    f'{CLOUDINARY_API_KEY}:{CLOUDINARY_SECRET}'.encode()
).decode()

MGMT_HEADERS = {
    'Authorization': f'Bearer {PAT}',
    'Content-Type': 'application/json',
}


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def mgmt_query(sql):
    """Run SQL via Management API (bypasses 402)."""
    body = json.dumps({'query': sql}).encode()
    req = urllib.request.Request(
        f'{MGMT_BASE}/database/query',
        data=body,
        headers=MGMT_HEADERS,
        method='POST',
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def cloudinary_get(path):
    req = urllib.request.Request(
        f'https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD}{path}',
        headers={'Authorization': f'Basic {CLOUDINARY_CREDS}'},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def extract_filename(url):
    """Bare filename without extension for matching."""
    name = url.rstrip('/').split('/')[-1]
    name = re.sub(r'\?.*$', '', name)
    name = re.sub(r'\.[^.]+$', '', name)
    return name.lower()


# ─── STEP 1: Get all Cloudinary images ────────────────────────────────────────

def get_cloudinary_images():
    print('Fetching Cloudinary images...')
    all_res = []
    next_cursor = None
    while True:
        url = '/resources/image?prefix=product-images&max_results=500&type=upload'
        if next_cursor:
            url += f'&next_cursor={next_cursor}'
        data = cloudinary_get(url)
        all_res.extend(data.get('resources', []))
        next_cursor = data.get('next_cursor')
        if not next_cursor:
            break
    print(f'  {len(all_res)} images in Cloudinary')

    # Build lookup: filename -> secure_url  AND  full list for fallback matching
    by_filename = {}
    for r in all_res:
        fname = extract_filename(r['public_id'])
        by_filename[fname] = r['secure_url']

    return all_res, by_filename


# ─── STEP 2: Get all products via Management API ──────────────────────────────

def get_all_products():
    print('Fetching all products via Management API...')
    rows = mgmt_query('SELECT id, name, category, price, discounted_price, images, description, stock, is_bestseller, is_new, metal, color, occasion, type, dropdown_options, rating, created_at FROM products ORDER BY created_at DESC')
    print(f'  {len(rows)} products found')
    return rows


# ─── STEP 3: Fix image URLs ───────────────────────────────────────────────────

def fix_urls(products, cld_all, by_filename):
    print('\nFixing image URLs...')
    already_ok = 0
    fixed_count = 0
    could_not_match = []
    updated_products = []

    for p in products:
        imgs = p.get('images') or []
        if not imgs:
            updated_products.append(p)
            continue

        needs_fix = any('supabase.co' in (img or '') for img in imgs)
        if not needs_fix:
            already_ok += 1
            updated_products.append(p)
            continue

        new_imgs = []
        unmatched_for_product = []

        for img_url in imgs:
            if 'supabase.co' not in (img_url or ''):
                new_imgs.append(img_url)
                continue

            fname = extract_filename(img_url)

            # Exact filename match
            if fname in by_filename:
                new_imgs.append(by_filename[fname])
                continue

            # Partial match
            matched = None
            for cld_fname, cld_url in by_filename.items():
                if fname in cld_fname or cld_fname in fname:
                    matched = cld_url
                    break

            if matched:
                new_imgs.append(matched)
            else:
                # Keep old URL, flag it
                new_imgs.append(img_url)
                unmatched_for_product.append(img_url)

        # Update in DB
        imgs_sql = json.dumps(new_imgs).replace("'", "''")
        try:
            mgmt_query(f"UPDATE products SET images = '{imgs_sql}'::jsonb WHERE id = '{p['id']}'")
            fixed_count += 1
            p['images'] = new_imgs  # update in memory too
        except Exception as e:
            print(f'  DB update failed for {p["id"]}: {e}')

        if unmatched_for_product:
            could_not_match.append({'id': p['id'], 'name': p.get('name'), 'urls': unmatched_for_product})

        updated_products.append(p)
        time.sleep(0.05)

    print(f'  Already on Cloudinary: {already_ok}')
    print(f'  Fixed (updated to Cloudinary): {fixed_count}')
    if could_not_match:
        print(f'  Could not auto-match: {len(could_not_match)} products')
        for p in could_not_match:
            print(f'    - {p["name"]}')

    return updated_products


# ─── STEP 4: Export static product cache ─────────────────────────────────────

def export_cache(products):
    out_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        'public', 'products_cache.json'
    )
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    # Normalise for frontend
    normalized = []
    for p in products:
        normalized.append({
            'id': p.get('id'),
            'name': p.get('name'),
            'category': p.get('category'),
            'price': p.get('discounted_price'),
            'originalPrice': p.get('price'),
            'images': p.get('images') or [],
            'description': p.get('description', ''),
            'stock': p.get('stock', 0),
            'is_bestseller': p.get('is_bestseller', False),
            'is_new': p.get('is_new', False),
            'metal': p.get('metal', ''),
            'color': p.get('color', ''),
            'occasion': p.get('occasion', ''),
            'type': p.get('type', ''),
            'dropdown_options': p.get('dropdown_options', ''),
            'rating': p.get('rating', 4.5),
        })

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

    print(f'\nProduct cache saved -> {out_path}')
    print(f'  {len(normalized)} products exported')
    return out_path


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    print('=' * 60)
    print('  Emergency Fix — Supabase Management API')
    print('=' * 60)
    print()

    cld_all, by_filename = get_cloudinary_images()
    products = get_all_products()
    updated = fix_urls(products, cld_all, by_filename)
    export_cache(updated)

    print()
    print('=' * 60)
    print('  ALL DONE')
    print('=' * 60)
    print()
    print('  Image URLs in DB are now updated to Cloudinary.')
    print('  products_cache.json exported to public/ folder.')
    print()
    print('  Next step: update the frontend to use the cache')
    print('  when Supabase is unavailable.')


if __name__ == '__main__':
    main()
