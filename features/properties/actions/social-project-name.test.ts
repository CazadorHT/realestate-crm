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
