import os
import random
import requests
from datetime import datetime, timedelta

# Supabase details from upload_sets.py
SUPABASE_URL = "https://nxlarmjrnxkinbflzzxr.supabase.co"
SERVICE_ROLE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFybWpybnhraW5iZmx6enhyIiwi"
    "cm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE1NjQ4NywiZXhwIjoyMTAw"
    "NzMyNDg3fQ.lkBkSBkTyvZ79Nnk2632U87w00NLEYrknWY5wvlzK_k"
)

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# The user wants "Indian names"
INDIAN_NAMES = [
    "Priya", "Rahul", "Sneha", "Amit", "Neha", 
    "Rohan", "Anjali", "Vikram", "Pooja", "Karan",
    "Divya", "Suresh", "Megha", "Karthik", "Riya",
    "Manish", "Swati", "Aditya", "Kavya", "Deepak"
]

TITLES = {
    5: ["Amazing product!", "Absolutely love it", "Beautiful quality", "Highly recommended", "Perfect!"],
    4: ["Great quality", "Really nice", "Worth the money", "Beautiful", "Very good"],
    3: ["It's okay", "Decent product", "Average", "Not bad", "Okayish"]
}

TEXTS = {
    5: [
        "I was so surprised by the quality! It looks so premium and beautiful. Will definitely buy again.",
        "Absolutely gorgeous piece. The finish is amazing and it feels so luxurious.",
        "I got this for my sister and she loved it. The packaging and the product are just perfect.",
        "Exactly as shown in the picture, maybe even better in person! So happy with my purchase."
    ],
    4: [
        "Really good quality for the price. Looks very pretty when worn.",
        "I like it! It's very elegant and matches perfectly with my outfits.",
        "Good product. The finish is nice and it feels sturdy."
    ],
    3: [
        "It's decent, but I expected a bit more based on the pictures. Still wearable.",
        "Okay product. Quality is fine but could be better."
    ]
}

def generate_reviews_for_rating(target_rating, num_reviews=3):
    ratings = []
    if target_rating >= 4.8:
        ratings = [5] * num_reviews
    elif target_rating >= 4.3:
        ratings = [5, 4, 5][:num_reviews]
        if num_reviews >= 3:
            random.shuffle(ratings)
    elif target_rating >= 3.8:
        ratings = [4] * num_reviews
    else:
        ratings = [4, 3, 4][:num_reviews]
    
    return ratings

def run():
    print("Fetching products...")
    res = requests.get(f"{SUPABASE_URL}/rest/v1/products?select=id,rating", headers=HEADERS)
    products = res.json()
    print(f"Found {len(products)} products.")

    print("Fetching a valid user_id for the foreign key...")
    auth_res = requests.get(f"{SUPABASE_URL}/rest/v1/user_profiles?select=id&limit=1", headers=HEADERS)
    user_id = None
    if auth_res.status_code == 200 and auth_res.json():
        user_id = auth_res.json()[0]['id']
    
    if not user_id:
        print("Could not find a valid user_id in user_profiles. Cannot insert reviews.")
        return

    print(f"Using user_id {user_id} as the base (names will be fake though).")

    all_reviews = []
    
    for p in products:
        target = p.get('rating', 5.0)
        num = random.choice([2, 3])
        ratings = generate_reviews_for_rating(target, num)
        
        for r_val in ratings:
            name = random.choice(INDIAN_NAMES)
            title = random.choice(TITLES.get(r_val, TITLES[4]))
            text = random.choice(TEXTS.get(r_val, TEXTS[4]))
            
            days_ago = random.randint(1, 180)
            created_at = (datetime.now() - timedelta(days=days_ago)).isoformat()

            all_reviews.append({
                "product_id": p['id'],
                "user_id": user_id,
                "reviewer_name": name,
                "rating": r_val,
                "title": title,
                "review_text": text,
                "created_at": created_at
            })

    print(f"Generated {len(all_reviews)} fake reviews. Inserting...")

    batch_size = 100
    for i in range(0, len(all_reviews), batch_size):
        batch = all_reviews[i:i+batch_size]
        ins_res = requests.post(f"{SUPABASE_URL}/rest/v1/reviews", headers=HEADERS, json=batch)
        if ins_res.status_code in (200, 201):
            print(f"Inserted batch {i//batch_size + 1}")
        else:
            print(f"Failed to insert batch {i//batch_size + 1}: {ins_res.text}")

    print("Done!")

if __name__ == "__main__":
    run()
