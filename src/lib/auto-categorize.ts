// Merchant keyword -> default category name. Matched against a transaction's
// merchant/description with case-insensitive regex when importing from a bank connection.
const EXPENSE_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Groceries: [
    "walmart", "whole foods", "trader joe", "kroger", "safeway", "costco",
    "aldi", "publix", "wegmans", "winco", "sprouts", "heb", "h-e-b", "meijer",
    "stop & shop", "stop and shop", "giant eagle", "food lion", "harris teeter",
    "vons", "albertsons", "food 4 less", "fred meyer", "smiths food", "king soopers",
    "save-a-lot", "grocery outlet", "market basket", "shoprite",
  ],
  Food: [
    "starbucks", "mcdonald", "chipotle", "subway", "burger king", "wendy",
    "taco bell", "kfc", "dunkin", "panera", "chick-fil-a", "chickfila",
    "domino", "pizza hut", "papa john", "doordash", "ubereats", "uber eats",
    "grubhub", "postmates", "five guys", "in-n-out", "shake shack",
    "panda express", "sonic drive", "jimmy john", "jersey mike", "olive garden",
    "chilis", "applebee", "denny's", "ihop", "cracker barrel",
    "cheesecake factory", "buffalo wild wings", "wingstop", "raising cane",
    "popeyes", "arby's", "qdoba", "noodles & company", "cava grill",
  ],
  Transportation: [
    "uber\\b(?!.*eats)", "lyft", "shell oil", "chevron", "exxon", "mobil gas",
    "circle k", "speedway", "7-eleven", "amtrak", "parking", "dmv",
    "bp gas", "valero", "sunoco", "phillips 66", "marathon petroleum",
    "citgo", "metro transit", "septa", "\\bmta\\b", "bart fare", "caltrain",
    "toll ", "e-zpass",
  ],
  Shopping: [
    "amazon", "target", "best buy", "ebay", "etsy", "ikea", "home depot",
    "lowe's", "lowes", "macy's", "nordstrom", "tj maxx", "marshalls",
    "ross stores", "old navy", "gap inc", "zara", "h&m", "nike",
    "kohl's", "shein", "aliexpress", "wayfair", "sephora", "ulta beauty",
    "dollar tree", "dollar general", "big lots", "office depot", "staples",
    "michaels stores", "hobby lobby", "petco", "petsmart", "gamestop",
  ],
  Entertainment: [
    "netflix", "hulu", "disney\\+", "disney plus", "spotify", "apple music",
    "youtube premium", "hbo max", "amc theatres", "regal cinema", "cinemark",
    "steam games", "playstation network", "xbox live", "nintendo eshop",
    "twitch", "ticketmaster", "stubhub", "audible", "kindle unlimited",
    "paramount\\+", "peacock tv",
  ],
  Travel: [
    "delta air", "united airlines", "american airlines", "southwest air",
    "jetblue", "spirit airlines", "alaska airlines", "frontier airlines",
    "airbnb", "marriott", "hilton hotel", "hyatt hotel", "expedia",
    "booking\\.com", "priceline", "enterprise rent", "hertz", "avis",
    "budget rental", "national car rental", "trivago", "vrbo",
  ],
  Education: [
    "tuition", "university", "college", "coursera", "udemy", "\\bedx\\b",
    "chegg", "student loan", "pearson education", "skillshare", "duolingo",
  ],
  Healthcare: [
    "cvs pharmacy", "walgreens", "rite aid", "kaiser permanente",
    "urgent care", "dental", "dentist", "clinic", "hospital", "pharmacy",
    "labcorp", "quest diagnostics", "planned parenthood", "vision center",
    "optometry",
  ],
  Utilities: [
    "comcast", "xfinity", "at&t", "verizon", "t-mobile", "sprint pcs",
    "spectrum", "con edison", "pg&e", "duke energy", "geico", "state farm",
    "progressive ins", "allstate", "mortgage payment", "liberty mutual",
    "nationwide insurance", "water utility", "electric utility",
    "gas utility", "internet service", "farmers insurance",
  ],
  Zelle: ["zelle"],
};

// Same idea, but for income — a payroll processor or a phrase like "direct
// deposit" is a strong signal the transaction is a paycheck, not just an
// unclassified deposit.
const INCOME_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Salary: [
    "payroll", "direct dep", "direct deposit", "\\bsalary\\b",
    "\\badp\\b", "gusto", "paychex", "\\bworkday\\b", "\\bdeel\\b", "rippling",
    "justworks", "biweekly pay", "\\bwages\\b",
  ],
  Freelance: [
    "upwork", "fiverr", "freelance", "\\b1099\\b", "contractor payment",
    "stripe payout", "paypal transfer", "square payout",
  ],
  Investment: [
    "dividend", "interest payment", "interest earned", "capital gain",
    "brokerage", "\\betrade\\b", "robinhood", "vanguard", "fidelity invest",
    "schwab",
  ],
  Refund: [
    "refund", "reimbursement", "cash back", "cashback", "rebate",
  ],
  Zelle: ["zelle"],
};

function buildPatterns(keywords: Record<string, string[]>) {
  return Object.entries(keywords).map(([category, terms]) => ({
    category,
    pattern: new RegExp(terms.join("|"), "i"),
  }));
}

const EXPENSE_CATEGORY_PATTERNS = buildPatterns(EXPENSE_CATEGORY_KEYWORDS);
const INCOME_CATEGORY_PATTERNS = buildPatterns(INCOME_CATEGORY_KEYWORDS);

function guessFrom(
  merchant: string | null | undefined,
  patterns: { category: string; pattern: RegExp }[]
): string | null {
  if (!merchant) return null;
  for (const { category, pattern } of patterns) {
    if (pattern.test(merchant)) return category;
  }
  return null;
}

/** Best-effort expense category guess from a merchant/description string. Null if nothing matches. */
export function guessCategoryName(merchant: string | null | undefined): string | null {
  return guessFrom(merchant, EXPENSE_CATEGORY_PATTERNS);
}

/** Best-effort income category guess from a merchant/description string. Null if nothing matches. */
export function guessIncomeCategoryName(merchant: string | null | undefined): string | null {
  return guessFrom(merchant, INCOME_CATEGORY_PATTERNS);
}
