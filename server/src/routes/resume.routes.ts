import express, { type RequestHandler } from "express";
import ResumeController from "../controllers/Githuv/resume.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = express.Router();

router.use(authMiddleware as unknown as RequestHandler);

router.post("/generate-ai-resume", ResumeController.generateResumeByAi);
router.post("/generate-scratch", ResumeController.generateScratch);

router.get("/list", ResumeController.listResumes);
router.get("/latex/:threadId", ResumeController.getLatexByThreadId);
router.post("/regenerate", ResumeController.regenerateResume);
router.post("/chat/:threadId", ResumeController.chatWithAI);
router.post("/feedback/:threadId", ResumeController.feedback);
router.post("/compile", ResumeController.compileLatex);

router.delete("/:threadId", ResumeController.deleteResume);
router.put("/:threadId", ResumeController.updateResume);

router.get("/pdf/:threadId", ResumeController.servePdfByThreadId);
router.get("/get-resume-data", ResumeController.getResumeData);

export default router;
