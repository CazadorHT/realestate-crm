import { describe, it, expect } from "vitest";
import { renderPropertySocialTemplate } from "./social";

describe("renderPropertySocialTemplate - Project Name replacement", () => {
  const mockProperty: any = {
    id: "123",
    slug: "property-test",
    title: "Beautiful condo",
    listing_type: "SALE",
    property_type: "CONDO",
    price: 5000000,
    project: {
      name: {
        th: "เดอะ ไลน์ สุขุมวิท",
        en: "The Line Sukhumvit",
        cn: "素坤逸线公寓",
        ru: "Линия Сухумвит",
      }
    },
  };

  it("should replace {{project_name}} in Thai", async () => {
    const template = "โครงการ: {{project_name}} / #{{project_name_clean}}";
    const result = await renderPropertySocialTemplate(template, mockProperty, "th");
    expect(result).toContain("โครงการ: เดอะ ไลน์ สุขุมวิท");
    expect(result).toContain("#เดอะไลน์สุขุมวิท");
  });

  it("should replace {{project_name}} in English", async () => {
    const template = "Project: {{project_name}} / #{{project_name_clean}}";
    const result = await renderPropertySocialTemplate(template, mockProperty, "en");
    expect(result).toContain("Project: The Line Sukhumvit");
    expect(result).toContain("#TheLineSukhumvit");
  });

  it("should replace {{project_name}} in Chinese", async () => {
    const template = "项目: {{project_name}} / #{{project_name_clean}}";
    const result = await renderPropertySocialTemplate(template, mockProperty, "cn");
    expect(result).toContain("项目: 素坤逸线公寓");
    expect(result).toContain("#素坤逸线公寓");
  });

  it("should replace {{project_name}} in Russian", async () => {
    const template = "Проект: {{project_name}} / #{{project_name_clean}}";
    const result = await renderPropertySocialTemplate(template, mockProperty, "ru");
    expect(result).toContain("Проект: Линия Сухумвит");
    expect(result).toContain("#ЛинияСухумвит");
  });

  it("should fallback to name (Thai) if translation is missing", async () => {
    const propertyWithPartialProject: any = {
      ...mockProperty,
      project: {
        name: {
          th: "เดอะ ไลน์ สุขุมวิท",
        }
      },
    };
    const template = "Project: {{project_name}}";
    const result = await renderPropertySocialTemplate(template, propertyWithPartialProject, "en");
    expect(result).toContain("Project: เดอะ ไลน์ สุขุมวิท");
  });
});

describe("renderPropertySocialTemplate - Agent Name replacement", () => {
  it("should replace {{agent_name}} with nickname if available", async () => {
    const mockProperty: any = {
      property_agents: [
        {
          profiles: {
            full_name: "Patarapol Boonrit",
            nickname: "Aof",
          },
        },
      ],
    };
    const template = "Agent: {{agent_name}}";
    const result = await renderPropertySocialTemplate(template, mockProperty, "th");
    expect(result).toBe("Agent: Aof");
  });

  it("should fallback to full_name if nickname is missing", async () => {
    const mockProperty: any = {
      property_agents: [
        {
          profiles: {
            full_name: "Patarapol Boonrit",
          },
        },
      ],
    };
    const template = "Agent: {{agent_name}}";
    const result = await renderPropertySocialTemplate(template, mockProperty, "th");
    expect(result).toBe("Agent: Patarapol Boonrit");
  });
});

describe("renderPropertySocialTemplate - Instagram SEO hashtags", () => {
  it("should generate a complete, structured SEO hashtag block", async () => {
    const mockProperty: any = {
      listing_type: "RENT",
      property_type: "CONDO",
      rental_price: 18500,
      province: "กรุงเทพมหานคร",
      district: "วัฒนา",
      popular_area: "อโศก",
      transit_station_name: "อโศก",
      transit_type: "BTS",
      nearby_places: [
        { name: "Terminal 21" }
      ],
      project: {
        name: { th: "เดอะ ไลน์ อโศก" }
      }
    };
    const template = "{{instagram_seo}}";
    const result = await renderPropertySocialTemplate(template, mockProperty, "th");
    
    // Group 1: Project & Location
    expect(result).toContain("#เดอะไลน์อโศก");
    expect(result).toContain("#อโศก");
    expect(result).toContain("#คอนโดอโศก");
    expect(result).toContain("#เดอะไลน์อโศกอโศก");
    
    // Group 2: Transit
    expect(result).toContain("#BTSอโศก");
    expect(result).toContain("#คอนโดใกล้อโศก");
    
    // Group 3: Landmark
    expect(result).toContain("#ใกล้Terminal21");
    
    // Group 4: Budget
    expect(result).toContain("#ให้เช่าคอนโด");
    expect(result).toContain("#เช่าคอนโดไม่เกิน20000");
    
    // Group 5: Expats
    expect(result).toContain("#BangkokCondoForRent");
    expect(result).toContain("#ExpatBangkok");
  });
});
