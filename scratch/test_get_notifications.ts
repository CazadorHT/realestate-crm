import dotenv from "dotenv";
dotenv.config();

// Mock cookies for server client if needed, or see if it fails
import { getNotificationsAction } from "../lib/actions/notifications";

async function test() {
  try {
    console.log("Calling getNotificationsAction...");
    const res = await getNotificationsAction();
    console.log("Result:", res);
  } catch (err) {
    console.error("Caught error:", err);
  }
}

test();
