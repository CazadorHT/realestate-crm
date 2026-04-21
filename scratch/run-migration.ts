/**
 * 🛡️ Final Execution: Secret Migration
 * Runs the migrateSecretsAction to encrypt all existing tokens.
 */
import { migrateSecretsAction } from "../features/site-settings/actions";

async function runMigration() {
  console.log("🚀 Starting Secret Migration...");
  
  // Define a mock ENCRYPTION_KEY if it's not set, or ensure it's loaded from .env
  // For this to work, we must ensure NVM/Node environment is correct as before
  
  try {
    const result = await migrateSecretsAction();
    if (result.success) {
      console.log(`✅ Success: ${result.message}`);
      console.log(`📊 Migrated Items: ${result.count}`);
    } else {
      console.error(`❌ Failed: ${result.message}`);
    }
  } catch (error) {
    console.error("❌ Migration script crashed:", error);
  }
}

runMigration();
