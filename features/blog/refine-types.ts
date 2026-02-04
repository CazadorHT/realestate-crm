export type ContentRefineInput = {
  content: string;
  instruction: string;
  type: "grammar" | "professional" | "expand" | "summarize" | "custom";
};

export type RefineResponse = {
  success: boolean;
  refinedContent?: string;
  error?: string;
};
