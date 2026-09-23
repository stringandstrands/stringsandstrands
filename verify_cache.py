import json
with open('public/products_cache.json', encoding='utf-8') as f:
    products = json.load(f)

print(f'Total products: {len(products)}')
print()
print('Sample image URLs:')
for p in products[:5]:
    name = p.get('name', '')
    print(f'  {name}')
    for img in (p.get('images') or [])[:2]:
        print(f'    {img[:90]}')
    print()

supabase_imgs = [p for p in products if any('supabase.co' in (img or '') for img in (p.get('images') or []))]
print(f'Products still on Supabase Storage: {len(supabase_imgs)}')
empty_imgs = [p for p in products if not p.get('images')]
print(f'Products with no images: {len(empty_imgs)}')
