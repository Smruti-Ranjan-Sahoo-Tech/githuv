import { writeFile, mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVICE_DIR = join(__dirname, "..", "..");
const BIN_DIR = join(SERVICE_DIR, "bin");
const OUTPUT_DIR = join(SERVICE_DIR, "output", "pdfs");
const PORT = parseInt(process.env.PORT ?? "3001");
const MAX_TEX_SIZE = 10 * 1024 * 1024;

function findCompiler(): string | null {
  const candidates = [
    join(BIN_DIR, "tectonic"),
    "tectonic",
    "pdflatex",
    "xelatex",
    "lualatex",
  ];
  const seen = new Set<string>();
  for (const cmd of candidates) {
    if (seen.has(cmd)) continue;
    seen.add(cmd);
    try {
      const result = Bun.spawnSync(["which", cmd], { stdio: "pipe" });
      if (result.exitCode === 0) return cmd;
    } catch {}
    if (existsSync(cmd)) return cmd;
  }
  return null;
}

async function compileLatex(texPath: string, outputDir: string): Promise<string> {
  const compiler = findCompiler();
  if (!compiler) {
    throw new Error(
      "No LaTeX compiler found. Run: bun run setup:tex"
    );
  }

  const isTectonic = compiler.includes("tectonic") || compiler === "tectonic";

  if (isTectonic) {
    const result = Bun.spawnSync([
      compiler,
      texPath,
      "--outdir", outputDir,
    ], {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    });

    if (result.exitCode !== 0) {
      const stderr = new TextDecoder().decode(result.stderr);
      throw new Error(stderr || "tectonic compilation failed");
    }
  } else {
    const result = Bun.spawnSync([
      compiler,
      "-interaction=nonstopmode",
      "-output-directory", outputDir,
      texPath,
    ], {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    });

    if (result.exitCode !== 0) {
      const stderr = new TextDecoder().decode(result.stderr);
      throw new Error(stderr || `${compiler} compilation failed`);
    }
  }

  const baseName = texPath.replace(/\.tex$/, "");
  const expectedPdf = `${baseName}.pdf`;

  if (existsSync(expectedPdf)) {
    return expectedPdf;
  }

  const outputPdf = join(outputDir, `${texPath.split("/").pop()!.replace(".tex", ".pdf")}`);
  if (existsSync(outputPdf)) {
    return outputPdf;
  }

  throw new Error("PDF was not generated. Check LaTeX syntax for errors.");
}

async function convertTexToPdf(
  texContent: string,
  filename?: string
): Promise<{ pdfPath: string; outputDir: string }> {
  const id = (filename || randomUUID()).replace(/[^a-zA-Z0-9_-]/g, "_");
  const texName = `${id}.tex`;

  await mkdir(OUTPUT_DIR, { recursive: true });

  const texPath = join(OUTPUT_DIR, texName);
  await writeFile(texPath, texContent, "utf-8");

  try {
    const pdfPath = await compileLatex(texPath, OUTPUT_DIR);
    return { pdfPath, outputDir: OUTPUT_DIR };
  } catch (err) {
    try { await unlink(texPath); } catch {}
    throw err;
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;

    if (url.pathname === "/health" && method === "GET") {
      const compiler = findCompiler();
      return Response.json({
        status: "ok",
        compiler: compiler ?? null,
        outputDir: OUTPUT_DIR,
      });
    }

    if (url.pathname === "/convert" && method === "POST") {
      try {
        const body = await req.json() as {
          tex: string;
          filename?: string;
        };

        if (!body.tex || typeof body.tex !== "string") {
          return Response.json(
            { error: "Missing or invalid 'tex' field in JSON body" },
            { status: 400 }
          );
        }

        if (body.tex.length > MAX_TEX_SIZE) {
          return Response.json(
            { error: `TeX content exceeds ${MAX_TEX_SIZE / 1024 / 1024}MB limit` },
            { status: 413 }
          );
        }

        const compiler = findCompiler();
        if (!compiler) {
          return Response.json(
            { error: "No LaTeX compiler available. Install tectonic." },
            { status: 500 }
          );
        }

        const result = await convertTexToPdf(body.tex, body.filename);
        const pdfBuffer = await Bun.file(result.pdfPath).arrayBuffer();
        const pdfName = result.pdfPath.split("/").pop()!;

        return new Response(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${pdfName}"`,
          },
        });
      } catch (err: any) {
        const msg = err.message || "Conversion failed";
        return Response.json({ error: msg }, { status: 500 });
      }
    }

    return Response.json({ error: "Not Found" }, { status: 404 });
  },
});

console.log(`[tex-to-pdf] running on http://localhost:${PORT}`);
console.log(`[tex-to-pdf] compiler: ${findCompiler() ?? "none"}`);
console.log(`[tex-to-pdf] output: ${OUTPUT_DIR}`);
