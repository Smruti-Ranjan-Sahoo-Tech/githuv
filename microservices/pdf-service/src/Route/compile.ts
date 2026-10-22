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
const PROBE_TIMEOUT_MS = Number(process.env.LATEX_PROBE_TIMEOUT_MS ?? 10000);

type CompilerSpec = {
  name: string;
  command: string;
  buildArgs: (texFile: string, outputDir: string) => string[];
};

type CompilerFailure = {
  name: string;
  command: string;
  error: string;
};

type CompilerResolution = {
  compiler: CompilerSpec | null;
  failures: CompilerFailure[];
};

let cachedResolution: CompilerResolution | undefined;

function isFile(candidate: string): boolean {
  try {
    return fsSync.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function ensureExecutable(candidate: string): void {
  try {
    fsSync.chmodSync(candidate, 0o755);
  } catch {}
}

function findBundledTectonic(): string | null {
  const roots = [
    process.cwd(),
    path.resolve(MODULE_DIR, ".."),
    path.resolve(MODULE_DIR, "..", ".."),
  ];

  for (const root of roots) {
    const candidate = path.join(root, "bin", "tectonic");
    if (isFile(candidate)) {
      // artifact round-trips can strip the executable bit
      ensureExecutable(candidate);
      return candidate;
    }
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

function collectCandidates(): CompilerSpec[] {
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

  return candidates;
}

// A compiler that is present on disk can still be unusable: the Azure App
// Service image ships without libgraphite2, which makes the bundled tectonic
// binary exit before it can process anything. Probe every candidate so a
// broken binary never blocks a working fallback.
function probeCompiler(spec: CompilerSpec): string | null {
  try {
    const result = spawnSync(spec.command, ["--version"], {
      timeout: PROBE_TIMEOUT_MS,
      encoding: "utf8",
    });

    if (result.error) {
      return result.error.message;
    }

    if (result.status !== 0) {
      const output = `${result.stdout ?? ""}${
        result.stderr ?? ""
      }`.trim();

      return output || `exited with status ${result.status}`;
    }

    return null;
  } catch (error: any) {
    return error?.message ?? "unknown error";
  }
}

function resolveCompiler(): CompilerResolution {
  if (cachedResolution) return cachedResolution;

  const failures: CompilerFailure[] = [];
  let compiler: CompilerSpec | null = null;

  for (const candidate of collectCandidates()) {
    const error = probeCompiler(candidate);

    if (error) {
      failures.push({
        name: candidate.name,
        command: candidate.command,
        error,
      });

      continue;
    }

    compiler = candidate;
    break;
  }

  cachedResolution = { compiler, failures };

  return cachedResolution;
}

export function getCompilerStatus() {
  const { compiler, failures } = resolveCompiler();

  return {
    available: compiler !== null,
    name: compiler?.name ?? null,
    command: compiler?.command ?? null,
    failures,
  };
}

function describeFailures(failures: CompilerFailure[]): string {
  if (failures.length === 0) {
    return "no LaTeX compiler candidates were found";
  }

  return failures
    .map(
      (failure) =>
        `${failure.name} (${failure.command}): ${failure.error}`
    )
    .join(" | ");
}

// The dynamic loader fails before tectonic can report anything, so the
// compiler output is the only place the missing library shows up.
function isMissingSharedLibrary(log: string): boolean {
  return /error while loading shared libraries|cannot open shared object file/i.test(
    log
  );
}

router.post("/compile", async (req, res) => {
  const { latex } = req.body;

  if (!latex || typeof latex !== "string") {
    return res.status(400).json({
      success: false,
      message: "latex field is required",
    });
  }

  const { compiler, failures } = resolveCompiler();

  if (!compiler) {
    return res.status(500).json({
      success: false,
      message:
        "No working LaTeX compiler available on the PDF service.",
      error: describeFailures(failures),
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
          killSignal: "SIGKILL",
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
      const compilerFailedToStart = isMissingSharedLibrary(compileLog);

      return res.status(500).json({
        success: false,
        message: compilerFailedToStart
          ? "The LaTeX compiler could not start on the PDF service."
          : "Failed to compile PDF",
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
