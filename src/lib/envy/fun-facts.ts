export interface FunFact {
  fact: string
  source: string
  category:
    | "industry"
    | "revenue"
    | "trends"
    | "history"
    | "psychology"
    | "technology"
}

export const SALON_FUN_FACTS: FunFact[] = [
  // --- INDUSTRY ---
  {
    fact: "The US hair salon industry generates over $48 billion in revenue annually.",
    source: "IBISWorld, 2024",
    category: "industry",
  },
  {
    fact: "There are approximately 1.2 million hair salons operating in the United States.",
    source: "IBISWorld, 2024",
    category: "industry",
  },
  {
    fact: "The beauty and personal care services industry employs over 1.6 million people in the US.",
    source: "Bureau of Labor Statistics, 2024",
    category: "industry",
  },
  {
    fact: "Roughly 86% of salon businesses in the US have fewer than 10 employees.",
    source: "IBISWorld, 2023",
    category: "industry",
  },
  {
    fact: "The US salon industry has grown at an average annual rate of 1.5% over the past five years.",
    source: "IBISWorld, 2024",
    category: "industry",
  },
  {
    fact: "California, Texas, and Florida are the top three states by number of salon establishments.",
    source: "Bureau of Labor Statistics, 2023",
    category: "industry",
  },
  {
    fact: "The global beauty salon market is projected to reach $383 billion by 2030.",
    source: "Grand View Research, 2023",
    category: "industry",
  },
  {
    fact: "Women account for approximately 77% of all salon visits in the United States.",
    source: "Professional Beauty Association, 2023",
    category: "industry",
  },
  {
    fact: "The average American woman spends roughly $3,756 per year on beauty services and products.",
    source: "Groupon Survey, 2017",
    category: "industry",
  },
  {
    fact: "Barbershops and men's grooming salons are the fastest-growing segment of the salon industry.",
    source: "IBISWorld, 2024",
    category: "industry",
  },

  // --- REVENUE ---
  {
    fact: "The average salon generates about $245,000 in annual revenue.",
    source: "Salon Today 200 Report, 2023",
    category: "revenue",
  },
  {
    fact: "Retail product sales account for 15-20% of total salon revenue on average.",
    source: "Professional Beauty Association, 2023",
    category: "revenue",
  },
  {
    fact: "Color services are the highest-margin offering for most salons, with margins exceeding 60%.",
    source: "Salon Today, 2023",
    category: "revenue",
  },
  {
    fact: "Salons that actively upsell retail products see 30% higher revenue per client visit.",
    source: "Professional Beauty Association, 2022",
    category: "revenue",
  },
  {
    fact: "The average ticket price for a salon visit in the US is $45-$65.",
    source: "Statista, 2024",
    category: "revenue",
  },
  {
    fact: "Hair coloring services have grown 25% in demand over the past decade.",
    source: "Mintel, 2023",
    category: "revenue",
  },
  {
    fact: "Salons with membership or subscription models report 20-35% higher client retention rates.",
    source: "Salon Today, 2023",
    category: "revenue",
  },
  {
    fact: "The average salon spends 8-12% of revenue on marketing and advertising.",
    source: "Professional Beauty Association, 2023",
    category: "revenue",
  },
  {
    fact: "Tipping in US salons averages 18-22% of the service price.",
    source: "Square Tipping Data Report, 2023",
    category: "revenue",
  },
  {
    fact: "The average salon owner in the US earns between $35,000 and $70,000 annually.",
    source: "Bureau of Labor Statistics, 2023",
    category: "revenue",
  },

  // --- TRENDS ---
  {
    fact: "73% of salon clients book their next appointment at checkout.",
    source: "Salon Today, 2023",
    category: "trends",
  },
  {
    fact: "Salons that offer online booking see 26% more appointments than those that do not.",
    source: "Mindbody Industry Report, 2023",
    category: "trends",
  },
  {
    fact: "67% of millennials prefer to book salon appointments online or via an app.",
    source: "Zenoti Salon Consumer Survey, 2023",
    category: "trends",
  },
  {
    fact: "No-show rates at salons average 10-15% without automated reminders.",
    source: "Phorest Salon Software Report, 2023",
    category: "trends",
  },
  {
    fact: "Automated appointment reminders reduce salon no-shows by up to 40%.",
    source: "Mindbody Industry Report, 2023",
    category: "trends",
  },
  {
    fact: "The average salon client visits every 6-8 weeks.",
    source: "Professional Beauty Association, 2023",
    category: "trends",
  },
  {
    fact: "82% of consumers say they read online reviews before choosing a salon.",
    source: "BrightLocal Consumer Review Survey, 2023",
    category: "trends",
  },
  {
    fact: "Sustainable and eco-friendly salon practices are a top priority for 48% of Gen Z consumers.",
    source: "Mintel Beauty Trends, 2024",
    category: "trends",
  },
  {
    fact: "The demand for gender-neutral salons has increased by 35% since 2020.",
    source: "Salon Today, 2023",
    category: "trends",
  },
  {
    fact: "Walk-in clients convert to regular clients at a rate of only 15-20%, compared to 50-60% for referred clients.",
    source: "Phorest Salon Software Report, 2023",
    category: "trends",
  },

  // --- HISTORY ---
  {
    fact: "The first modern hair salon opened in Paris in 1635 and was exclusively for men.",
    source: "Encyclopedia of Hair: A Cultural History",
    category: "history",
  },
  {
    fact: "Martha Matilda Harper invented the franchise business model in 1891 through her chain of hair salons.",
    source: "American History Magazine",
    category: "history",
  },
  {
    fact: "Madam C.J. Walker became America's first self-made female millionaire through her line of hair care products for Black women in the early 1900s.",
    source: "Guinness World Records / A'Lelia Bundles biography",
    category: "history",
  },
  {
    fact: "The permanent wave machine was invented by Karl Nessler in 1906 and weighed over 2,000 pounds.",
    source: "Smithsonian National Museum of American History",
    category: "history",
  },
  {
    fact: "Hair dryers were first introduced in salons in the 1920s, adapted from industrial vacuum cleaner technology.",
    source: "Professional Beauty Association Historical Archives",
    category: "history",
  },
  {
    fact: "The bob haircut became a cultural phenomenon in the 1920s, with some salons reporting a 300% increase in cutting services.",
    source: "Vogue Archives / Fashion History Timeline",
    category: "history",
  },
  {
    fact: "The beauty salon industry in the US boomed after World War II as women entered the workforce in large numbers.",
    source: "Bureau of Labor Statistics Historical Data",
    category: "history",
  },
  {
    fact: "The word 'salon' comes from the Italian 'salone,' meaning a large hall or reception room.",
    source: "Oxford English Dictionary",
    category: "history",
  },
  {
    fact: "Ancient Egyptians were among the first to use henna as a hair dye, dating back to 1500 BCE.",
    source: "Encyclopedia Britannica",
    category: "history",
  },
  {
    fact: "The first cosmetology licensing laws in the US were enacted in the 1930s to standardize safety practices.",
    source: "Professional Beauty Association",
    category: "history",
  },

  // --- PSYCHOLOGY ---
  {
    fact: "A study found that 71% of women feel more confident after a salon visit.",
    source: "Dove Global Beauty and Confidence Report, 2016",
    category: "psychology",
  },
  {
    fact: "The relationship between a client and their hairstylist is rated as one of the most trusted professional relationships, comparable to a doctor-patient bond.",
    source: "Psychology Today, 2021",
    category: "psychology",
  },
  {
    fact: "Hair salon visits are cited as a form of self-care therapy by 58% of regular salon clients.",
    source: "Mintel Beauty Consumer Report, 2023",
    category: "psychology",
  },
  {
    fact: "Studies show that a good hair day increases self-esteem and decreases social insecurity.",
    source: "Yale University Psychology Department Study",
    category: "psychology",
  },
  {
    fact: "The average client stays with the same stylist for 8 years.",
    source: "Salon Today, 2022",
    category: "psychology",
  },
  {
    fact: "63% of salon clients say their stylist knows personal details about their life that close friends do not.",
    source: "Salon Today Consumer Survey, 2022",
    category: "psychology",
  },
  {
    fact: "A significant haircut or color change is commonly associated with major life transitions like breakups, new jobs, or moves.",
    source: "Psychology Today, 2020",
    category: "psychology",
  },
  {
    fact: "Scent plays a key role in salon experience: 74% of clients associate specific scents with their favorite salon.",
    source: "Mintel Sensory Beauty Report, 2022",
    category: "psychology",
  },

  // --- TECHNOLOGY ---
  {
    fact: "Only 35% of salons used online booking software in 2018, compared to over 70% in 2024.",
    source: "Mindbody Industry Report, 2024",
    category: "technology",
  },
  {
    fact: "Salons using point-of-sale systems integrated with booking see 18% faster checkout times.",
    source: "Square Seller Insights, 2023",
    category: "technology",
  },
  {
    fact: "Social media drives 40% of new client acquisition for independent salons.",
    source: "Sprout Social Beauty Industry Report, 2023",
    category: "technology",
  },
  {
    fact: "Instagram is the number one social platform for salon client discovery, with 72% of clients finding new salons through the platform.",
    source: "Salon Today Digital Marketing Survey, 2023",
    category: "technology",
  },
  {
    fact: "Salons that accept contactless payments report 12% higher average transaction values.",
    source: "Square Seller Insights, 2023",
    category: "technology",
  },
  {
    fact: "AI-powered virtual try-on tools for hair color have increased color service bookings by 15-20% at salons that offer them.",
    source: "L'Oreal Professional Digital Report, 2023",
    category: "technology",
  },
  {
    fact: "Text message marketing campaigns have a 98% open rate for salons, compared to 20% for email.",
    source: "SimpleTexting Industry Report, 2023",
    category: "technology",
  },
  {
    fact: "Salons using automated review request systems generate 4x more online reviews than those that do not.",
    source: "Podium Salon Industry Report, 2023",
    category: "technology",
  },
  {
    fact: "Cloud-based salon software adoption has grown from 22% in 2019 to over 60% in 2024.",
    source: "Statista Digital Market Outlook, 2024",
    category: "technology",
  },
  {
    fact: "Salons that send personalized product recommendations via email see a 28% increase in retail sales.",
    source: "Phorest Salon Software Report, 2023",
    category: "technology",
  },
]
