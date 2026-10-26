export interface PhoneValidationResult {
  isValid: boolean;
  cleanPhone: string;
  error?: string;
}

/**
 * Validates and normalizes phone numbers.
 * - For Bangladesh (+880): Accepts 11 digits (e.g. 017XXXXXXXX, 17XXXXXXXX, or +88017XXXXXXXX)
 *   and normalizes to standard +8801XXXXXXXXX format.
 * - For International: Validates E.164 compliance (7-15 digits total) with chosen dial code.
 */
export function validateAndFormatPhone(
  phone: string | undefined | null,
  countryCode: string = "+880"
): PhoneValidationResult {
  if (!phone || !String(phone).trim()) {
    return {
      isValid: false,
      cleanPhone: "",
      error: "মোবাইল নম্বর দেওয়া বাধ্যতামূলক (Mobile phone number is required).",
    };
  }

  const rawDigits = String(phone).trim().replace(/[^\d+]/g, "");

  if (countryCode === "+880") {
    let digitsOnly = rawDigits.replace(/\D/g, "");
    if (digitsOnly.startsWith("880")) digitsOnly = digitsOnly.slice(3);
    if (digitsOnly.startsWith("0")) digitsOnly = digitsOnly.slice(1);

    if (!/^1[3-9]\d{8}$/.test(digitsOnly)) {
      return {
        isValid: false,
        cleanPhone: "",
        error: "অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01712345678 বা 1712345678)।",
      };
    }
    return {
      isValid: true,
      cleanPhone: `+880${digitsOnly}`,
    };
  }

  // International phone numbers
  const digits = rawDigits.startsWith("+")
    ? rawDigits
    : `${countryCode}${rawDigits.replace(/\D/g, "")}`;
  const numOnly = digits.replace(/\D/g, "");

  if (numOnly.length < 7 || numOnly.length > 15) {
    return {
      isValid: false,
      cleanPhone: "",
      error: "অনুগ্রহ করে একটি সঠিক আন্তর্জাতিক মোবাইল নম্বর দিন (৭ থেকে ১৫ ডিজিট)।",
    };
  }

  const cleanPhone = digits.startsWith("+") ? digits : `+${digits}`;
  return {
    isValid: true,
    cleanPhone,
  };
}
