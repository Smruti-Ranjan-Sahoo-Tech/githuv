import express from "express";
import githuv from "../controllers/Githuv/githuv.controller";
import ContributionController from "../controllers/Githuv/contribution.controller";

const router =  express.Router();

router.get("/github-user",githuv.getGithuvUser);
router.post("/create-repo",githuv.createInitialRepo);
router.post("/print-contribution",ContributionController.printContribution);

export default router;
