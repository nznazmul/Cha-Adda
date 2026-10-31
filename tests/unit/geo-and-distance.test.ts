import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistance,
  calculateDistanceBetween,
  formatDistanceBengali,
  findNearestCity,
  resolveCityKey
} from "@/lib/services/geo-service";
import { devStore } from "@/lib/services/dev-store";

describe("Geo-service & Distance Calculations", () => {
  it("calculates accurate Haversine distance between cities", () => {
    // Dhaka (23.8103, 90.4125) to Chittagong (22.3569, 91.7832) is ~215 km
    const dist = calculateHaversineDistance(23.8103, 90.4125, 22.3569, 91.7832);
    expect(dist).toBeGreaterThan(200);
    expect(dist).toBeLessThan(230);
  });

  it("handles city resolution for English and Bengali names", () => {
    expect(resolveCityKey("Dhaka")).toBe("dhaka");
    expect(resolveCityKey("ঢাকা")).toBe("dhaka");
    expect(resolveCityKey("চট্টগ্রাম")).toBe("chittagong");
    expect(resolveCityKey("Sylhet")).toBe("sylhet");
    expect(resolveCityKey("সিলেট")).toBe("sylhet");
  });

  it("produces realistic intra-city neighborhood distance for users in the same city", () => {
    const userA = { id: "user-1", city: "Dhaka" };
    const userB = { id: "user-2", city: "Dhaka" };
    const dist = calculateDistanceBetween(userA, userB);

    expect(dist).toBeGreaterThanOrEqual(1.5);
    expect(dist).toBeLessThanOrEqual(13);
  });

  it("formats distances properly in Bengali", () => {
    expect(formatDistanceBengali(0.4)).toBe("< ১ কিমি দূরে");
    expect(formatDistanceBengali(1)).toBe("১ কিমি দূরে");
    expect(formatDistanceBengali(4.5)).toBe("4.5 কিমি দূরে");
    expect(formatDistanceBengali(25)).toBe("25 কিমি দূরে");
    expect(formatDistanceBengali(null)).toBe("কাছাকাছি (Nearby)");
  });

  it("identifies nearest city from GPS coordinates", () => {
    // Coordinates near Dhaka Dhanmondi
    const city = findNearestCity(23.7461, 90.3742);
    expect(city.nameEn).toBe("Dhaka");
    expect(city.nameBn).toBe("ঢাকা");
  });
});

describe("Distance Radius Filtering in Discovery Feed", () => {
  it("filters discovery candidates by maximum distance radius", () => {
    // usr-aria-01 is in Dhaka
    // With 15 km radius: only nearby members (intra-city Dhaka) should appear
    const nearCandidates = devStore.getDiscoveryCandidates("usr-aria-01", 15);
    expect(nearCandidates.length).toBeGreaterThan(0);
    nearCandidates.forEach((c) => {
      expect(c.approx_distance_km).toBeLessThanOrEqual(15);
    });

    // With 300 km radius: members from further cities (Chittagong, Sylhet, etc.) appear
    const farCandidates = devStore.getDiscoveryCandidates("usr-aria-01", 300);
    expect(farCandidates.length).toBeGreaterThan(nearCandidates.length);
  });

  it("sorts candidates by distance in ascending order (closest first)", () => {
    const candidates = devStore.getDiscoveryCandidates("usr-aria-01", 300);
    for (let i = 0; i < candidates.length - 1; i++) {
      const current = candidates[i].approx_distance_km ?? 0;
      const next = candidates[i + 1].approx_distance_km ?? 0;
      expect(current).toBeLessThanOrEqual(next);
    }
  });
});
