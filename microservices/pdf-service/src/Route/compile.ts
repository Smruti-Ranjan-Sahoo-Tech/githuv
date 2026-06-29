import express from "express";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const router = express.Router();

router.post("/compile", async (req, res) => {
  const { latex } = req.body;

  if (!latex || typeof latex !== "string") {
    return res.status(400).json({
      success: false,
      message: "latex field is required",
    });
  }

  const jobId = crypto.randomUUID();

  const workDir = path.join(
    os.tmpdir(),
    `latex-${jobId}`
  );

  try {
    await fs.mkdir(workDir, { recursive: true });

    const texFile = path.join(
      workDir,
      "resume.tex"
    );

    const pdfFile = path.join(
      workDir,
      "resume.pdf"
    );

    await fs.writeFile(
      texFile,
      latex,
      "utf8"
    );

    try {
      await execAsync(
        `xelatex -interaction=nonstopmode -no-shell-escape -output-directory="${workDir}" "${texFile}"`,
        {
          timeout: 20000,
          maxBuffer: 10 * 1024 * 1024,
        }
      );
    } catch {
      // xelatex exits non-zero even for recoverable errors that still produce a PDF
    }

    const pdfBuffer = await fs.readFile(pdfFile);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');

    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error("LaTeX Compile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to compile PDF",
      error: error.message,
    });
  } finally {
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch {}
  }
});

export default router;