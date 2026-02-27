import { PORT } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

async function startServer() {
  await connectDB();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} and reachable from emulator at http://10.0.2.2:${PORT}`);
  });
}

startServer();

