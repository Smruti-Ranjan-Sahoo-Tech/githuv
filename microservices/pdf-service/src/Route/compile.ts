import express from "express";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { execFile, spawnSync } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";

const execFileAsync = promisify(execFile);

const router = express.Router();

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

const COMPILE_TIMEOUT_MS = Number(process.env.LATEX_TIMEOUT_MS ?? 120000);

type CompilerSpec = {
  name: string;
  command: string;
  buildArgs: (texFile: string, outputDir: string) => string[];
};

let cachedCompiler: CompilerSpec | null | undefined;

function isFile(candidate: string): boolean {
  try {
    return fsSync.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function findBundledTectonic(): string | null {
  const roots = [
    process.cwd(),
    path.resolve(MODULE_DIR, ".."),
    path.resolve(MODULE_DIR, "..", ".."),
  ];

  for (const root of roots) {
    const candidate = path.join(root, "bin", "tectonic");
    if (isFile(candidate)) return candidate;
  }

  return null;
}

function which(command: string): string | null {
  try {
    const result = spawnSync("which", [command], { stdio: "pipe" });
    if (result.status === 0) {
      const resolved = result.stdout.toString().trim();
      if (resolved) return resolved;
    }
  } catch {}

  return null;
}

function tectonicArgs(
  texFile: string,
  outputDir: string
): string[] {
  // continue-on-errors mirrors xelatex -interaction=nonstopmode: keep going
  // after recoverable LaTeX errors and still emit the PDF
  return ["-Z", "continue-on-errors", "--outdir", outputDir, texFile];
}

function latexArgs(
  texFile: string,
  outputDir: string
): string[] {
  return [
    "-interaction=nonstopmode",
    "-no-shell-escape",
    `-output-directory=${outputDir}`,
    texFile,
  ];
}

function resolveCompiler(): CompilerSpec | null {
  if (cachedCompiler !== undefined) return cachedCompiler;

  const candidates: CompilerSpec[] = [];

  const bundledTectonic = findBundledTectonic();

  if (bundledTectonic) {
    candidates.push({
      name: "tectonic",
      command: bundledTectonic,
      buildArgs: tectonicArgs,
    });
  }

  const systemTectonic = which("tectonic");

  if (systemTectonic) {
    candidates.push({
      name: "tectonic",
      command: systemTectonic,
      buildArgs: tectonicArgs,
    });
  }

  for (const command of ["xelatex", "pdflatex", "lualatex"]) {
    const resolved = which(command);

    if (resolved) {
      candidates.push({
        name: command,
        command: resolved,
        buildArgs: latexArgs,
      });
    }
  }

  cachedCompiler = candidates[0] ?? null;

  return cachedCompiler;
}

router.post("/compile", async (req, res) => {
  const { latex } = req.body;

  if (!latex || typeof latex !== "string") {
    return res.status(400).json({
      success: false,
      message: "latex field is required",
    });
  }

  const compiler = resolveCompiler();

  if (!compiler) {
    return res.status(500).json({
      success: false,
      message:
        "No LaTeX compiler available. Expected bin/tectonic in the app package.",
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

    let compileLog = "";

    try {
      const result = await execFileAsync(
        compiler.command,
        compiler.buildArgs(texFile, workDir),
        {
          timeout: COMPILE_TIMEOUT_MS,
          maxBuffer: 10 * 1024 * 1024,
        }
      );

      compileLog = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    } catch (error: any) {
      // Compilers exit non-zero even for recoverable errors that still produce a PDF
      compileLog = `${error.stdout ?? ""}${error.stderr ?? ""}${
        error.message ?? ""
      }`;
    }

    let pdfBuffer: Buffer;

    try {
      pdfBuffer = await fs.readFile(pdfFile);
    } catch {
      return res.status(500).json({
        success: false,
        message: "Failed to compile PDF",
        error:
          compileLog.slice(-2000) ||
          `No PDF produced by ${compiler.name}`,
      });
    }

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
