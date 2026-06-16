import { subscribeToLineAction } from "../features/leads/public-actions";

async function main() {
  console.log("Testing subscribeToLineAction with '@testsub123'...");
  try {
    const res = await subscribeToLineAction("@testsub123");
    console.log("Result:", res);
  } catch (err) {
    console.error("Error running action:", err);
  }
}

main();
