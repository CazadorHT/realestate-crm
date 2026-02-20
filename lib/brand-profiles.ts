export interface BrandProfile {
  name: string;
  primary: string; // HSL format
  secondary: string; // HSL format
  gradientFrom: string; // HSL format
  gradientTo: string; // HSL format
}

export const BRAND_PROFILES: Record<string, BrandProfile> = {
  profile1: {
    name: "Classic Blue (Indigo/Purple)",
    primary: "226 75% 48%", // Blue-600
    secondary: "210 40% 96.1%", // Slate-50/100
    gradientFrom: "217 91% 60%", // Blue-500
    gradientTo: "271 91% 65%", // Purple-500
  },
  profile2: {
    name: "Nature (Emerald/Teal)",
    primary: "160 84% 39%", // Emerald-600
    secondary: "149 80% 95%", // Emerald-50
    gradientFrom: "158 64% 52%", // Emerald-500
    gradientTo: "174 86% 44%", // Teal-500
  },
  profile3: {
    name: "Sunset (Rose/Amber)",
    primary: "346 84% 61%", // Rose-500
    secondary: "38 92% 95%", // Amber-50
    gradientFrom: "346 84% 61%", // Rose-500
    gradientTo: "45 93% 47%", // Amber-500
  },
};
