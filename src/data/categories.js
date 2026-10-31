// Topic catalogue. `id` matches the question bank file name in ./questions,
// `prefix` is the question-id prefix used inside that file.
export const CATEGORIES = [
  { id: "india-history", prefix: "ih", name: "Indian History", hi: "भारतीय इतिहास", icon: "landmark", color: "#f59e0b", blurb: "Empires, freedom struggle & milestones" },
  { id: "world-history", prefix: "wh", name: "World History", hi: "विश्व इतिहास", icon: "globe", color: "#fb923c", blurb: "Civilisations, wars & revolutions" },
  { id: "geography", prefix: "geo", name: "Geography", hi: "भूगोल", icon: "map", color: "#22c55e", blurb: "Rivers, capitals, mountains & maps" },
  { id: "science", prefix: "sci", name: "Science", hi: "विज्ञान", icon: "flask", color: "#06b6d4", blurb: "Physics, chemistry & biology" },
  { id: "space", prefix: "spc", name: "Space & Astronomy", hi: "अंतरिक्ष", icon: "rocket", color: "#818cf8", blurb: "Planets, stars, ISRO & NASA" },
  { id: "cricket", prefix: "cr", name: "Cricket", hi: "क्रिकेट", icon: "cricket", color: "#10b981", blurb: "Legends, records & World Cups" },
  { id: "sports", prefix: "spo", name: "Sports & Games", hi: "खेल", icon: "trophy", color: "#eab308", blurb: "Olympics, football, chess & more" },
  { id: "cinema", prefix: "cin", name: "Bollywood & Cinema", hi: "सिनेमा", icon: "clapper", color: "#ec4899", blurb: "Films, stars, songs & dialogues" },
  { id: "music-arts", prefix: "mus", name: "Music & Arts", hi: "संगीत व कला", icon: "music", color: "#d946ef", blurb: "Ragas, instruments, painters & dance" },
  { id: "mythology", prefix: "myth", name: "Mythology", hi: "पौराणिक कथाएँ", icon: "flame", color: "#f97316", blurb: "Ramayana, Mahabharata & world myths" },
  { id: "literature", prefix: "lit", name: "Literature & Language", hi: "साहित्य", icon: "book", color: "#a78bfa", blurb: "Authors, poets, idioms & words" },
  { id: "polity", prefix: "pol", name: "Polity & Constitution", hi: "राजव्यवस्था", icon: "scale", color: "#60a5fa", blurb: "Constitution, Parliament & governance" },
  { id: "economy", prefix: "eco", name: "Business & Economy", hi: "अर्थव्यवस्था", icon: "trending", color: "#34d399", blurb: "Brands, banking, money & markets" },
  { id: "technology", prefix: "tech", name: "Technology", hi: "प्रौद्योगिकी", icon: "cpu", color: "#38bdf8", blurb: "Computers, internet & inventions" },
  { id: "culture", prefix: "cul", name: "Culture, Food & Festivals", hi: "संस्कृति", icon: "sparkles", color: "#f472b6", blurb: "Festivals, cuisine, crafts & traditions" },
  { id: "nature", prefix: "nat", name: "Nature & Wildlife", hi: "प्रकृति", icon: "leaf", color: "#84cc16", blurb: "Animals, plants & national parks" },
  { id: "health", prefix: "hlth", name: "Human Body & Health", hi: "स्वास्थ्य", icon: "heart", color: "#ef4444", blurb: "Anatomy, nutrition & medicine" },
  { id: "math", prefix: "math", name: "Maths & Logic", hi: "गणित", icon: "sigma", color: "#14b8a6", blurb: "Numbers, puzzles & mathematicians" },
  { id: "everyday", prefix: "ev", name: "Everyday & Pop Culture", hi: "रोज़मर्रा", icon: "coffee", color: "#fbbf24", blurb: "Daily life, phrases, brands & TV" },
  { id: "personalities", prefix: "per", name: "Famous Personalities", hi: "व्यक्तित्व", icon: "star", color: "#facc15", blurb: "Achievers, awards & nicknames" },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// Relevance levels shown on the Topics screen and their sampling weight.
export const RELEVANCE_LEVELS = [
  { value: 0, label: "Off", weight: 0 },
  { value: 1, label: "Low", weight: 0.45 },
  { value: 2, label: "Normal", weight: 1 },
  { value: 3, label: "High", weight: 2.2 },
  { value: 4, label: "Max", weight: 4 },
];

export const DEFAULT_RELEVANCE = 2;

export const TOPIC_PRESETS = [
  { id: "balanced", name: "Balanced", desc: "Every topic equally likely", values: {} },
  {
    id: "desi",
    name: "Desi Special",
    desc: "India-first: history, polity, cinema, cricket, culture",
    values: { "india-history": 4, polity: 3, cinema: 3, cricket: 3, culture: 3, mythology: 3, "world-history": 1, space: 1 },
  },
  {
    id: "geek",
    name: "Science Geek",
    desc: "Science, space, technology, maths & health",
    values: { science: 4, space: 4, technology: 4, math: 3, health: 3, nature: 3, cinema: 1, cricket: 1, mythology: 1 },
  },
  {
    id: "entertainment",
    name: "Masala Mix",
    desc: "Cinema, music, sports & pop culture",
    values: { cinema: 4, "music-arts": 3, cricket: 4, sports: 3, everyday: 3, personalities: 3, polity: 1, economy: 1, math: 1 },
  },
  {
    id: "scholar",
    name: "UPSC Mode",
    desc: "History, polity, geography & economy heavy",
    values: { "india-history": 4, polity: 4, geography: 4, economy: 3, "world-history": 3, culture: 3, cinema: 1, cricket: 1, everyday: 1 },
  },
];
