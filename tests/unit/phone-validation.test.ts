import { describe, it, expect } from "vitest";
import { validateAndFormatPhone } from "@/lib/utils/phone";

describe("Phone Number Validation and Normalization", () => {
  describe("Bangladesh (+880)", () => {
    it("accepts valid 11-digit Bangladeshi numbers starting with 01", () => {
      const res = validateAndFormatPhone("01712345678", "+880");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("+8801712345678");
    });

    it("accepts 10-digit numbers without leading 0", () => {
      const res = validateAndFormatPhone("1812345678", "+880");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("+8801812345678");
    });

    it("accepts numbers already prefixed with +880", () => {
      const res = validateAndFormatPhone("+8801912345678", "+880");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("+8801912345678");
    });

    it("strips dashes and spaces properly", () => {
      const res = validateAndFormatPhone("0131-234 5678", "+880");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("+8801312345678");
    });

    it("rejects invalid Bangladeshi operator prefixes", () => {
      // 010, 011, 012 are not valid mobile prefixes in Bangladesh (valid: 013 - 019)
      const res1 = validateAndFormatPhone("01012345678", "+880");
      expect(res1.isValid).toBe(false);
      expect(res1.error).toContain("সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর");

      const res2 = validateAndFormatPhone("01212345678", "+880");
      expect(res2.isValid).toBe(false);
    });

    it("rejects too short or too long numbers for Bangladesh", () => {
      const shortRes = validateAndFormatPhone("017123456", "+880");
      expect(shortRes.isValid).toBe(false);

      const longRes = validateAndFormatPhone("0171234567899", "+880");
      expect(longRes.isValid).toBe(false);
    });
  });

  describe("International Numbers", () => {
    it("accepts valid US number with dial code +1", () => {
      const res = validateAndFormatPhone("2025550143", "+1");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("+12025550143");
    });

    it("accepts valid UK number with dial code +44", () => {
      const res = validateAndFormatPhone("7911123456", "+44");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("+447911123456");
    });

    it("accepts valid UAE number with dial code +971", () => {
      const res = validateAndFormatPhone("501234567", "+971");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("+971501234567");
    });

    it("accepts raw number already prefixed with +", () => {
      const res = validateAndFormatPhone("+14155552671", "+1");
      expect(res.isValid).toBe(true);
      expect(res.cleanPhone).toBe("+14155552671");
    });

    it("rejects international numbers with less than 7 digits", () => {
      const res = validateAndFormatPhone("12345", "+1");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("আন্তর্জাতিক মোবাইল নম্বর");
    });

    it("rejects empty phone numbers", () => {
      const res = validateAndFormatPhone("", "+880");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("বাধ্যতামূলক");
    });
  });
});
