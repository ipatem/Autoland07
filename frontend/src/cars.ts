// Common car brands and models — Romania-focused list for used parts
export const CAR_BRANDS: Record<string, string[]> = {
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron", "TT"],
  "BMW": ["Seria 1", "Seria 2", "Seria 3", "Seria 4", "Seria 5", "Seria 6", "Seria 7", "Seria 8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "i3", "i4", "iX"],
  "Citroën": ["C1", "C3", "C4", "C4 Picasso", "C5", "Berlingo", "Jumpy", "Jumper"],
  "Dacia": ["Logan", "Sandero", "Duster", "Lodgy", "Dokker", "Spring", "Jogger"],
  "Fiat": ["500", "Panda", "Punto", "Tipo", "Doblo", "Ducato", "Bravo"],
  "Ford": ["Fiesta", "Focus", "Mondeo", "Kuga", "S-Max", "Galaxy", "Puma", "EcoSport", "Ranger", "Transit", "Tourneo"],
  "Honda": ["Jazz", "Civic", "Accord", "CR-V", "HR-V"],
  "Hyundai": ["i10", "i20", "i30", "Tucson", "Kona", "Santa Fe", "Bayon", "ix35"],
  "Jeep": ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler"],
  "Kia": ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "XCeed", "Stonic"],
  "Land Rover": ["Discovery", "Discovery Sport", "Defender", "Range Rover", "Range Rover Sport", "Range Rover Evoque", "Range Rover Velar"],
  "Lexus": ["IS", "ES", "GS", "RX", "NX", "UX"],
  "Mazda": ["2", "3", "6", "CX-3", "CX-5", "CX-30", "MX-5"],
  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "Vito", "Sprinter", "V-Class"],
  "Mini": ["Cooper", "Countryman", "Clubman"],
  "Mitsubishi": ["ASX", "Outlander", "L200", "Lancer", "Pajero"],
  "Nissan": ["Micra", "Note", "Juke", "Qashqai", "X-Trail", "Navara", "Pulsar"],
  "Opel": ["Astra", "Corsa", "Insignia", "Mokka", "Crossland", "Grandland", "Zafira", "Vivaro", "Combo", "Movano"],
  "Peugeot": ["208", "308", "508", "2008", "3008", "5008", "Partner", "Expert", "Boxer", "Rifter"],
  "Porsche": ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Renault": ["Clio", "Megane", "Captur", "Kadjar", "Koleos", "Talisman", "Scenic", "Trafic", "Master"],
  "Seat": ["Ibiza", "Leon", "Alhambra", "Ateca", "Arona", "Tarraco"],
  "Skoda": ["Fabia", "Octavia", "Superb", "Kodiaq", "Karoq", "Yeti", "Rapid", "Scala", "Kamiq"],
  "Smart": ["ForTwo", "ForFour"],
  "Subaru": ["Impreza", "Forester", "Outback", "XV", "Legacy"],
  "Suzuki": ["Swift", "Vitara", "S-Cross", "Jimny", "Ignis"],
  "Toyota": ["Yaris", "Auris", "Corolla", "Avensis", "Camry", "RAV4", "C-HR", "Hilux", "Land Cruiser", "Prius"],
  "Volkswagen": ["Polo", "Golf", "Jetta", "Passat", "Arteon", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Touran", "Sharan", "Caddy", "Transporter", "Crafter", "Amarok"],
  "Volvo": ["V40", "V60", "V90", "S60", "S90", "XC40", "XC60", "XC90"],
  "Altă marcă": ["Altul"],
};

export const CAR_BRAND_LIST = Object.keys(CAR_BRANDS);

export function modelsForBrand(brand: string): string[] {
  return CAR_BRANDS[brand] || [];
}

const NOW = new Date().getFullYear();
export const CAR_YEARS: string[] = Array.from({ length: NOW - 1989 }, (_, i) => String(NOW - i));
