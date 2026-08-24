import { describe, it, expect } from "vitest";
import { mapDbError } from "./db-error";

describe("mapDbError (Bilingual Database Error Mapping)", () => {
  it("translates unique constraint violations into English and Thai", () => {
    const error = { code: "23505", message: "duplicate key value violates unique constraint", details: "Key (email)=(test@example.com) already exists." };
    expect(mapDbError(error, "th")).toBe("ขออภัย อีเมลนี้มีในระบบแล้ว");
    expect(mapDbError(error, "en")).toBe("This email address is already registered.");
  });

  it("translates foreign key violation into English and Thai", () => {
    const error = { code: "23503", message: "foreign key violation" };
    expect(mapDbError(error, "th")).toContain("Foreign Key");
    expect(mapDbError(error, "en")).toContain("Foreign Key");
    expect(mapDbError(error, "en")).toBe("Cannot complete operation because this data is referenced by other records (Foreign Key).");
  });

  it("translates RLS / permission errors into English and Thai", () => {
    const error = { code: "42501", message: "insufficient_privilege" };
    expect(mapDbError(error, "th")).toContain("Row-Level Security (RLS)");
    expect(mapDbError(error, "en")).toBe("You do not have permission to perform this action (Row-Level Security).");
  });

  it("translates not null violations into English and Thai", () => {
    const error = { code: "23502", message: "null value in column violates not-null constraint" };
    expect(mapDbError(error, "th")).toContain("Not Null");
    expect(mapDbError(error, "en")).toBe("Please fill in all required fields (Missing required value).");
  });

  it("translates timeout into English and Thai", () => {
    const error = { code: "57014", message: "canceling statement due to statement timeout" };
    expect(mapDbError(error, "th")).toContain("Timeout");
    expect(mapDbError(error, "en")).toBe("Operation timed out. Please wait a moment and try again (Timeout).");
  });
});
