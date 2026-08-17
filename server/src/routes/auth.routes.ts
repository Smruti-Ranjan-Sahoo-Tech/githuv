import express from "express";
import auth from "../controllers/Githuv/auth.controller";

const router = express.Router();

router.post("/login", auth.login);
router.post("/vscode-token", auth.vscodeToken);
router.post("/vscode-token/device", auth.vscodeDeviceToken);
router.post("/vscode-token/exchange", auth.vscodeTokenExchange);
router.post("/vscode/github", auth.vscodeGithubProxy);

export default router;
