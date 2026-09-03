import requests

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

NAME_MAP = {
    "Rahul": "Aarti",
    "Amit": "Simran",
    "Rohan": "Nisha",
    "Vikram": "Ishita",
    "Karan": "Kriti",
    "Suresh": "Sonal",
    "Karthik": "Shruti",
    "Manish": "Priyanka",
    "Aditya": "Kiran",
    "Deepak": "Tanya"
}

def run():
    print("Fetching reviews...")
    res = requests.get(f"{SUPABASE_URL}/rest/v1/reviews?select=id,reviewer_name", headers=HEADERS)
    reviews = res.json()
    print(f"Found {len(reviews)} reviews.")

    updates = []
    for r in reviews:
        if r['reviewer_name'] in NAME_MAP:
            new_name = NAME_MAP[r['reviewer_name']]
            # Update individual review
            upd = requests.patch(f"{SUPABASE_URL}/rest/v1/reviews?id=eq.{r['id']}", headers=HEADERS, json={"reviewer_name": new_name})
            if upd.status_code in (200, 204):
                updates.append((r['reviewer_name'], new_name))
            else:
                print("Failed to update:", upd.text)

    print(f"Successfully updated {len(updates)} names from male to female.")

if __name__ == "__main__":
    run()
