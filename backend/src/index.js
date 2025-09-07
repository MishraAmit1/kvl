import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { connectDB } from "./database/db.js";

dotenv.config();
const requiredEnvVars = [
  "MONGODB_URI",
  "PORT",
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "SUPABASE_SERVICE_KEY",
];
requiredEnvVars.forEach((envVariable) => {
  if (!process.env[envVariable]) {
    console.error(
      `Error: ${envVariable} is not defined in environment variables`
    );
    process.exit(1);
  }
});

// initialize the express app
const app = express();
const PORT = process.env.PORT || 3000;

// Global rate limiter for all routes
const globalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Max 1000 requests per IP in the window
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// MIDDLEWARES Start
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "https://kashivishwanath.vercel.app",
        "http://localhost:5173",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(cookieParser());
app.use(globalRateLimiter);

// Routes Import
import userRouter from "./routes/user.routes.js";
import customerRoute from "./routes/customer.routes.js";
import vehicleRoute from "./routes/vehicle.routes.js";
import driverRoute from "./routes/driver.routes.js";
import consignmentsRoute from "./routes/consignment.routes.js";
import freightBillRouter from "./routes/freightbill.routes.js";
import loadChalanRouter from "./routes/loadChalan.routes.js";
app.get("/", async (req, res, next) => {
  res.json({
    message: "Running",
  });
});

// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/customers", customerRoute);
app.use("/api/v1/vehicles", vehicleRoute);
app.use("/api/v1/drivers", driverRoute);
app.use("/api/v1/consignments", consignmentsRoute);
app.use("/api/v1/freight-bills", freightBillRouter);
app.use("/api/v1/load-chalans", loadChalanRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found 404",
    errorMessage: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      error: err.message,
    });
  }
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      message: "Unauthorized",
      error: err.message,
    });
  }
  console.error("Server Error:", err.stack);
  return res.status(500).json({
    message: "Internal Server Error",
    errorMessage: err.message,
  });
});

const startServer = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    app
      .listen(PORT, () => {
        console.log(`Server is running on PORT ${process.env.PORT}`);
      })
      .on("error", (error) => {
        console.log("Error starting server", error);
        process.exit(1);
      });
  } catch (error) {
    console.log("Error starting server", error);
    process.exit(1);
  }
};
startServer();
