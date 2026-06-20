import express from "express";
import githuv from "../controllers/Githuv/githuv.controller";
import ContributionController from "../controllers/Githuv/contribution.controller";
import authMiddleware from "../middleware/auth.middleware";

const router =  express.Router();

router.get("/github-user",authMiddleware,githuv.getGithuvUser);
router.post("/create-repo",authMiddleware,githuv.createInitialRepo);
router.post("/print-contribution",authMiddleware,ContributionController.printContribution);
router.post("/repository-readme/generate", authMiddleware, githuv.generateRepositoryReadme);
router.post("/repository-readme/publish", authMiddleware, githuv.publishRepositoryReadme);
router.post("/repository-readme/undo", authMiddleware, githuv.undoRepositoryReadme);
const dashboardHandler: any = [authMiddleware, githuv.getDashboardData];
router.get("/dashboard-data", dashboardHandler);

export default router;
