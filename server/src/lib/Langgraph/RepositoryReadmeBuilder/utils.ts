import { Buffer } from "buffer";
import { FEATURE_KEYWORDS, IGNORED_SEGMENTS, REQUIRED_SECTIONS } from "./constants";

export function decodeBase64Content(content: string) {
  return Buffer.from(content, "base64").toString("utf8");
}

export function truncate(value: string, max = 4000) {
  return value.length > max ? `${value.slice(0, max)}\n...` : value;
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function extractMarkdownSummary(markdown: string) {
  const headingMatches = [...markdown.matchAll(/^#{1,3}\s+(.+)$/gm)];
  const sections = headingMatches.map((match) => match[1]?.trim() || "");
  const title = sections[0] || "Untitled Repository";
  const missingSections = REQUIRED_SECTIONS.filter(
    (section) =>
      !sections.some((existing) =>
        existing.toLowerCase().includes(section.toLowerCase())
      )
  );

  return {
    title,
    sections,
    strengths: sections.slice(0, 5),
    missingSections,
    summary: `Title: ${title}\nSections: ${sections.join(", ") || "None"}\nMissing: ${
      missingSections.join(", ") || "None"
    }`,
  };
}

export function shouldIgnorePath(path: string) {
  return IGNORED_SEGMENTS.some((segment) => path.includes(segment));
}

export function detectFeatureFromPath(path: string) {
  const lowered = path.toLowerCase();

  if (/auth|oauth|jwt|login|session/.test(lowered)) return "Authentication";
  if (/notification|push|notify/.test(lowered)) return "Notifications";
  if (/socket|websocket|realtime|ws/.test(lowered)) return "Realtime / Socket";
  if (/email|mail|sendgrid|resend/.test(lowered)) return "Email System";
  if (/cloudinary|upload|media|s3|storage/.test(lowered)) return "Media Uploads";
  if (/resume|cv/.test(lowered)) return "Resume Builder";
  if (/github|git/.test(lowered)) return "GitHub Integration";
  if (/portfolio/.test(lowered)) return "Portfolio";
  if (/payment|stripe|razorpay|checkout/.test(lowered)) return "Payments";
  if (/analytics|tracking/.test(lowered)) return "Analytics";
  if (/search|elasticsearch|algolia/.test(lowered)) return "Search";
  if (/cache|redis|memcached/.test(lowered)) return "Caching";
  if (/queue|bull|rabbitmq|kafka/.test(lowered)) return "Message Queue";
  if (/docker|kubernetes|k8s|deploy/.test(lowered)) return "Containerization / Deployment";
  if (/graphql|grpc/.test(lowered)) return "API (GraphQL / gRPC)";
  if (/ai|llm|openai|langchain|rag/.test(lowered)) return "AI / LLM";
  if (/i18n|locale|translation/.test(lowered)) return "Internationalization";
  if (/swagger|openapi|api-docs/.test(lowered)) return "API Documentation";
  if (/admin|dashboard/.test(lowered)) return "Admin Dashboard";
  if (/cli|terminal|command/.test(lowered)) return "CLI Tool";
  if (/mobile|android|ios/.test(lowered)) return "Mobile Support";
  if (/webhook/.test(lowered)) return "Webhooks";
  if (/pdf|report/.test(lowered)) return "PDF / Reporting";
  if (/cron|scheduler|schedule/.test(lowered)) return "Scheduled Jobs";
  if (/test|spec|e2e|cypress|jest/.test(lowered)) return "Testing";
  if (/docs|documentation/.test(lowered)) return "Documentation";
  if (/monitoring|sentry|log/.test(lowered)) return "Monitoring / Logging";
  if (/feature-flag|feature_flag|ab-test/.test(lowered)) return "Feature Flags / A/B Testing";

  return null;
}

export function summarizeSourceFile(path: string, content: string) {
  const lines = content.split("\n");
  const topLines = lines.slice(0, 120).join("\n");
  const ext = path.split(".").pop()?.toLowerCase() || "";

  const extract = (re: RegExp, idx: number) =>
    [...content.matchAll(re)].map((m) => m[idx]).filter((x): x is string => !!x);

  let exports: string[] = [];
  let imports: string[] = [];

  if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext)) {
    exports = extract(/export\s+(?:default\s+)?(function|const|class|async function)\s+([A-Za-z0-9_]+)/g, 2);
    imports = extract(/import\s+.*?from\s+["'"`]([^"'"`]+)["'"`]/g, 1);
  } else if (["py"].includes(ext)) {
    exports = extract(/^(?:async\s+)?(?:def|class)\s+([A-Za-z0-9_]+)/gm, 1);
    imports = extract(/(?:from|import)\s+([A-Za-z0-9_.]+)/g, 1);
  } else if (["go"].includes(ext)) {
    exports = extract(/^func\s+([A-Z][A-Za-z0-9_]+)/gm, 1);
    imports = extract(/"([^"]+)"/g, 1)
      .filter((m) => m.includes(".") || m.includes("/"));
  } else if (["rs"].includes(ext)) {
    exports = extract(/^pub\s+(?:fn|struct|enum|trait|type|const|mod|use)\s+([A-Za-z0-9_]+)/gm, 1);
    imports = extract(/^use\s+([A-Za-z0-9_:;{}*]+)/gm, 1);
  } else if (["java", "kt", "kts"].includes(ext)) {
    imports = extract(/^import\s+([A-Za-z0-9_.]+)/gm, 1);
  } else if (["php"].includes(ext)) {
    exports = extract(/^(?:abstract\s+)?(?:class|interface|trait|function)\s+([A-Za-z0-9_]+)/gm, 1);
    imports = extract(/(?:use|require|include)\s+([A-Za-z0-9_\\/]+)/g, 1);
  } else if (["rb"].includes(ext)) {
    exports = extract(/^(?:class|module|def)\s+([A-Za-z0-9_]+)/gm, 1);
  } else if (["ex", "exs"].includes(ext)) {
    exports = extract(/^def\s+([A-Za-z0-9_!?]+)/gm, 1);
  }

  const keywords = FEATURE_KEYWORDS.filter((keyword) =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );

  return {
    path,
    exports: exports.slice(0, 8),
    imports: imports.slice(0, 10),
    keywords,
    summary: truncate(topLines, 2200),
  };
}
