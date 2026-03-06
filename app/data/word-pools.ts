// Category definitions per grade
export interface Category {
  id: string;
  name: string;
  icon: string;
}

// All categories available across all grades
const ALL_CATEGORIES: Record<string, Category> = {
  animals: { id: "animals", name: "Animals", icon: "🐾" },
  colors: { id: "colors", name: "Colors", icon: "🎨" },
  shapes: { id: "shapes", name: "Shapes", icon: "🔷" },
  numbers: { id: "numbers", name: "Numbers", icon: "🔢" },
  family: { id: "family", name: "Family", icon: "👨‍👩‍👧" },
  body: { id: "body", name: "Body Parts", icon: "🖐️" },
  food: { id: "food", name: "Food", icon: "🍎" },
  weather: { id: "weather", name: "Weather", icon: "☀️" },
  toys: { id: "toys", name: "Toys", icon: "🧸" },
  clothes: { id: "clothes", name: "Clothes", icon: "👕" },
  nature: { id: "nature", name: "Nature", icon: "🌿" },
  actions: { id: "actions", name: "Actions", icon: "🏃" },
  school: { id: "school", name: "School", icon: "🏫" },
  transport: { id: "transport", name: "Transportation", icon: "🚗" },
  space: { id: "space", name: "Space", icon: "🚀" },
  jobs: { id: "jobs", name: "Jobs", icon: "👷" },
  science: { id: "science", name: "Science", icon: "🔬" },
  geography: { id: "geography", name: "Geography", icon: "🌍" },
  history: { id: "history", name: "History", icon: "🏰" },
  technology: { id: "technology", name: "Technology", icon: "💻" },
};

// Categories available per grade (progressively more)
const GRADE_CATEGORIES: Record<string, string[]> = {
  k: ["animals", "colors", "shapes", "numbers", "family", "body", "food", "weather", "toys", "clothes", "nature", "actions"],
  "1": ["animals", "colors", "shapes", "numbers", "family", "body", "food", "weather", "toys", "clothes", "nature", "actions", "school", "transport"],
  "2": ["animals", "colors", "shapes", "numbers", "family", "body", "food", "weather", "toys", "clothes", "nature", "actions", "school", "transport", "space", "jobs"],
  "3": ["animals", "colors", "shapes", "numbers", "family", "body", "food", "weather", "toys", "clothes", "nature", "actions", "school", "transport", "space", "jobs", "science", "geography"],
  "4": ["animals", "colors", "shapes", "numbers", "family", "body", "food", "weather", "toys", "clothes", "nature", "actions", "school", "transport", "space", "jobs", "science", "geography", "history"],
  "5": ["animals", "colors", "shapes", "numbers", "family", "body", "food", "weather", "toys", "clothes", "nature", "actions", "school", "transport", "space", "jobs", "science", "geography", "history", "technology"],
};

export function getCategoriesForGrade(grade: string): Category[] {
  const categoryIds = GRADE_CATEGORIES[grade] || GRADE_CATEGORIES.k;
  return categoryIds.map(id => ALL_CATEGORIES[id]).filter(Boolean);
}

// Word pools per grade and category
const WORD_POOLS: Record<string, Record<string, string[]>> = {
  k: {
    animals: ["cat", "dog", "fish", "bird", "cow", "pig", "hen", "duck", "bee", "ant", "bat", "bear", "deer", "frog", "goat", "lion", "mice", "seal", "wolf", "zebra", "crab", "swan", "toad", "wolf", "camel", "eagle", "goose", "horse", "llama", "moose", "otter", "panda", "shark", "sheep", "snake", "tiger", "whale", "bunny", "puppy", "kitty", "turtle", "monkey", "turkey", "donkey", "parrot", "rabbit", "robin", "salmon", "spider", "squirrel"],
    colors: ["red", "blue", "green", "pink", "black", "white", "brown", "gray", "gold", "tan", "cyan", "lime", "navy", "teal", "aqua", "coral", "ivory", "khaki", "olive", "peach", "silver", "violet", "indigo", "maroon", "orange", "purple", "yellow", "beige", "bronze", "copper", "crimson", "fuchsia", "magenta", "plum", "salmon", "tomato", "amber", "chartreuse", "lavender", "turquoise"],
    shapes: ["circle", "square", "triangle", "star", "oval", "heart", "diamond", "rectangle", "cone", "cube", "oval", "arch", "cross", "crescent", "ring", "spiral", "arrow", "cylinder", "pentagon", "hexagon", "octagon", "sphere", "pyramid", "prism", "wedge"],
    numbers: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"],
    family: ["mom", "dad", "baby", "girl", "boy", "son", "aunt", "uncle", "nana", "papa", "cousin", "sister", "brother", "mother", "father", "grandma", "grandpa", "family", "twin", "child", "parent", "niece", "nephew", "wife", "husband", "daughter", "grandson", "sibling", "relative", "grandchild"],
    body: ["head", "hand", "foot", "eye", "ear", "nose", "leg", "arm", "toe", "knee", "chin", "cheek", "hair", "neck", "chin", "mouth", "tongue", "tooth", "thumb", "wrist", "ankle", "elbow", "finger", "forehead", "shoulder", "stomach", "eyebrow", "eyelash", "nostril", "armpit"],
    food: ["apple", "banana", "bread", "cake", "corn", "egg", "ham", "ice", "jam", "milk", "nut", "pea", "pie", "rice", "soup", "tea", "yam", "beef", "corn", "date", "kiwi", "lime", "mango", "melon", "olive", "peach", "pear", "plum", "pork", "stew", "toast", "tuna", "wheat", "bagel", "beans", "beets", "berry", "cereal", "cheese", "cherry", "chips", "cider", "cookie", "cream", "donut", "grape", "guava", "honey", "juice", "lemon", "lettuce", "muffin", "nacho", "noodle", "orange", "pasta", "pickle", "pizza", "popcorn", "potato", "pretzel", "pumpkin", "radish", "salad", "salsa", "sauce", "sausage", "steak", "strawberry", "syrup", "taco", "tomato", "vanilla", "waffle", "watermelon"],
    weather: ["sun", "rain", "snow", "wind", "cloud", "fog", "hail", "ice", "cold", "hot", "warm", "cool", "wet", "dry", "storm", "clear", "frost", "mist", "sleet", "breeze", "thunder", "lightning", "rainbow", "sunshine", "tornado", "blizzard", "hurricane", "drought", "flood", "drizzle", "overcast", "humidity", "temperature", "forecast", "shower", "snowflake"],
    toys: ["ball", "doll", "car", "bike", "boat", "kite", "top", "yoyo", "lego", "train", "plane", "drum", "bear", "duck", "puzzle", "rocket", "stuffed", "blocks", "marbles", "tricycle", "scooter", "skates", "wagon", "robot", "slinky", "playdough", "chalk", "bubbles", "sandbox", "swing", "slide", "seesaw", "action", "figures", "cards", "board", "game", "remote", "control"],
    clothes: ["hat", "cap", "shoe", "boot", "sock", "vest", "tie", "belt", "scarf", "glove", "coat", "jeans", "shirt", "skirt", "dress", "shorts", "sweater", "jacket", "pajamas", "sneakers", "sandal", "slipper", "uniform", "costume", "raincoat", "swimsuit", "underwear", "mittens", "hoodie", "overalls", "tshirt", "blouse", "leggings", "tights", "apron", "backpack"],
    nature: ["tree", "leaf", "flower", "grass", "rock", "sand", "hill", "cave", "pond", "lake", "river", "ocean", "beach", "field", "forest", "garden", "mountain", "island", "valley", "waterfall", "desert", "volcano", "glacier", "canyon", "meadow", "swamp", "marsh", "creek", "stream", "spring", "blossom", "branch", "trunk", "root", "seed", "bud", "petal", "stem", "vine", "weed", "mushroom", "acorn", "pinecone", "seashell", "pebble", "boulder", "moss", "fern", "cactus", "willow", "oak", "maple", "birch", "cedar", "pine", "palm", "bamboo"],
    actions: ["run", "jump", "walk", "play", "eat", "drink", "sleep", "read", "write", "draw", "sing", "dance", "swim", "climb", "fly", "ride", "hide", "seek", "throw", "catch", "kick", "roll", "spin", "slide", "swing", "hop", "skip", "crawl", "tiptoe", "sprint", "gallop", "wiggle", "shake", "stretch", "yawn", "sneeze", "cough", "blink", "wink", "smile", "laugh", "clap", "wave", "point", "shrug", "nod", "bow", "curtsy", "hug", "kiss"],
  },
  "1": {
    // Extending K words with more complex additions
    animals: ["cat", "dog", "fish", "bird", "cow", "pig", "hen", "duck", "bee", "ant", "bat", "bear", "deer", "frog", "goat", "lion", "mice", "seal", "wolf", "zebra", "crab", "swan", "toad", "camel", "eagle", "goose", "horse", "llama", "moose", "otter", "panda", "shark", "sheep", "snake", "tiger", "whale", "bunny", "puppy", "kitty", "turtle", "monkey", "turkey", "donkey", "parrot", "rabbit", "robin", "salmon", "spider", "squirrel", "cheetah", "dolphin", "flamingo", "giraffe", "gorilla", "hedgehog", "hummingbird", "jellyfish", "kangaroo", "leopard", "lobster", "ostrich", "pelican", "penguin", "porcupine", "raccoon", "reindeer", "rhinoceros", "scorpion", "starfish", "stingray", "stork", "wombat", "chameleon", "chimpanzee", "crocodile", "elephant", "flounder", "grasshopper", "hippopotamus", "ladybug", "nightingale", "octopus", "salamander", "seahorse", "sloth", "walrus", "woodpecker", "yak"],
    school: ["book", "desk", "pen", "pencil", "paper", "ruler", "eraser", "glue", "scissors", "bag", "bus", "class", "lunch", "recess", "teacher", "student", "chalk", "board", "clock", "chair", "table", "window", "door", "floor", "wall", "roof", "bell", "hall", "library", "cafeteria", "playground", "notebook", "backpack", "crayons", "markers", "homework", "lesson", "math", "spelling", "reading", "writing", "science", "music", "art", "gym", "computer", "dictionary", "encyclopedia", "globe", "map", "calendar", "schedule", "alphabet", "numbers", "counting", "addition", "subtraction", "sentence", "paragraph", "story", "poem", "report", "project", "test", "quiz", "grade", "award", "certificate", "sticker", "star", "smile", "folder", "binder", "calculator", "protractor", "compass", "stapler", "tape", "clipboard", "whiteboard", "projector", "screen", "keyboard", "mouse", "headphones", "tablet"],
    transport: ["car", "bus", "train", "plane", "boat", "ship", "bike", "truck", "van", "taxi", "subway", "ferry", "helicopter", "motorcycle", "scooter", "skateboard", "rollerblades", "ambulance", "firetruck", "police", "tractor", "bulldozer", "crane", "rocket", "spaceship", "submarine", "jet", "glider", "balloon", "canoe", "kayak", "raft", "yacht", "sailboat", "rowboat", "gondola", "trolley", "tram", "monorail", "locomotive", "caboose", "flatbed", "tanker", "pickup", "convertible", "sedan", "coupe", "hatchback", "minivan", "rv", "camper", "trailer", "wagon", "stroller", "wheelchair", "golf", "cart", "snowmobile", "jetski", "hovercraft", "catamaran", "hydrofoil", "tugboat", "lifeboat", "dinghy", "paddleboat", "rickshaw", "tuktuk", "cablecar", "funicular", "elevator", "escalator"],
  },
  "2": {
    space: ["star", "moon", "sun", "planet", "mars", "venus", "earth", "jupiter", "saturn", "neptune", "uranus", "mercury", "pluto", "orbit", "comet", "asteroid", "meteor", "galaxy", "nebula", "constellation", "telescope", "astronaut", "rocket", "shuttle", "satellite", "ufo", "alien", "cosmos", "universe", "solar", "lunar", "eclipse", "crater", "gravity", "atmosphere", "aurora", "milkyway", "andromeda", "orion", "cassiopeia", "bigdipper", "northstar", "supernova", "blackhole", "wormhole", "quasar", "pulsar", "spacestation", "hubble", "voyager", "apollo", "gemini", "mercury", "sputnik", "explorer", "pioneer", "curiosity", "rover", "lander", "probe", "launch", "mission", "orbiting", "floating", "weightless", "vacuum", "radiation", "cosmic", "stellar", "interstellar", "extraterrestrial", "astrobiology", "astrophysics", "cosmology", "observatory", "planetarium", "spacecraft", "spacesuit", "airlock", "booster", "capsule", "module", "rendezvous", "docking", "reentry", "splashdown"],
    jobs: ["doctor", "teacher", "nurse", "chef", "pilot", "farmer", "police", "firefighter", "dentist", "vet", "lawyer", "artist", "musician", "athlete", "scientist", "engineer", "architect", "builder", "carpenter", "plumber", "electrician", "mechanic", "driver", "pilot", "sailor", "soldier", "judge", "mayor", "governor", "president", "writer", "actor", "singer", "dancer", "painter", "sculptor", "photographer", "journalist", "reporter", "editor", "librarian", "cashier", "clerk", "manager", "boss", "worker", "assistant", "secretary", "receptionist", "accountant", "banker", "broker", "salesperson", "marketer", "designer", "programmer", "developer", "analyst", "consultant", "advisor", "counselor", "therapist", "psychologist", "psychiatrist", "surgeon", "paramedic", "pharmacist", "therapist", "trainer", "coach", "referee", "umpire", "lifeguard", "guard", "detective", "investigator", "spy", "agent", "diplomat", "ambassador", "translator", "interpreter", "guide", "ranger", "warden", "keeper", "caretaker", "janitor", "cleaner", "gardener", "landscaper", "florist", "baker", "butcher", "barber", "stylist", "tailor", "seamstress", "shoemaker", "jeweler", "watchmaker"],
  },
  "3": {
    science: ["atom", "cell", "gene", "dna", "molecule", "electron", "proton", "neutron", "nucleus", "energy", "force", "motion", "gravity", "magnet", "electricity", "circuit", "battery", "wire", "switch", "bulb", "motor", "engine", "machine", "robot", "computer", "microscope", "telescope", "experiment", "hypothesis", "theory", "law", "formula", "equation", "variable", "constant", "control", "sample", "data", "result", "conclusion", "research", "discovery", "invention", "innovation", "technology", "engineering", "chemistry", "physics", "biology", "geology", "astronomy", "ecology", "environment", "ecosystem", "habitat", "species", "organism", "population", "community", "evolution", "adaptation", "mutation", "selection", "extinction", "fossil", "dinosaur", "mammoth", "saber", "meteorite", "volcano", "earthquake", "tsunami", "flood", "drought", "hurricane", "tornado", "cyclone", "typhoon", "climate", "weather", "atmosphere", "hydrosphere", "lithosphere", "biosphere", "photosynthesis", "respiration", "digestion", "circulation", "nervous", "immune", "skeletal", "muscular", "reproductive", "endocrine", "excretory", "integumentary"],
    geography: ["map", "globe", "ocean", "continent", "country", "state", "city", "town", "village", "capital", "border", "coast", "shore", "beach", "island", "peninsula", "isthmus", "archipelago", "mountain", "valley", "canyon", "plateau", "plain", "desert", "rainforest", "tundra", "savanna", "prairie", "wetland", "marsh", "swamp", "river", "lake", "pond", "stream", "creek", "waterfall", "glacier", "iceberg", "volcano", "earthquake", "cave", "cliff", "dune", "delta", "estuary", "fjord", "reef", "atoll", "strait", "channel", "bay", "gulf", "sea", "harbor", "port", "canal", "dam", "reservoir", "aquifer", "watershed", "tributary", "basin", "ridge", "summit", "peak", "slope", "foothill", "lowland", "highland", "upland", "lowland", "tropics", "equator", "poles", "latitude", "longitude", "meridian", "parallel", "hemisphere", "projection", "scale", "legend", "compass", "north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest", "coordinate", "elevation", "altitude", "depth"],
  },
  "4": {
    history: ["ancient", "medieval", "modern", "century", "decade", "era", "period", "age", "dynasty", "empire", "kingdom", "republic", "democracy", "monarchy", "tyranny", "revolution", "war", "battle", "treaty", "alliance", "colony", "independence", "constitution", "amendment", "civilization", "culture", "society", "community", "tribe", "clan", "pharaoh", "emperor", "king", "queen", "prince", "princess", "knight", "samurai", "viking", "gladiator", "centurion", "crusader", "conquistador", "explorer", "inventor", "scientist", "philosopher", "artist", "composer", "author", "poet", "leader", "reformer", "activist", "revolutionary", "statesman", "diplomat", "general", "admiral", "soldier", "warrior", "peasant", "serf", "slave", "noble", "aristocrat", "merchant", "artisan", "craftsman", "guild", "castle", "palace", "temple", "cathedral", "mosque", "pyramid", "colosseum", "forum", "agora", "market", "trade", "commerce", "industry", "agriculture", "renaissance", "enlightenment", "reformation", "industrial", "colonial", "imperial", "nationalism", "communism", "socialism", "capitalism", "feudalism", "serfdom", "slavery", "abolition", "suffrage", "civil", "rights", "equality", "freedom", "justice", "peace"],
  },
  "5": {
    technology: ["computer", "laptop", "tablet", "smartphone", "phone", "internet", "website", "app", "software", "hardware", "program", "code", "algorithm", "data", "database", "server", "cloud", "network", "wifi", "bluetooth", "usb", "hdmi", "processor", "memory", "storage", "drive", "disk", "chip", "circuit", "sensor", "camera", "microphone", "speaker", "display", "screen", "keyboard", "mouse", "touchpad", "touchscreen", "battery", "charger", "cable", "wire", "adapter", "router", "modem", "switch", "printer", "scanner", "monitor", "projector", "drone", "robot", "ai", "artificial", "intelligence", "machine", "learning", "virtual", "reality", "augmented", "simulation", "animation", "graphics", "pixel", "resolution", "megapixel", "gigabyte", "terabyte", "megabyte", "kilobyte", "byte", "bit", "binary", "digital", "analog", "frequency", "bandwidth", "latency", "ping", "download", "upload", "streaming", "buffering", "loading", "saving", "deleting", "copying", "pasting", "editing", "formatting", "installing", "updating", "upgrading", "rebooting", "debugging", "testing", "deploying", "hosting", "domain", "encryption", "security", "password", "username", "login", "logout", "profile", "account", "settings", "preferences", "notification", "message", "email", "chat", "video", "audio", "file", "folder", "document", "spreadsheet", "presentation"],
  },
};

// Get random words for a grade and category
export function getRandomWords(grade: string, category: string, count: number): string[] {
  const gradeWords = WORD_POOLS[grade] || WORD_POOLS.k;
  const words = gradeWords[category] || gradeWords.animals || WORD_POOLS.k.animals;
  
  // Shuffle and take requested count
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Grid size per grade
export const GRID_SIZES: Record<string, number> = {
  k: 8,
  "1": 10,
  "2": 12,
  "3": 14,
  "4": 15,
  "5": 16,
};

// Word directions per grade
export type Direction = 
  | "right"      // horizontal left to right
  | "left"       // horizontal right to left
  | "down"       // vertical top to bottom
  | "up"         // vertical bottom to top
  | "downRight"  // diagonal ↘
  | "downLeft"   // diagonal ↙
  | "upRight"    // diagonal ↗
  | "upLeft";    // diagonal ↖

export const DIRECTIONS_BY_GRADE: Record<string, Direction[]> = {
  k: ["right", "down", "downRight"],
  "1": ["right", "down", "downRight"],
  "2": ["right", "down", "downRight"],
  "3": ["right", "left", "down", "up", "downRight", "downLeft", "upRight", "upLeft"],
  "4": ["right", "left", "down", "up", "downRight", "downLeft", "upRight", "upLeft"],
  "5": ["right", "left", "down", "up", "downRight", "downLeft", "upRight", "upLeft"],
};
