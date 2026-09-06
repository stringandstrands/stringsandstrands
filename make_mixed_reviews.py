import requests
import random
from collections import defaultdict

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
    "Prefer": "resolution=merge-duplicates"
}

FEMALE_NAMES = [
    "Priya", "Sneha", "Neha", "Anjali", "Pooja", "Divya", "Megha", "Riya", 
    "Swati", "Kavya", "Aarti", "Simran", "Nisha", "Ishita", "Kriti", "Sonal", 
    "Shruti", "Priyanka", "Kiran", "Tanya", "Aditi", "Shreya", "Ananya", 
    "Tanvi", "Ruchi", "Nidhi", "Sonam", "Radhika", "Ritu", "Meenakshi", 
    "Sunita", "Preeti", "Richa", "Pallavi", "Shilpa", "Aishwarya", "Karishma", 
    "Manisha", "Nikita", "Shalini", "Vandana", "Jyoti", "Deepika", "Sonali", 
    "Suman", "Sushma", "Reena", "Anu", "Anushka", "Gauri", "Bhavna", "Anita"
]

TITLES_5 = [
    "Gorgeous!", "Beautiful jewellery", "Amazing quality", "Very pretty", 
    "Love it", "Exceeded expectations", "Worth every penny", "Just wow", 
    "Stunning piece", "Highly recommended", "Perfect gift", "So elegant", 
    "Premium feel", "Best purchase", "Lovely design", "Simply beautiful",
    "Looks expensive", "Fantastic buy", "Absolutely stunning"
]

TITLES_4 = [
    "Good quality", "Nice piece", "Very good", "Pretty but slightly small", 
    "Worth buying", "Good value", "Beautiful", "Nice design", "Happy with it",
    "Looks nice", "Decent buy", "Quite elegant", "Really pretty"
]

TITLES_3 = [
    "It's okay", "Decent", "Good value", "Looks good", 
    "Not bad", "Fine for the price", "Okay product", "Nice"
]

OPENINGS_5 = [
    "I just received this and I'm amazed.",
    "Bought this last week for a family function.",
    "Wow, I am so impressed with the quality.",
    "Honestly, this is the best piece of jewellery I've bought online.",
    "So happy with this purchase!",
    "Beautiful piece of jewellery!",
    "I was a bit skeptical at first, but it's stunning.",
    "My mother gifted this to me and I absolutely love it.",
    "This exceeded all my expectations.",
    "I've been wearing this every day since I got it."
]

BODIES_5 = [
    "The finish is incredible and the shine is perfect.",
    "It looks so much more expensive than it actually is.",
    "The quality of the stones and plating is amazing.",
    "It matches all my ethnic outfits perfectly.",
    "It has a very premium and heavy feel to it, not flimsy at all.",
    "The detailing and craftsmanship are just flawless.",
    "I've received so many compliments whenever I wear it.",
    "The polish hasn't faded at all even after wearing it to a sweaty summer wedding.",
    "It sits perfectly on the neck and looks so graceful.",
    "The colors are exactly as shown in the pictures, maybe even brighter."
]

CLOSINGS_5 = [
    "Highly recommend it to everyone!",
    "Will definitely be buying more from Strings and Strands.",
    "Fast delivery and beautiful packaging too.",
    "Love it! Going to buy the matching earrings next.",
    "My mom loved it as a gift.",
    "Definitely my new favorite piece in my collection.",
    "10/10 would buy again.",
    "If you're thinking about buying it, just go for it!",
    "Very satisfied customer here.",
    "Thank you for such a wonderful product."
]

OPENINGS_4 = [
    "This is a really nice product.",
    "Bought this for my sister.",
    "I like the design a lot.",
    "Good purchase overall.",
    "Received my order yesterday."
]

BODIES_4 = [
    "The quality is good for the price paid.",
    "It looks very pretty, though the size is slightly smaller than expected.",
    "The finish is nice and it feels quite sturdy.",
    "Matches my outfit well and doesn't look cheap.",
    "The design is elegant and subtle."
]

CLOSINGS_4 = [
    "Good value for money.",
    "Happy with the purchase.",
    "Would recommend.",
    "Overall a nice addition to my wardrobe.",
    "Delivery was on time."
]

OPENINGS_3 = [
    "The product is nice.",
    "It's decent and looks fine.",
    "Good purchase.",
    "Pretty design."
]

BODIES_3 = [
    "The design is quite good.",
    "Looks like the pictures.",
    "The quality is fine for the price.",
    "It's good for occasional wear."
]

CLOSINGS_3 = [
    "Decent for the price.",
    "Overall not bad.",
    "Satisfied with it.",
    "Fast delivery too."
]

SHORT_REVIEWS_5 = ["Good", "Beautiful", "Very nice", "Loved it", "Awesome", "Pretty", "Nice", "Superb", "Amazing"]
SHORT_REVIEWS_4 = ["Good", "Nice", "Pretty", "Value for money", "Okay", "Looks nice", "Fine"]
SHORT_REVIEWS_3 = ["Okay", "Average", "Decent", "Not bad", "Fine"]

def generate_review_text(rating, is_short):
    if is_short:
        if rating == 5: return random.choice(SHORT_REVIEWS_5)
        elif rating == 4: return random.choice(SHORT_REVIEWS_4)
        else: return random.choice(SHORT_REVIEWS_3)
    else:
        if rating == 5: return f"{random.choice(OPENINGS_5)} {random.choice(BODIES_5)} {random.choice(CLOSINGS_5)}"
        elif rating == 4: return f"{random.choice(OPENINGS_4)} {random.choice(BODIES_4)} {random.choice(CLOSINGS_4)}"
        else: return f"{random.choice(OPENINGS_3)} {random.choice(BODIES_3)} {random.choice(CLOSINGS_3)}"

def generate_title(rating, is_short, text):
    # If it's a short review, often the title is just the same or very similar
    if is_short:
        if random.random() > 0.5:
            return text
        else:
            if rating == 5: return random.choice(TITLES_5)
            elif rating == 4: return random.choice(TITLES_4)
            else: return random.choice(TITLES_3)
            
    if rating == 5: return random.choice(TITLES_5)
    elif rating == 4: return random.choice(TITLES_4)
    else: return random.choice(TITLES_3)

def run():
    print("Fetching all existing reviews...")
    res = requests.get(f"{SUPABASE_URL}/rest/v1/reviews?select=*", headers=HEADERS)
    reviews = res.json()
    print(f"Found {len(reviews)} reviews.")

    # Group reviews by product
    by_product = defaultdict(list)
    for r in reviews:
        by_product[r['product_id']].append(r)

    name_pool = FEMALE_NAMES.copy()
    
    updated_reviews = []
    
    for product_id, prod_reviews in by_product.items():
        # Determine how many should be short
        num_reviews = len(prod_reviews)
        num_short = 1 if num_reviews == 2 else random.choice([1, 2])
        
        # shuffle to randomly assign short/long
        random.shuffle(prod_reviews)
        
        for i, r in enumerate(prod_reviews):
            is_short = (i < num_short)
            
            # Generate new name
            if not name_pool:
                name_pool = FEMALE_NAMES.copy()
                random.shuffle(name_pool)
            name = name_pool.pop(random.randint(0, len(name_pool)-1))
            if random.random() > 0.7:
                name += f" {random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}."
            
            rating = r['rating']
            new_text = generate_review_text(rating, is_short)
            new_title = generate_title(rating, is_short, new_text)
            
            r['reviewer_name'] = name
            r['title'] = new_title
            r['review_text'] = new_text
            
            updated_reviews.append(r)

    print("Pushing bulk update to Supabase...")
    upsert_res = requests.post(f"{SUPABASE_URL}/rest/v1/reviews?on_conflict=id", headers=HEADERS, json=updated_reviews)
    
    if upsert_res.status_code in (200, 201, 204):
        print("Successfully updated reviews with mixed lengths!")
    else:
        print(f"Failed to update. Status: {upsert_res.status_code}, Response: {upsert_res.text}")

if __name__ == "__main__":
    run()
