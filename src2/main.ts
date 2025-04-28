async function run() {
    console.log("Running database setup...");
  
    const { default: dbReady } = await import("./data/build");
    await dbReady; // ✅ this is the missing piece
  
    console.log("Starting server...");
    await import("./server"); 
  }
  
  run().catch(err => {
    console.error("App failed to start:", err);
  });