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
  "Gorgeous!", "Beautiful", "Amazing quality", "Very pretty", 
  "Love it", "Exceeded expectations", "Worth every penny", "Just wow", 
  "Stunning", "Highly recommended", "Perfect gift", "So elegant", 
  "Premium feel", "Best purchase", "Lovely design", "Simply beautiful",
  "Looks expensive", "Fantastic buy", "absolutely stunning", "obsessed",
  "in love with this", "wow just wow", "my new fav", "perfect"
];

const TITLES_4 = [
  "Good quality", "Nice piece", "v good", "Pretty but slightly small", 
  "Worth buying", "Good value", "Beautiful", "Nice design", "Happy with it",
  "Looks nice", "Decent buy", "Quite elegant", "Really pretty", "nice",
  "like it"
];

const OPENINGS_5 = [
  "I just received this and I'm amazed",
  "Bought this last week for a family function",
  "Wow, I am so impressed with the quality",
  "Honestly, this is the best piece of jewellery I've bought online",
  "So happy with this purchase",
  "Beautiful piece",
  "I was a bit skeptical at first, but it's stunning",
  "My mother gifted this to me and I absolutely love it",
  "This exceeded all my expectations",
  "I've been wearing this every day since I got it",
  "got this today nd its so pretty",
  "omg i love this",
  "just received my order",
  "cant believe how good this looks",
  "such a pretty set"
];

const BODIES_5 = [
  "The finish is incredible and the shine is perfect",
  "It looks so much more expensive than it actually is",
  "The quality of the stones and plating is amazing",
  "It matches all my ethnic outfits perfectly",
  "It has a very premium and heavy feel to it, not flimsy at all",
  "The detailing and craftsmanship are just flawless",
  "I've received so many compliments whenever I wear it",
  "The polish hasn't faded at all even after wearing it to a sweaty summer wedding",
  "It sits perfectly on the neck and looks so graceful",
  "The colors are exactly as shown in the pictures, maybe even brighter",
  "looks exactly like the pic",
  "v premium finish and stone work is good",
  "packaging was really cute too",
  "fits perfectly nd looks v elegant",
  "wore it for a party nd everyone asked about it",
  "quality is actually 10/10",
  "shines so beautifully in the light"
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
  "Thank you for such a wonderful product.",
  "highly recommend!!",
  "gonna buy more soon",
  "loved it sm",
  "worth the money tbh",
  "totally worth it"
];

const OPENINGS_4 = [
  "This is a really nice product",
  "Bought this for my sister",
  "I like the design a lot",
  "Good purchase overall",
  "Received my order yesterday",
  "it's nice",
  "pretty good for the price"
];

const BODIES_4 = [
  "The quality is good for the price paid",
  "It looks very pretty, though the size is slightly smaller than expected",
  "The finish is nice and it feels quite sturdy",
  "Matches my outfit well and doesn't look cheap",
  "The design is elegant and subtle",
  "stone work is decent",
  "color is slightly different but still pretty"
];

const CLOSINGS_4 = [
  "Good value for money.",
  "Happy with the purchase.",
  "Would recommend.",
  "Overall a nice addition to my wardrobe.",
  "Delivery was on time.",
  "not bad at all",
  "happy with it"
];

const EMOJIS = [" 😍", " ✨", " ❤️", " 💕", " 💖", " 🤌", " 🧿", " 🔥"];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Randomly apply human-like imperfections to text
function humanizeText(text, isClosing = false) {
  let result = text;
  
  // Randomly lowercase the entire sentence (30% chance)
  if (Math.random() < 0.3) {
    result = result.toLowerCase();
  } else if (Math.random() < 0.2) {
    // Or just lowercase the first letter (20% chance)
    result = result.charAt(0).toLowerCase() + result.slice(1);
  }

  // Random punctuation at the end of the clause
  if (!isClosing && Math.random() < 0.5) {
    result += "."; // Add a period sometimes if it's a body/opening
  } else if (!isClosing && Math.random() < 0.2) {
    result += ","; // Add a comma sometimes
  }

  // Add random emojis (25% chance)
  if (Math.random() < 0.25) {
    result += randomChoice(EMOJIS);
  }
  
  return result;
}

function generateReviewText(rating) {
  const openings = rating === 5 ? OPENINGS_5 : OPENINGS_4;
  const bodies = rating === 5 ? BODIES_5 : BODIES_4;
  const closings = rating === 5 ? CLOSINGS_5 : CLOSINGS_4;

  let text = "";
  const rand = Math.random();
  
  if (rand < 0.2) {
    text = humanizeText(randomChoice(bodies), true);
  } else if (rand < 0.5) {
    text = `${humanizeText(randomChoice(bodies))} ${humanizeText(randomChoice(closings), true)}`;
  } else if (rand < 0.8) {
    text = `${humanizeText(randomChoice(openings))} ${humanizeText(randomChoice(bodies), true)}`;
  } else {
    let body1 = randomChoice(bodies);
    let body2 = randomChoice(bodies);
    while (body1 === body2 && bodies.length > 1) body2 = randomChoice(bodies);
    text = `${humanizeText(randomChoice(openings))} ${humanizeText(body1)} ${humanizeText(body2)} ${humanizeText(randomChoice(closings), true)}`;
  }

  // Sometimes forget to add a space after a period (10% chance)
  if (Math.random() < 0.1) {
    text = text.replace(/\. /g, ".");
  }
  
  // Randomly replace "and" with "nd" or "&"
  if (Math.random() < 0.3) {
    text = text.replace(/\band\b/g, Math.random() < 0.5 ? "nd" : "&");
  }

  return text;
}

function generateTitle(rating) {
  let title = rating === 5 ? randomChoice(TITLES_5) : randomChoice(TITLES_4);
  
  if (Math.random() < 0.4) {
    title = title.toLowerCase();
  }
  if (Math.random() < 0.2) {
    title += randomChoice(EMOJIS);
  }
  return title;
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
    ratings = Array(numReviews).fill(4);
  }
  return ratings;
}

export async function generateFakeReviews(productId, targetRating = 5.0, supabase) {
  try {
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      
    if (authError || !users || users.length === 0) {
      console.log('No users found in auth database, skipping review generation.');
      return;
    }
    const userId = users[0].id;

    const numReviews = Math.random() > 0.5 ? 3 : 2; // 2 or 3 reviews
    const ratings = generateReviewsForRating(targetRating, numReviews);

    // Keep track of names used for THIS product to avoid duplicates
    const usedNames = new Set();

    const generatedReviews = ratings.map(rating => {
      let name;
      // Find a name that hasn't been used for this product yet
      do {
        name = randomChoice(FEMALE_NAMES);
      } while (usedNames.has(name));
      usedNames.add(name);

      if (Math.random() > 0.7) {
        name += ` ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}.`;
      }
      
      const title = generateTitle(rating);
      const text = generateReviewText(rating);
      
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
