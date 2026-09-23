import urllib.request, base64, json

cloud = 'j9iatw4p'
api_key = '562556275998157'
api_secret = 'bjmuLJjyf3dseSQ5aK4WAlqQbHI'
creds = base64.b64encode(f'{api_key}:{api_secret}'.encode()).decode()

# Get all cloudinary images
all_resources = []
next_cursor = None

while True:
    url = f'https://api.cloudinary.com/v1_1/{cloud}/resources/image?prefix=product-images&max_results=500&type=upload'
    if next_cursor:
        url += f'&next_cursor={next_cursor}'
    req = urllib.request.Request(url, headers={'Authorization': f'Basic {creds}'})
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    all_resources.extend(data.get('resources', []))
    next_cursor = data.get('next_cursor')
    if not next_cursor:
        break

print(f'TOTAL images in Cloudinary product-images: {len(all_resources)}')
print()
print('Sample public_ids:')
for r in all_resources[:5]:
    print(' ', r['public_id'])
    print('  url:', r['secure_url'])
    print()

# Try Supabase
SUPABASE_URL = 'https://nxlarmjrnxkinbflzzxr.supabase.co'
SERVICE_KEY = (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFybWpybnhraW5iZmx6enhyIiwi'
    'cm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE1NjQ4NywiZXhwIjoyMTAw'
    'NzMyNDg3fQ.lkBkSBkTyvZ79Nnk2632U87w00NLEYrknWY5wvlzK_k'
)
headers = {'apikey': SERVICE_KEY, 'Authorization': f'Bearer {SERVICE_KEY}'}

req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/products?select=id,name,images&limit=500',
    headers=headers
)
try:
    with urllib.request.urlopen(req) as r:
        products = json.loads(r.read())
    print(f'TOTAL products in Supabase DB: {len(products)}')
    print()
    print('Sample product image URLs from DB:')
    for p in products[:3]:
        name = p.get('name', '')
        imgs = p.get('images') or []
        print(f'  Product: {name}')
        for img in imgs[:2]:
            print(f'    img: {img}')
        print()
except Exception as e:
    print(f'Supabase still blocked (402): {e}')
    print('Will run URL update once billing period resets.')
