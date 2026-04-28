/**
 * 🤖 Elite AI Prompt Engineering for Real Estate
 * This utility crafts structured prompts for Gemini to ensure consistent,
 * multilingual, and SEO-optimized property descriptions.
 */

import { PropertyTableData } from "@/features/properties/types";

export function craftPropertyDescriptionPrompt(property: any, hasImage: boolean = false) {
  const {
    title,
    property_type,
    listing_type,
    price,
    rental_price,
    district,
    province,
    size_sqm,
    land_size_sqwah,
    bedrooms,
    bathrooms,
    is_pet_friendly,
    is_fully_furnished,
    is_new,
    popular_area
  } = property;

  const context = `
    Property Type: ${property_type}
    Listing Type: ${listing_type}
    Title: ${title}
    Location: ${district}, ${province}${popular_area ? ` (Area: ${popular_area})` : ""}
    Price: ${price ? `${price.toLocaleString()} THB` : "N/A"}
    Rental: ${rental_price ? `${rental_price.toLocaleString()} THB/month` : "N/A"}
    Size: ${size_sqm ? `${size_sqm} sqm` : ""} ${land_size_sqwah ? `(Land: ${land_size_sqwah} sq.wah)` : ""}
    Layout: ${bedrooms || 0} Bedrooms, ${bathrooms || 0} Bathrooms
    Features: ${is_pet_friendly ? "Pet Friendly, " : ""}${is_fully_furnished ? "Fully Furnished, " : ""}${is_new ? "Brand New" : ""}
  `;

  const visualInstruction = hasImage ? `
    ### 👁️ VISUAL VERIFICATION (CRITICAL):
    You have been provided with an image of the property (Cover Image). 
    1. Cross-reference the provided data with the image. 
    2. Extract visual features not mentioned in text (e.g., Decoration style, view, ceiling height, quality of materials).
    3. Ensure the tone matches the visual quality of the property.
    4. SAFETY: If you are unsure about a visual feature, do not mention it. Avoid hallucinations.
  ` : "";

  return `
    You are an elite real estate marketing expert and SEO specialist.
    Based on the property data below, generate a professional, engaging, and persuasive property description in 4 languages: Thai, English, Chinese (Simplified), and Russian.
    
    ### PROPERTY DATA:
    ${context}
    ${visualInstruction}

    ### REQUIREMENTS:
    1. **Tone**: ${hasImage ? "Adjusted to visual quality (Elite/Standard/Cozy)" : "Professional, inviting, and upscale"}.
    2. **Structure**: 
       - Catchy Headline
       - Key Features (Bullet points)
       - Location Highlights
       - Call to action
    3. **SEO**: Generate a Meta Title (max 60 chars) and Meta Description (max 160 chars) optimized for search engines.
    4. **Output Format**: MANDATORY JSON. Do not include any markdown formatting or extra text outside the JSON block.

    ### JSON REGUIRED SCHEMA:
    {
      "th": "Thai description...",
      "en": "English description...",
      "cn": "Chinese description...",
      "ru": "Russian description...",
      "meta_title": "SEO Optimized Title",
      "meta_description": "SEO Optimized Description",
      "search_summary": "A concise, single-paragraph summary containing all key keywords (Location, Condo name, Distance to BTS/MRT, Features) for high-performance Full Text Search."
    }
  `;
}
