/**
 * Geo-service for CHA ADDA
 * Provides Bangladesh city coordinates, GPS distance calculation (Haversine),
 * and Bengali distance formatting.
 */

export interface GeoLocation {
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CityInfo {
  nameEn: string;
  nameBn: string;
  lat: number;
  lng: number;
  division: string;
}

export const BANGLADESH_CITIES: Record<string, CityInfo> = {
  dhaka: { nameEn: "Dhaka", nameBn: "ঢাকা", lat: 23.8103, lng: 90.4125, division: "Dhaka" },
  gazipur: { nameEn: "Gazipur", nameBn: "গাজীপুর", lat: 23.9999, lng: 90.4203, division: "Dhaka" },
  narayanganj: { nameEn: "Narayanganj", nameBn: "নারায়ণগঞ্জ", lat: 23.6238, lng: 90.5000, division: "Dhaka" },
  savar: { nameEn: "Savar", nameBn: "সাভার", lat: 23.8480, lng: 90.2577, division: "Dhaka" },
  tangail: { nameEn: "Tangail", nameBn: "টাঙ্গাইল", lat: 24.2513, lng: 89.9167, division: "Dhaka" },
  narsingdi: { nameEn: "Narsingdi", nameBn: "নরসিংদী", lat: 23.9322, lng: 90.7154, division: "Dhaka" },
  munshiganj: { nameEn: "Munshiganj", nameBn: "মুন্সীগঞ্জ", lat: 23.5422, lng: 90.5305, division: "Dhaka" },
  manikganj: { nameEn: "Manikganj", nameBn: "মানিকগঞ্জ", lat: 23.8617, lng: 90.0003, division: "Dhaka" },
  faridpur: { nameEn: "Faridpur", nameBn: "ফরিদপুর", lat: 23.6071, lng: 89.8429, division: "Dhaka" },

  chittagong: { nameEn: "Chittagong", nameBn: "চট্টগ্রাম", lat: 22.3569, lng: 91.7832, division: "Chittagong" },
  chattogram: { nameEn: "Chattogram", nameBn: "চট্টগ্রাম", lat: 22.3569, lng: 91.7832, division: "Chittagong" },
  "cox's bazar": { nameEn: "Cox's Bazar", nameBn: "কক্সবাজার", lat: 21.4272, lng: 92.0058, division: "Chittagong" },
  "coxs bazar": { nameEn: "Cox's Bazar", nameBn: "কক্সবাজার", lat: 21.4272, lng: 92.0058, division: "Chittagong" },
  comilla: { nameEn: "Comilla", nameBn: "কুমিল্লা", lat: 23.4682, lng: 91.1788, division: "Chittagong" },
  cumilla: { nameEn: "Cumilla", nameBn: "কুমিল্লা", lat: 23.4682, lng: 91.1788, division: "Chittagong" },
  feni: { nameEn: "Feni", nameBn: "ফেনী", lat: 23.0159, lng: 91.3976, division: "Chittagong" },
  noakhali: { nameEn: "Noakhali", nameBn: "নোয়াখালী", lat: 22.8696, lng: 91.0994, division: "Chittagong" },
  brahmanbaria: { nameEn: "Brahmanbaria", nameBn: "ব্রাহ্মণবাড়িয়া", lat: 23.9608, lng: 91.1115, division: "Chittagong" },
  bandarban: { nameEn: "Bandarban", nameBn: "বান্দরবান", lat: 22.1953, lng: 92.2184, division: "Chittagong" },
  rangamati: { nameEn: "Rangamati", nameBn: "রাঙ্গামাটি", lat: 22.6533, lng: 92.1753, division: "Chittagong" },
  khagrachhari: { nameEn: "Khagrachhari", nameBn: "খাগড়াছড়ি", lat: 23.1322, lng: 91.9490, division: "Chittagong" },

  sylhet: { nameEn: "Sylhet", nameBn: "সিলেট", lat: 24.8949, lng: 91.8687, division: "Sylhet" },
  moulvibazar: { nameEn: "Moulvibazar", nameBn: "মৌলভীবাজার", lat: 24.4829, lng: 91.7774, division: "Sylhet" },
  habiganj: { nameEn: "Habiganj", nameBn: "হবিগঞ্জ", lat: 24.3749, lng: 91.4155, division: "Sylhet" },
  sunamganj: { nameEn: "Sunamganj", nameBn: "সুনামগঞ্জ", lat: 25.0658, lng: 91.3950, division: "Sylhet" },

  rajshahi: { nameEn: "Rajshahi", nameBn: "রাজশাহী", lat: 24.3636, lng: 88.6241, division: "Rajshahi" },
  bogura: { nameEn: "Bogura", nameBn: "বগুড়া", lat: 24.8465, lng: 89.3770, division: "Rajshahi" },
  bogra: { nameEn: "Bogra", nameBn: "বগুড়া", lat: 24.8465, lng: 89.3770, division: "Rajshahi" },
  pabna: { nameEn: "Pabna", nameBn: "পাবনা", lat: 24.0125, lng: 89.2568, division: "Rajshahi" },
  sirajganj: { nameEn: "Sirajganj", nameBn: "সিরাজগঞ্জ", lat: 24.4534, lng: 89.7008, division: "Rajshahi" },
  naogaon: { nameEn: "Naogaon", nameBn: "নওগাঁ", lat: 24.7936, lng: 88.9318, division: "Rajshahi" },

  khulna: { nameEn: "Khulna", nameBn: "খুলনা", lat: 22.8456, lng: 89.5403, division: "Khulna" },
  jessore: { nameEn: "Jessore", nameBn: "যশোর", lat: 23.1664, lng: 89.2081, division: "Khulna" },
  jashore: { nameEn: "Jashore", nameBn: "যশোর", lat: 23.1664, lng: 89.2081, division: "Khulna" },
  kushtia: { nameEn: "Kushtia", nameBn: "কুষ্টিয়া", lat: 23.9013, lng: 89.1205, division: "Khulna" },
  bagerhat: { nameEn: "Bagerhat", nameBn: "বাগেরহাট", lat: 22.6602, lng: 89.7895, division: "Khulna" },
  satkhira: { nameEn: "Satkhira", nameBn: "সাতক্ষীরা", lat: 22.7185, lng: 89.0705, division: "Khulna" },

  barisal: { nameEn: "Barisal", nameBn: "বরিশাল", lat: 22.7010, lng: 90.3535, division: "Barisal" },
  barishal: { nameEn: "Barishal", nameBn: "বরিশাল", lat: 22.7010, lng: 90.3535, division: "Barisal" },
  patuakhali: { nameEn: "Patuakhali", nameBn: "পটুয়াখালী", lat: 22.3596, lng: 90.3299, division: "Barisal" },
  bhola: { nameEn: "Bhola", nameBn: "ভোলা", lat: 22.6859, lng: 90.6481, division: "Barisal" },

  rangpur: { nameEn: "Rangpur", nameBn: "রংপুর", lat: 25.7439, lng: 89.2752, division: "Rangpur" },
  dinajpur: { nameEn: "Dinajpur", nameBn: "দিনাজপুর", lat: 25.6217, lng: 88.6355, division: "Rangpur" },

  mymensingh: { nameEn: "Mymensingh", nameBn: "ময়মনসিংহ", lat: 24.7471, lng: 90.4203, division: "Mymensingh" },
  jamalpur: { nameEn: "Jamalpur", nameBn: "জামালপুর", lat: 24.9375, lng: 89.9377, division: "Mymensingh" },
  netrokona: { nameEn: "Netrokona", nameBn: "নেত্রকোণা", lat: 24.8709, lng: 90.7279, division: "Mymensingh" },
};

// Quick reverse lookup for Bengali names
const BENGALI_CITY_MAP: Record<string, string> = {};
Object.entries(BANGLADESH_CITIES).forEach(([key, info]) => {
  BENGALI_CITY_MAP[info.nameBn] = key;
  BENGALI_CITY_MAP[info.nameEn.toLowerCase()] = key;
});

/**
 * Normalizes city string to canonical city key
 */
export function resolveCityKey(cityName?: string | null): string | null {
  if (!cityName) return null;
  const clean = cityName.trim().toLowerCase();
  if (clean === "chittagong" || clean === "chattogram" || cityName.trim() === "চট্টগ্রাম") {
    return "chittagong";
  }
  if (BANGLADESH_CITIES[clean]) return clean;
  if (BENGALI_CITY_MAP[cityName.trim()]) return BENGALI_CITY_MAP[cityName.trim()];
  if (BENGALI_CITY_MAP[clean]) return BENGALI_CITY_MAP[clean];

  // Partial match fallback
  for (const [key, info] of Object.entries(BANGLADESH_CITIES)) {
    if (clean.includes(key) || clean.includes(info.nameEn.toLowerCase()) || cityName.includes(info.nameBn)) {
      return key;
    }
  }
  return null;
}

/**
 * Standard Haversine formula to compute great-circle distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates a stable numeric hash from two user IDs for intra-city distance jitter
 */
function getPairSeed(id1: string, id2: string): number {
  const combined = id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Computes realistic distance between two user locations
 */
export function calculateDistanceBetween(
  userA: { id?: string; city?: string | null; latitude?: number | null; longitude?: number | null },
  userB: { id?: string; city?: string | null; latitude?: number | null; longitude?: number | null }
): number {
  // Case 1: Both have exact GPS coordinates
  if (
    typeof userA.latitude === "number" &&
    typeof userA.longitude === "number" &&
    typeof userB.latitude === "number" &&
    typeof userB.longitude === "number" &&
    userA.latitude !== 0 &&
    userB.latitude !== 0
  ) {
    const raw = calculateHaversineDistance(
      userA.latitude,
      userA.longitude,
      userB.latitude,
      userB.longitude
    );
    return Math.max(0.5, Math.round(raw * 10) / 10);
  }

  // Case 2: City-based resolution
  const keyA = resolveCityKey(userA.city) || "dhaka";
  const keyB = resolveCityKey(userB.city) || "dhaka";

  // If in the same city (e.g. both in Dhaka or Chittagong)
  if (keyA === keyB) {
    const seed = getPairSeed(userA.id || "a", userB.id || "b");
    // Realistic neighborhood dispersion within a metro city: 1.5 km to 12.5 km
    const offset = 1.5 + (seed % 110) / 10;
    return Math.round(offset * 10) / 10;
  }

  // Different cities: lookup coordinates of both cities
  const cityInfoA = BANGLADESH_CITIES[keyA];
  const cityInfoB = BANGLADESH_CITIES[keyB];

  if (cityInfoA && cityInfoB) {
    const baseDist = calculateHaversineDistance(
      cityInfoA.lat,
      cityInfoA.lng,
      cityInfoB.lat,
      cityInfoB.lng
    );
    const seed = getPairSeed(userA.id || "a", userB.id || "b");
    const jitter = ((seed % 10) - 5) * 1.5;
    return Math.max(5, Math.round(baseDist + jitter));
  }

  return 15; // default fallback
}

/**
 * Format distance into friendly English & Bengali string
 */
export function formatDistanceBengali(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined) return "কাছাকাছি (Nearby)";
  if (distanceKm < 1) return "< ১ কিমি দূরে";
  if (distanceKm === 1) return "১ কিমি দূরে";
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} কিমি দূরে`;
  return `${Math.round(distanceKm)} কিমি দূরে`;
}

/**
 * Find closest registered city given GPS coordinates
 */
export function findNearestCity(lat: number, lng: number): CityInfo {
  let nearest = BANGLADESH_CITIES.dhaka;
  let minDistance = Infinity;

  for (const city of Object.values(BANGLADESH_CITIES)) {
    const dist = calculateHaversineDistance(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  return nearest;
}
