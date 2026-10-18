import express, { type RequestHandler } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./src/routes/auth.routes";
import githuvRoutes from "./src/routes/githuv.routes";
import onboardingRoutes from "./src/routes/onboarding.routes";
import resumeRoutes from "./src/routes/resume.routes";
import connectDB from "./src/config/Database/mongodb";
import { generateToken } from "./src/config/JWT/jwt.config";
dotenv.config();


const app = express();
const port = process.env.PORT || 4002;
const clientOrigins = process.env.CLIENT_URL?.split(",").map((origin) =>
  // Render environment variables are usually entered without shell quotes, but
  // trim them here as well so copied dotenv values still match the Origin.
  origin.trim().replace(/^['"]+|['"]+$/g, "").replace(/\/+$/, "")
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: clientOrigins,
    credentials: true
  })
);
//octokit 
app.use("/api/auth", authRoutes as unknown as RequestHandler);
app.use("/api/githuv", githuvRoutes as unknown as RequestHandler);
app.use("/api/onboarding", onboardingRoutes as unknown as RequestHandler);
app.use("/api/resume", resumeRoutes as unknown as RequestHandler);

app.get("/", (req, res) => {
    res.send({
        message:"Hello World"
    });
})

app.get("/test", (req, res) => {
    res.status(200).json({ status: "ok", service: "server" });
})


app.listen(port,async()=>{
    //Database connection
    await connectDB();
    console.log(`Server is running on port ${port}`);
})
