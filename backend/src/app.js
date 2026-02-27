import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { startBookingCron } from "./cron/booking.cron/autoCompletionCron.js";

// Import routes
// default import('./routes/index.js');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Start booking cron
startBookingCron();

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Register API routes
import routes from "./routes/index.js";
app.use("/api", routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;

