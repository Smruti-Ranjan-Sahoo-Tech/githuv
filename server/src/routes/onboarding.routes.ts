import express, { type RequestHandler } from "express";

import onboarding from "../controllers/Githuv/onboarding.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = express.Router();

router.use(authMiddleware as unknown as RequestHandler);

router.get("/me", onboarding.getMe);
router.post("/step1", onboarding.step1);
router.post("/step2", onboarding.step2);
router.post("/step3", onboarding.step3);
router.post("/step4", onboarding.step4);
router.post("/step5", onboarding.step5);

export default router;
