import { describe, it, expect } from "vitest";
import { calculateAge } from "@/lib/utils";

describe("Age Validation & 18+ Requirement", () => {
  it("should calculate correct age for adult users", () => {
    // 25 years old
    const today = new Date();
    const dob = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    expect(calculateAge(dob.toISOString())).toBe(25);
  });

  it("should detect underage dates of birth (< 18)", () => {
    const today = new Date();
    // 17 years old
    const underageDob = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    const age = calculateAge(underageDob.toISOString());
    expect(age).toBeLessThan(18);
  });

  it("should handle exact 18th birthday boundary correctly", () => {
    const today = new Date();
    // Exactly 18 years ago today
    const exact18Dob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    expect(calculateAge(exact18Dob.toISOString())).toBe(18);

    // 18 years ago tomorrow (still 17 today)
    const almost18Dob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);
    expect(calculateAge(almost18Dob.toISOString())).toBe(17);
  });
});
