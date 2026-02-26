export type ESignStatus = "DRAFT" | "SENT" | "SIGNED" | "DECLINED" | "EXPIRED";

export interface ESignService {
  createEnvelope(params: {
    documentUrl: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    message?: string;
  }): Promise<{ envelopeId: string; status: ESignStatus }>;

  getEnvelopeStatus(envelopeId: string): Promise<ESignStatus>;
}

/**
 * Mock Service for development
 */
export class MockESignService implements ESignService {
  async createEnvelope(params: any) {
    return { envelopeId: "mock-" + Date.now(), status: "SENT" as ESignStatus };
  }

  async getEnvelopeStatus(envelopeId: string) {
    return "SENT" as ESignStatus;
  }
}

/**
 * Adobe Sign Implementation (Placeholder)
 */
export class AdobeSignService implements ESignService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createEnvelope(params: any) {
    // In a real implementation, this would call Adobe Sign API
    // 1. Upload transient document
    // 2. Create agreement
    // 3. Send and get ID
    console.log("Adobe Sign: Creating envelope for", params.recipientEmail);
    return { envelopeId: "as-" + Date.now(), status: "SENT" as ESignStatus };
  }

  async getEnvelopeStatus(envelopeId: string) {
    console.log("Adobe Sign: Getting status for", envelopeId);
    return "SENT" as ESignStatus;
  }
}

export function getESignService() {
  const provider = process.env.ESIGN_PROVIDER || "MOCK";
  const apiKey = process.env.ADOBE_SIGN_API_KEY || "";

  if (provider === "ADOBE_SIGN" && apiKey) {
    return new AdobeSignService(apiKey);
  }

  return new MockESignService();
}
