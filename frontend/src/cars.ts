// Expanded car brands & models database — 80+ brands, 700+ models
// Used as dropdown options. Manual entry is also allowed via toggle.

export const CAR_BRANDS: Record<string, string[]> = {
  "Abarth": ["500", "595", "695", "124 Spider", "Punto"],
  "Acura": ["ILX", "MDX", "RDX", "TLX", "NSX", "Integra"],
  "Alfa Romeo": ["Mito", "Giulietta", "Giulia", "Stelvio", "Tonale", "159", "147", "166", "Brera", "Spider", "GT"],
  "Aston Martin": ["DB9", "DB11", "DB12", "Vantage", "DBX", "Rapide", "Vanquish"],
  "Audi": ["A1", "A2", "A3", "A4", "A4 Allroad", "A5", "A6", "A6 Allroad", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "e-tron", "e-tron GT", "TT", "TTS", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "RSQ3", "RSQ8", "S3", "S4", "S5", "S6", "S7", "S8", "100", "80"],
  "Bentley": ["Continental GT", "Flying Spur", "Bentayga", "Mulsanne"],
  "BMW": ["Seria 1", "Seria 2", "Seria 2 Active Tourer", "Seria 2 Gran Tourer", "Seria 3", "Seria 3 GT", "Seria 4", "Seria 5", "Seria 5 GT", "Seria 6", "Seria 7", "Seria 8", "X1", "X2", "X3", "X4", "X5", "X5 M", "X6", "X6 M", "X7", "XM", "Z3", "Z4", "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX3", "M2", "M3", "M4", "M5", "M6", "M8"],
  "Buick": ["Encore", "Enclave", "Envision", "LaCrosse", "Regal"],
  "Cadillac": ["ATS", "CTS", "CT4", "CT5", "CT6", "Escalade", "XT4", "XT5", "XT6", "SRX"],
  "Chevrolet": ["Aveo", "Cruze", "Camaro", "Corvette", "Captiva", "Equinox", "Malibu", "Orlando", "Spark", "Suburban", "Tahoe", "Trax", "Trailblazer", "Silverado"],
  "Chrysler": ["300", "Pacifica", "PT Cruiser", "Sebring", "Voyager"],
  "Citroën": ["C1", "C2", "C3", "C3 Aircross", "C3 Picasso", "C4", "C4 Cactus", "C4 Picasso", "C4 Spacetourer", "C5", "C5 Aircross", "C5 X", "C6", "C8", "Berlingo", "Jumpy", "Jumper", "DS3", "DS4", "DS5", "Saxo", "Xsara", "Xsara Picasso", "ZX"],
  "Cupra": ["Ateca", "Born", "Formentor", "Leon", "Tavascan"],
  "Dacia": ["1300", "1310", "Logan", "Logan MCV", "Sandero", "Sandero Stepway", "Duster", "Lodgy", "Dokker", "Spring", "Jogger", "Bigster"],
  "Daewoo": ["Cielo", "Espero", "Lanos", "Leganza", "Matiz", "Nexia", "Nubira", "Tacuma", "Tico"],
  "Daihatsu": ["Charade", "Cuore", "Materia", "Sirion", "Terios", "YRV"],
  "Dodge": ["Caliber", "Challenger", "Charger", "Durango", "Journey", "Nitro", "RAM", "Viper"],
  "DS Automobiles": ["DS 3", "DS 4", "DS 5", "DS 7", "DS 9"],
  "Ferrari": ["458", "488", "F8", "812", "California", "GTC4Lusso", "Portofino", "Roma", "SF90", "Purosangue"],
  "Fiat": ["500", "500L", "500X", "500e", "Albea", "Bravo", "Croma", "Doblo", "Ducato", "Fiorino", "Freemont", "Grande Punto", "Linea", "Marea", "Multipla", "Panda", "Punto", "Qubo", "Scudo", "Seicento", "Sedici", "Stilo", "Tipo", "Ulysse"],
  "Ford": ["B-Max", "C-Max", "EcoSport", "Edge", "Escape", "Escort", "Explorer", "F-150", "Fiesta", "Focus", "Fusion", "Galaxy", "Grand C-Max", "Ka", "Kuga", "Maverick", "Mondeo", "Mustang", "Mustang Mach-E", "Puma", "Ranger", "S-Max", "Tourneo Connect", "Tourneo Custom", "Tourneo Courier", "Transit", "Transit Connect", "Transit Custom", "Transit Courier"],
  "Genesis": ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  "GMC": ["Acadia", "Canyon", "Sierra", "Terrain", "Yukon"],
  "Great Wall": ["Hover", "Steed", "Wingle"],
  "Honda": ["Accord", "Civic", "CR-V", "CR-Z", "e", "FR-V", "HR-V", "Insight", "Jazz", "Legend", "Logo", "NSX", "Odyssey", "Pilot", "Prelude", "Ridgeline", "Stream"],
  "Hummer": ["H1", "H2", "H3"],
  "Hyundai": ["Accent", "Atos", "Bayon", "Coupe", "Elantra", "Galloper", "Genesis", "Getz", "Grandeur", "H1", "H100", "i10", "i20", "i30", "i40", "Ioniq", "Ioniq 5", "Ioniq 6", "ix20", "ix35", "ix55", "Kona", "Matrix", "Nexo", "Santa Fe", "Sonata", "Staria", "Terracan", "Trajet", "Tucson", "Veloster", "XG"],
  "Infiniti": ["EX", "FX", "G", "M", "Q30", "Q50", "Q70", "QX30", "QX50", "QX60", "QX70", "QX80"],
  "Isuzu": ["D-Max", "Trooper"],
  "Iveco": ["Daily", "EuroCargo"],
  "Jaguar": ["E-Pace", "F-Pace", "F-Type", "I-Pace", "S-Type", "X-Type", "XE", "XF", "XJ", "XK"],
  "Jeep": ["Avenger", "Cherokee", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Patriot", "Renegade", "Wagoneer", "Wrangler"],
  "Kia": ["Carens", "Carnival", "Cee'd", "Ceed", "Cerato", "EV3", "EV6", "EV9", "K2500", "Magentis", "Niro", "Optima", "Picanto", "Pride", "ProCeed", "Rio", "Sephia", "Shuma", "Sorento", "Soul", "Sportage", "Stinger", "Stonic", "Telluride", "Venga", "XCeed"],
  "Lada": ["Niva", "Granta", "Vesta", "Largus", "Priora", "Samara"],
  "Lamborghini": ["Aventador", "Gallardo", "Huracán", "Murciélago", "Revuelto", "Urus"],
  "Lancia": ["Delta", "Lybra", "Musa", "Phedra", "Thema", "Thesis", "Voyager", "Y", "Ypsilon"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  "Lexus": ["CT", "ES", "GS", "GX", "IS", "LBX", "LC", "LFA", "LM", "LS", "LX", "NX", "RC", "RX", "RZ", "SC", "UX"],
  "Lincoln": ["Aviator", "Continental", "Corsair", "MKC", "MKX", "MKZ", "Nautilus", "Navigator"],
  "Lotus": ["Elise", "Emira", "Eletre", "Evora", "Exige", "Europa"],
  "Maserati": ["3200 GT", "Ghibli", "GranTurismo", "Grecale", "Levante", "MC20", "Quattroporte"],
  "Mazda": ["121", "2", "3", "323", "5", "6", "626", "B-Series", "BT-50", "CX-3", "CX-30", "CX-5", "CX-50", "CX-60", "CX-7", "CX-9", "CX-90", "Demio", "MPV", "MX-3", "MX-5", "MX-6", "MX-30", "Premacy", "RX-7", "RX-8", "Tribute", "Xedos"],
  "McLaren": ["540C", "570S", "600LT", "650S", "720S", "765LT", "Artura", "GT", "P1"],
  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "CL", "CLA", "CLC", "CLK", "CLS", "E-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "G-Class", "GL", "GLA", "GLB", "GLC", "GLC Coupe", "GLE", "GLE Coupe", "GLK", "GLS", "M-Class", "Marco Polo", "ML", "R-Class", "S-Class", "SL", "SLC", "SLK", "SLR", "SLS", "Sprinter", "T-Class", "V-Class", "Vaneo", "Viano", "Vito", "X-Class"],
  "MG": ["3", "4", "5", "ZS", "HS", "MG6", "Marvel R", "Cyberster"],
  "Mini": ["Cooper", "Cooper Cabrio", "Cooper Clubman", "Cooper Coupe", "Cooper Roadster", "Cooper S", "Countryman", "Paceman", "John Cooper Works", "Aceman"],
  "Mitsubishi": ["3000 GT", "ASX", "Carisma", "Colt", "Eclipse Cross", "Galant", "Grandis", "L200", "Lancer", "Mirage", "Outlander", "Outlander PHEV", "Pajero", "Pajero Pinin", "Pajero Sport", "Space Star", "Space Wagon"],
  "Nissan": ["350Z", "370Z", "400Z", "Almera", "Almera Tino", "Ariya", "Cabstar", "Cube", "Frontier", "GT-R", "Juke", "Leaf", "Maxima", "Micra", "Murano", "Navara", "Note", "NV200", "NV400", "Pathfinder", "Patrol", "Pixo", "Primera", "Pulsar", "Qashqai", "Qashqai+2", "Sentra", "Sunny", "Terrano", "Tiida", "Townstar", "X-Trail"],
  "Opel": ["Adam", "Agila", "Ampera", "Antara", "Astra", "Astra GTC", "Calibra", "Cascada", "Combo", "Corsa", "Crossland", "Crossland X", "Frontera", "Grandland", "Grandland X", "GT", "Insignia", "Karl", "Kadett", "Manta", "Meriva", "Mokka", "Movano", "Omega", "Rocks-e", "Senator", "Signum", "Sintra", "Tigra", "Vectra", "Vivaro", "Zafira", "Zafira Life"],
  "Peugeot": ["106", "107", "108", "1007", "2008", "205", "206", "207", "208", "3008", "301", "306", "307", "308", "4007", "4008", "405", "406", "407", "408", "5008", "508", "508 SW", "605", "607", "806", "807", "Bipper", "Boxer", "Expert", "Partner", "Rifter", "RCZ", "Traveller"],
  "Polestar": ["1", "2", "3", "4"],
  "Pontiac": ["Firebird", "Grand Am", "GTO", "Solstice", "Trans Am"],
  "Porsche": ["911", "918", "Boxster", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
  "RAM": ["1500", "2500", "3500", "ProMaster"],
  "Renault": ["Arkana", "Austral", "Avantime", "Captur", "Clio", "Espace", "Fluence", "Grand Espace", "Grand Modus", "Grand Scenic", "Kadjar", "Kangoo", "Koleos", "Laguna", "Latitude", "Master", "Megane", "Megane CC", "Megane RS", "Megane Scenic", "Modus", "R 4", "Rafale", "Safrane", "Sandero", "Scenic", "Symbol", "Talisman", "Thalia", "Trafic", "Twingo", "Twizy", "Vel Satis", "Wind", "ZOE"],
  "Rolls-Royce": ["Cullinan", "Dawn", "Ghost", "Phantom", "Spectre", "Wraith"],
  "Rover": ["25", "45", "75", "200", "400", "Streetwise"],
  "Saab": ["9-3", "9-5", "9-7", "900"],
  "SEAT": ["Alhambra", "Altea", "Altea XL", "Arona", "Ateca", "Cordoba", "Exeo", "Ibiza", "Inca", "Leon", "Mii", "Tarraco", "Toledo"],
  "Skoda": ["100", "Citigo", "Enyaq", "Fabia", "Favorit", "Felicia", "Karoq", "Kamiq", "Kodiaq", "Octavia", "Octavia RS", "Praktik", "Rapid", "Roomster", "Scala", "Superb", "Yeti"],
  "Smart": ["#1", "#3", "ForFour", "ForTwo", "Roadster"],
  "SsangYong": ["Actyon", "Korando", "Kyron", "Musso", "Rexton", "Rodius", "Tivoli", "XLV"],
  "Subaru": ["Ascent", "BRZ", "Forester", "Impreza", "Justy", "Legacy", "Levorg", "Outback", "Solterra", "Trezia", "Tribeca", "WRX", "XV"],
  "Suzuki": ["Across", "Alto", "Baleno", "Celerio", "Grand Vitara", "Ignis", "Jimny", "Kizashi", "Liana", "Samurai", "Splash", "Swace", "Swift", "SX4", "SX4 S-Cross", "Vitara", "Wagon R", "X-90"],
  "Tata": ["Indica", "Sumo", "Xenon"],
  "Tesla": ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y", "Roadster", "Semi"],
  "Toyota": ["4Runner", "Aurion", "Auris", "Avalon", "Avensis", "Aygo", "Aygo X", "bZ4X", "C-HR", "Camry", "Carina", "Celica", "Corolla", "Corolla Cross", "Corolla Verso", "Cressida", "FJ Cruiser", "GR86", "GT86", "Hiace", "Highlander", "Hilux", "iQ", "Land Cruiser", "MR2", "Paseo", "Picnic", "Previa", "Prius", "Prius+", "Proace", "Proace City", "RAV4", "Sequoia", "Sienna", "Starlet", "Supra", "Tacoma", "Tundra", "Urban Cruiser", "Verso", "Verso-S", "Yaris", "Yaris Cross"],
  "Volkswagen": ["Amarok", "Arteon", "Atlas", "Beetle", "Bora", "Caddy", "California", "CC", "Corrado", "Crafter", "Eos", "Fox", "Golf", "Golf Plus", "Golf Sportsvan", "Grand California", "ID.3", "ID.4", "ID.5", "ID.6", "ID.7", "ID. Buzz", "Jetta", "Lupo", "Multivan", "New Beetle", "Passat", "Passat CC", "Phaeton", "Polo", "Routan", "Scirocco", "Sharan", "T-Cross", "T-Roc", "Taigo", "Taos", "Tayron", "Tiguan", "Tiguan Allspace", "Touareg", "Touran", "Transporter", "up!", "Vento"],
  "Volvo": ["240", "440", "460", "480", "740", "850", "940", "960", "C30", "C40", "C70", "EX30", "EX90", "S40", "S60", "S70", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90"],
  "Altă marcă": ["Altul"],
};

export const CAR_BRAND_LIST = Object.keys(CAR_BRANDS).sort();

export function modelsForBrand(brand: string): string[] {
  return CAR_BRANDS[brand] || [];
}

const NOW = new Date().getFullYear();
export const CAR_YEARS: string[] = Array.from({ length: NOW - 1979 }, (_, i) => String(NOW - i));

// Normalize a brand name returned by NHTSA (typically uppercase) to match our list keys.
export function normalizeBrand(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return null;
  // Exact match first (case-insensitive)
  for (const k of CAR_BRAND_LIST) {
    if (k.toLowerCase() === cleaned) return k;
  }
  // Fuzzy: starts-with or contains (e.g., "MERCEDES-BENZ" matches "Mercedes-Benz")
  for (const k of CAR_BRAND_LIST) {
    const kk = k.toLowerCase();
    if (cleaned.startsWith(kk) || kk.startsWith(cleaned)) return k;
  }
  for (const k of CAR_BRAND_LIST) {
    if (cleaned.includes(k.toLowerCase()) || k.toLowerCase().includes(cleaned)) return k;
  }
  return null;
}

// Find a model for a brand using fuzzy matching against returned model name
export function normalizeModel(brand: string | null, raw: string | null | undefined): string | null {
  if (!brand || !raw) return null;
  const list = modelsForBrand(brand);
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return null;
  for (const m of list) {
    if (m.toLowerCase() === cleaned) return m;
  }
  for (const m of list) {
    if (cleaned.includes(m.toLowerCase()) || m.toLowerCase().includes(cleaned)) return m;
  }
  return null;
}
