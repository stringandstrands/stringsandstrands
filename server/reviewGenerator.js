// ─────────────────────────────────────────────────────────────────────────────
// reviewGenerator.js
// ─────────────────────────────────────────────────────────────────────────────

const FEMALE_NAMES = [
  "Priya", "Sneha", "Neha", "Anjali", "Pooja", "Divya", "Megha", "Riya", 
  "Swati", "Kavya", "Aarti", "Simran", "Nisha", "Ishita", "Kriti", "Sonal", 
  "Shruti", "Priyanka", "Kiran", "Tanya", "Aditi", "Shreya", "Ananya", 
  "Tanvi", "Ruchi", "Nidhi", "Sonam", "Radhika", "Ritu", "Meenakshi", 
  "Sunita", "Preeti", "Richa", "Pallavi", "Shilpa", "Aishwarya", "Karishma", 
  "Manisha", "Nikita", "Shalini", "Vandana", "Jyoti", "Deepika", "Sonali", 
  "Suman", "Sushma", "Reena", "Anu", "Anushka", "Gauri", "Bhavna", "Anita"
];

const TITLES_5 = [
  "Gorgeous!", "Beautiful jewellery", "Amazing quality", "Very pretty", 
  "Love it", "Exceeded expectations", "Worth every penny", "Just wow", 
  "Stunning piece", "Highly recommended", "Perfect gift", "So elegant", 
  "Premium feel", "Best purchase", "Lovely design", "Simply beautiful",
  "Looks expensive", "Fantastic buy", "Absolutely stunning"
];

const TITLES_4 = [
  "Good quality", "Nice piece", "Very good", "Pretty but slightly small", 
  "Worth buying", "Good value", "Beautiful", "Nice design", "Happy with it",
  "Looks nice", "Decent buy", "Quite elegant", "Really pretty"
];



const OPENINGS_5 = [
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
];

const BODIES_5 = [
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
];

const CLOSINGS_5 = [
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
];

const OPENINGS_4 = [
  "This is a really nice product.",
  "Bought this for my sister.",
  "I like the design a lot.",
  "Good purchase overall.",
  "Received my order yesterday."
];

const BODIES_4 = [
  "The quality is good for the price paid.",
  "It looks very pretty, though the size is slightly smaller than expected.",
  "The finish is nice and it feels quite sturdy.",
  "Matches my outfit well and doesn't look cheap.",
  "The design is elegant and subtle."
];

const CLOSINGS_4 = [
  "Good value for money.",
  "Happy with the purchase.",
  "Would recommend.",
  "Overall a nice addition to my wardrobe.",
  "Delivery was on time."
];



function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReviewText(rating) {
  const openings = rating === 5 ? OPENINGS_5 : OPENINGS_4;
  const bodies = rating === 5 ? BODIES_5 : BODIES_4;
  const closings = rating === 5 ? CLOSINGS_5 : CLOSINGS_4;

  const rand = Math.random();
  if (rand < 0.2) {
    // Small: Just a body
    return randomChoice(bodies);
  } else if (rand < 0.5) {
    // Medium: Body + Closing
    return `${randomChoice(bodies)} ${randomChoice(closings)}`;
  } else if (rand < 0.8) {
    // Medium: Opening + Body
    return `${randomChoice(openings)} ${randomChoice(bodies)}`;
  } else {
    // Large: Opening + Two bodies + Closing
    let body1 = randomChoice(bodies);
    let body2 = randomChoice(bodies);
    while (body1 === body2 && bodies.length > 1) body2 = randomChoice(bodies);
    return `${randomChoice(openings)} ${body1} ${body2} ${randomChoice(closings)}`;
  }
}

function generateTitle(rating) {
  if (rating === 5) return randomChoice(TITLES_5);
  else return randomChoice(TITLES_4);
}

function generateReviewsForRating(targetRating, numReviews) {
  let ratings = [];
  if (targetRating >= 4.8) {
    ratings = Array(numReviews).fill(5);
  } else if (targetRating >= 4.0) {
    ratings = [5, 4, 5].slice(0, numReviews);
    if (numReviews >= 3) {
      ratings.sort(() => Math.random() - 0.5);
    }
  } else {
    // No negative reviews, keep everything 4-star positive minimum
    ratings = Array(numReviews).fill(4);
  }
  return ratings;
}

export async function generateFakeReviews(productId, targetRating = 5.0, supabase) {
  try {
    // 1. Fetch a valid user_id for the foreign key
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
      
    if (!profiles || profiles.length === 0) {
      console.log('No user profile found, skipping review generation.');
      return;
    }
    const userId = profiles[0].id;

    const numReviews = Math.random() > 0.5 ? 3 : 2; // 2 or 3 reviews
    const ratings = generateReviewsForRating(targetRating, numReviews);

    const generatedReviews = ratings.map(rating => {
      let name = randomChoice(FEMALE_NAMES);
      if (Math.random() > 0.7) {
        name += ` ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}.`;
      }
      
      const title = generateTitle(rating);
      const text = generateReviewText(rating);
      
      // Random date between 1 and 180 days ago
      const daysAgo = Math.floor(Math.random() * 180) + 1;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      return {
        product_id: productId,
        user_id: userId,
        reviewer_name: name,
        rating: rating,
        title: title,
        review_text: text,
        created_at: createdAt
      };
    });

    const { error } = await supabase
      .from('reviews')
      .insert(generatedReviews);

    if (error) {
      console.error('Error inserting auto-generated reviews:', error);
    } else {
      console.log(`Successfully generated ${numReviews} reviews for product ${productId}`);
    }
  } catch (error) {
    console.error('Failed to generate fake reviews:', error);
  }
}
