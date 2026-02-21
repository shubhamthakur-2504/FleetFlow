import 'dotenv/config'; // Loads .env at the very top
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import prisma from "./db/prisma.js"; 
import { PORT, CLIENT_URL } from "./constant.js";

import userRouter from "./routes/user.route.js";
import vehicleRouter from "./routes/vehicle.route.js";
import driverRouter from "./routes/driver.route.js";
import tripRouter from "./routes/trip.route.js";
import logRouter from "./routes/log.route.js";
import expenseRouter from "./routes/expense.route.js";
import analyticsRouter from "./routes/analytics.route.js";
const app = express();


app.use(cors({
    origin: CLIENT_URL || "http://localhost:5173", 
    credentials: true 
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.use("/api/auth", userRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/drivers", driverRouter);
app.use("/api/trips", tripRouter);
app.use("/api/logs", logRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/analytics", analyticsRouter);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(errors.length > 0 && { errors: errors })
  });
});


async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL Connected successfully via Prisma");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

startServer();