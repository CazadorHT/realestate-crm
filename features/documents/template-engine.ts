/**
 * Simple template engine to replace {{placeholders}} with data.
 * Supports nested access like {{lead.full_name}}
 */
export function replacePlaceholders(content: string, data: any): string {
  if (!content) return "";
  return content.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const keys = key.trim().split(".");
    let value = data;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return "";
      }
    }

    return value !== null && value !== undefined && value !== "" ? String(value) : "";
  });
}

/**
 * Convert number to Thai Baht words
 */
export function amountToThaiWords(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return "";
  if (amount === 0) return "ศูนย์บาทถ้วน";
  
  const THAI_NUMBERS = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const THAI_UNITS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  const baht = Math.floor(amount);
  const satang = Math.round((amount - baht) * 100);
  
  function convert(num: number): string {
    if (num === 0) return "";
    let result = "";
    
    // Handle millions separately for recursive scaling
    if (num >= 1000000) {
        result += convert(Math.floor(num / 1000000)) + "ล้าน";
        num %= 1000000;
        if (num === 0) return result;
    }

    const str = num.toString();
    const len = str.length;
    
    for (let i = 0; i < len; i++) {
        const digit = parseInt(str[i]);
        const pos = len - i - 1;
        
        if (digit !== 0) {
            if (pos === 1 && digit === 1) result += "";
            else if (pos === 1 && digit === 2) result += "ยี่";
            else if (pos === 0 && digit === 1 && len > 1 && str[i-1] !== "0") result += "เอ็ด";
            else result += THAI_NUMBERS[digit];
            
            result += THAI_UNITS[pos];
        }
    }
    return result;
  }
  
  let bahtText = convert(baht) + "บาท";
  if (satang === 0) bahtText += "ถ้วน";
  else bahtText += convert(satang) + "สตางค์";
  
  return bahtText;
}

/**
 * Convert number to English words (Simplified)
 */
export function amountToEnglishWords(amount: number | null | undefined): string {
    if (!amount) return "Zero Baht";
    
    const toWords = (num: number): string => {
        const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        const scales = ["", "Thousand", "Million", "Billion"];

        if (num === 0) return "";
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? "-" + ones[num % 10] : "");
        if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " and " + toWords(num % 100) : "");
        
        for (let i = 3; i >= 1; i--) {
            const scale = Math.pow(1000, i);
            if (num >= scale) {
                return toWords(Math.floor(num / scale)) + " " + scales[i] + (num % scale !== 0 ? " " + toWords(num % scale) : "");
            }
        }
        return "";
    };

    const baht = Math.floor(amount);
    const satang = Math.round((amount - baht) * 100);
    
    let text = toWords(baht) + " Baht";
    if (satang > 0) {
        text += " and " + toWords(satang) + " Satang";
    } else {
        text += " Only";
    }
    
    return text;
}

/**
 * Localize an object by aliasing language-specific fields
 * (e.g. title_en -> title) based on the target language.
 */
export function localizeObject(obj: any, lang: "th" | "en" | "cn") {
  if (!obj || typeof obj !== "object") return obj;

  const result = { ...obj };
  const suffix = lang === "th" ? "" : `_${lang}`;

  if (suffix) {
    // Look for fields ending in _en or _cn and alias them to the base field
    Object.keys(obj).forEach((key) => {
      if (key.endsWith(suffix)) {
        const baseKey = key.slice(0, -suffix.length);
        if (obj[key]) {
          result[baseKey] = obj[key];
        }
      }
    });
  }

  return result;
}

/**
 * Get translations for the specified language
 */
export async function getTranslations(lang: "th" | "en" | "cn") {
  // In a real Next.js app with next-intl, we'd use useTranslations.
  // Here we'll manually load the JSONs for server-side generation.
  // We use require to load it once as a static object.
  const th = require("@/i18n/locales/th.json");
  const en = require("@/i18n/locales/en.json");
  const cn = require("@/i18n/locales/cn.json");

  const dicts = { th, en, cn };
  return dicts[lang]?.documents || dicts.th.documents;
}

/**
 * Format currency for templates
 */
export function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "";
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for templates with language support
 */
export function formatDate(
  dateStr: string | Date | null | undefined,
  lang: "th" | "en" | "cn" = "th",
) {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";

    const locales = {
      th: "th-TH",
      en: "en-US",
      cn: "zh-CN",
    };

    return date.toLocaleDateString(locales[lang], {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return "-";
  }
}

/**
 * Alias for backward compatibility if needed
 */
export function formatDateThai(dateStr: string | Date | null | undefined) {
  return formatDate(dateStr, "th");
}
