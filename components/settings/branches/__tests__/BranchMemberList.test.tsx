import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BranchMemberList, BranchMemberV3 } from "../BranchMemberList";

// 🧪 Mock Data - Tough Scenarios
const mockMembers: BranchMemberV3[] = [
  {
    id: "tm_1",
    identity_id: "id_1",
    role: "OWNER",
    joined_at: "2024-01-01",
    identity: {
      id: "id_1",
      display_name: "John Wick",
      full_name: "John Jonathan Wick",
      nickname: "Baba Yaga",
      email: "wick@continental.com",
      phone: "0811111111",
      
      avatar_url: null,
      is_active: true,
      line_id: "wick_line",
    }
  },
  {
    id: "tm_2",
    identity_id: "id_2",
    role: "AGENT",
    joined_at: "2024-02-01",
    identity: {
      id: "id_2",
      display_name: "Agent Smith",
      full_name: "Smith Matrix",
      nickname: "Smithy",
      email: "smith@matrix.net",
      phone: "0822222222",
      avatar_url: null,
      is_active: false, // 🚨 Inactive scenario
      wechat_user_id: "smith_wechat",
      whatsapp_user_id: "smith_wa"
    }
  }
];

describe("BranchMemberList Hardened Audit", () => {
  const onTransfer = vi.fn();
  const onRemove = vi.fn();

  it("should render all members correctly with initial state", () => {
    render(<BranchMemberList members={mockMembers} onTransfer={onTransfer} onRemove={onRemove} />);
    
    expect(screen.getByText("John Wick")).toBeDefined();
    expect(screen.getByText("Agent Smith")).toBeDefined();
    expect(screen.getByText("(Baba Yaga)")).toBeDefined();
  });

  it("should filter members accurately using the search input (Multi-field Attack)", () => {
    render(<BranchMemberList members={mockMembers} onTransfer={onTransfer} onRemove={onRemove} />);
    
    const searchInput = screen.getByPlaceholderText(/Search/i);

    // 1. Search by Phone
    fireEvent.change(searchInput, { target: { value: "0822" } });
    expect(screen.queryByText("John Wick")).toBeNull();
    expect(screen.getByText("Agent Smith")).toBeDefined();

    // 2. Search by Nickname (Baba Yaga)
    fireEvent.change(searchInput, { target: { value: "yaga" } });
    expect(screen.getByText("John Wick")).toBeDefined();
    expect(screen.queryByText("Agent Smith")).toBeNull();

    // 3. Search by Email
    fireEvent.change(searchInput, { target: { value: "matrix" } });
    expect(screen.getByText("Agent Smith")).toBeDefined();
  });

  it("should display correct social indicators (L, W, C sync)", () => {
    render(<BranchMemberList members={mockMembers} onTransfer={onTransfer} onRemove={onRemove} />);
    
    // John Wick has Line (L)
    expect(screen.getByTitle("LINE Linked")).toBeDefined();
    
    // Agent Smith has WhatsApp (W) and WeChat (C)
    expect(screen.getByTitle("WhatsApp Linked")).toBeDefined();
    expect(screen.getByTitle("WeChat Linked")).toBeDefined();
  });

  it("should enforce SECURITY: OWNER must NOT have remove/transfer actions", () => {
    render(<BranchMemberList members={mockMembers} onTransfer={onTransfer} onRemove={onRemove} />);
    
    // Find John Wick's container
    const johnContainer = screen.getByText("John Wick").closest(".group");
    
    // Buttons for John (OWNER) should be missing
    const transferBtn = johnContainer?.querySelector('button[title*="Transfer"]');
    const removeBtn = johnContainer?.querySelector('button svg.lucide-trash2');
    
    expect(transferBtn).toBeNull();
    expect(removeBtn).toBeNull();
  });

  it("should handle inactive state with correct visual classes", () => {
    render(<BranchMemberList members={mockMembers} onTransfer={onTransfer} onRemove={onRemove} />);
    
    const smithContainer = screen.getByText("Agent Smith").closest(".group");
    expect(smithContainer?.className).toContain("grayscale");
    expect(smithContainer?.className).toContain("opacity-60");
  });

  it("should trigger callbacks with correct member data on interaction", () => {
    render(<BranchMemberList members={mockMembers} onTransfer={onTransfer} onRemove={onRemove} />);
    
    // Click Transfer for Agent Smith
    const transferBtns = screen.getAllByTitle("ย้ายสาขา (Transfer)");
    fireEvent.click(transferBtns[0]); // Smith is the only one with actions
    
    expect(onTransfer).toHaveBeenCalledWith(mockMembers[1]);
  });
});
