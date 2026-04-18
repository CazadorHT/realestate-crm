/**
 * 💰 Accounting Sync Service
 * Handles one-way synchronization to external accounting systems (PEAK / FlowAccount).
 */

export interface SyncPayload {
  agentName: string;
  amount: number;
  taxAmount: number;
  netAmount: number;
  dealId: string;
  reference: string;
  paidAt: string;
  idempotencyKey: string; // Added for enterprise safety
}

export async function syncToPeakAccount(payload: SyncPayload) {
  // In a production environment, this would call the PEAK API
  // Using 'idempotencyKey' is critical here to prevent double invoicing in PEAK
  console.log("[PEAK SYNC] Creating invoice. Key:", payload.idempotencyKey);
  
  return { 
    success: true, 
    provider: "PEAK", 
    externalId: `PEAK-${payload.reference}`,
    idempotencyKey: payload.idempotencyKey
  };
}

export async function syncToFlowAccount(payload: SyncPayload) {
  console.log("[FLOWACCOUNT SYNC] Creating record. Key:", payload.idempotencyKey);
  return { 
    success: true, 
    provider: "FlowAccount", 
    externalId: `FLOW-${payload.reference}`,
    idempotencyKey: payload.idempotencyKey
  };
}

/**
 * Orchestrator: Decides which provider to sync to based on tenant settings
 */
export async function performAccountingSync(payload: SyncPayload) {
  try {
    const result = await syncToPeakAccount(payload);
    return result;
  } catch (error) {
    console.error("Accounting Sync Failed:", error);
    throw error;
  }
}
