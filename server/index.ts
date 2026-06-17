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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
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


app.listen(port,async()=>{
    //Database connection
    await connectDB();
    console.log(`Server is running on port ${port}`);
})

 
 