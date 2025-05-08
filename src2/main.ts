import 'dotenv/config'
import {start} from "./background/background"

async function run() {
    console.log("Running database setup...");
  
    const { default: dbReady } = await import("./data/build");
    await dbReady; 
  
    console.log("Starting server...");
    await import("./server"); 

    // console.log("Starting background services...")
    // start()
  }
  
  run().catch(err => {
    console.error("App failed to start:", err);
  });