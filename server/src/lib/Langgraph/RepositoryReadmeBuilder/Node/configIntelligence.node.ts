import { type RepositoryReadmeState } from "../State";
import { CONFIG_FILES } from "../constants";
import { decodeBase64Content, safeJsonParse } from "../utils";

export async function configIntelligence(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const octokit = state.octokit;
  if (!octokit) return {};

  const details: Record<string, any> = {
    filesAnalyzed: [],
    framework: "",
    databases: [],
    authentication: [],
    scripts: [],
    libraries: [],
    signals: [],
  };

  const configRawContents: Record<string, string> = {};

  for (const filePath of CONFIG_FILES) {
    if (filePath === "*.csproj") continue;

    const file = await octokit
      .request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner: state.repoOwner,
        repo: state.repoName,
        path: filePath,
      })
      .catch((error: any) => {
        if (error.status === 404) return null;
        throw error;
      });

    if (!file || Array.isArray(file.data)) continue;

    const content = decodeBase64Content((file.data as any).content || "");
    details.filesAnalyzed.push(filePath);
    configRawContents[filePath] = content.length > 3000 ? content.slice(0, 3000) + "\n..." : content;

    if (filePath === "package.json") detectPackageJson(content, details);
    if (filePath === "requirements.txt") detectRequirementsTxt(content, details);
    if (filePath === "pyproject.toml" || filePath === "setup.py" || filePath === "setup.cfg") detectPythonConfig(content, details);
    if (filePath === "manage.py" || filePath === "wsgi.py" || filePath === "asgi.py") detectPythonEntrypoint(content, filePath, details);
    if (filePath === "go.mod") detectGoMod(content, details);
    if (filePath === "Cargo.toml") detectCargoToml(content, details);
    if (filePath === "pom.xml") detectPomXml(content, details);
    if (filePath === "build.gradle" || filePath === "build.gradle.kts") detectGradle(content, details);
    if (filePath === "pubspec.yaml") detectPubspec(content, details);
    if (filePath === "Gemfile") detectGemfile(content, details);
    if (filePath === "composer.json") detectComposerJson(content, details);
    if (filePath === "mix.exs") detectMixExs(content, details);
    if (filePath === "Package.swift") detectPackageSwift(content, details);
    if (filePath === "build.zig") details.signals.push("Zig");
    if (filePath === "Dockerfile") detectDockerfile(content, details);
    if (filePath === "docker-compose.yml" || filePath === "docker-compose.yaml") detectDockerCompose(content, details);
    if (filePath === "tsconfig.json") detectTsconfig(content, details);
    if (filePath.endsWith("tailwind.config.js") || filePath.endsWith("tailwind.config.ts")) details.signals.push("Tailwind CSS");
    if (filePath.endsWith("vite.config.ts") || filePath.endsWith("vite.config.js")) details.signals.push("Vite");
    if (filePath.endsWith("next.config.js") || filePath.endsWith("next.config.mjs") || filePath.endsWith("next.config.ts"))
      details.framework = details.framework || "Next.js";
    if (filePath === ".env.example") detectEnvExample(content, details);
    if (filePath === "Makefile" || filePath === "justfile") details.signals.push(filePath);
  }

  return {
    configSummary: {
      ...details,
      databases: Array.from(new Set(details.databases)),
      authentication: Array.from(new Set(details.authentication)),
      scripts: Array.from(new Set(details.scripts)),
      libraries: Array.from(new Set(details.libraries)),
      signals: Array.from(new Set(details.signals)),
    },
    configRawContents,
  };
}

function detectPackageJson(content: string, details: Record<string, any>) {
  const pkg = safeJsonParse<Record<string, any>>(content, {});
  details.scripts = Object.keys(pkg.scripts || {});
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  details.libraries = allDeps.slice(0, 40);
  const libs = allDeps.join(" ").toLowerCase();

  if (libs.includes("next")) details.framework = "Next.js";
  else if (libs.includes("nuxt")) details.framework = "Nuxt.js";
  else if (libs.includes("svelte")) details.framework = "Svelte";
  else if (libs.includes("vue")) details.framework = "Vue.js";
  else if (libs.includes("angular")) details.framework = "Angular";
  else if (libs.includes("astro")) details.framework = "Astro";
  else if (libs.includes("react")) details.framework = "React";
  else if (libs.includes("express")) details.framework = "Express";
  else if (libs.includes("nestjs")) details.framework = "NestJS";
  else if (libs.includes("fastify")) details.framework = "Fastify";
  else if (libs.includes("koa")) details.framework = "Koa";
  else if (libs.includes("hono")) details.framework = "Hono";
  else if (libs.includes("elysia")) details.framework = "Elysia";
  else if (libs.includes("electron")) details.framework = "Electron";
  else if (libs.includes("react-native")) details.framework = "React Native";
  else if (libs.includes("expo")) details.framework = "Expo";

  if (libs.includes("prisma")) details.databases.push("Prisma");
  if (libs.includes("mongoose")) details.databases.push("MongoDB / Mongoose");
  if (libs.includes("typeorm")) details.databases.push("TypeORM");
  if (libs.includes("drizzle")) details.databases.push("Drizzle ORM");
  if (libs.includes("sequelize")) details.databases.push("Sequelize");
  if (libs.includes("knex")) details.databases.push("Knex");
  if (libs.includes("redis")) details.databases.push("Redis");
  if (libs.includes("postgres") || libs.includes("pg")) details.databases.push("PostgreSQL");
  if (libs.includes("mysql")) details.databases.push("MySQL");
  if (libs.includes("sqlite")) details.databases.push("SQLite");
  if (libs.includes("mongodb")) details.databases.push("MongoDB");
  if (libs.includes("firebase")) details.databases.push("Firebase");

  if (libs.includes("firebase")) details.authentication.push("Firebase Auth");
  if (libs.includes("next-auth") || libs.includes("nextauth")) details.authentication.push("NextAuth");
  if (libs.includes("clerk")) details.authentication.push("Clerk");
  if (libs.includes("auth0")) details.authentication.push("Auth0");
  if (libs.includes("supabase")) details.authentication.push("Supabase");
  if (libs.includes("passport")) details.authentication.push("Passport");
  if (libs.includes("jose") || libs.includes("jsonwebtoken")) details.authentication.push("JWT");

  if (libs.includes("socket.io")) details.signals.push("WebSocket / Socket.io");
  if (libs.includes("cloudinary")) details.signals.push("Cloudinary Media");
  if (libs.includes("stripe")) details.signals.push("Stripe Payments");
  if (libs.includes("tailwindcss")) details.signals.push("Tailwind CSS");
  if (libs.includes("graphql")) details.signals.push("GraphQL");
  if (libs.includes("grpc")) details.signals.push("gRPC");
  if (libs.includes("bull") || libs.includes("bullmq")) details.signals.push("Queue System");
  if (libs.includes("i18next") || libs.includes("react-i18next")) details.signals.push("Internationalization");
  if (libs.includes("swagger") || libs.includes("openapi")) details.signals.push("API Documentation");
  if (libs.includes("sentry")) details.signals.push("Error Monitoring");
  if (libs.includes("langchain") || libs.includes("openai") || libs.includes("ai")) details.signals.push("AI / LLM");
  if (libs.includes("docker") || libs.includes("dockerode")) details.signals.push("Docker");
  if (libs.includes("cypress")) details.signals.push("E2E Testing");
  if (libs.includes("jest")) details.signals.push("Unit Testing");
  if (libs.includes("vitest")) details.signals.push("Testing");
  if (libs.includes("playwright")) details.signals.push("E2E Testing");
}

function detectRequirementsTxt(content: string, details: Record<string, any>) {
  details.signals.push("Python");
  const pkgs = content.toLowerCase();
  if (pkgs.includes("django")) details.framework = details.framework || "Django";
  if (pkgs.includes("flask")) details.framework = details.framework || "Flask";
  if (pkgs.includes("fastapi")) details.framework = details.framework || "FastAPI";
  if (pkgs.includes("bottle")) details.framework = details.framework || "Bottle";
  if (pkgs.includes("tornado")) details.framework = details.framework || "Tornado";
  if (pkgs.includes("sqlalchemy")) details.databases.push("SQLAlchemy");
  if (pkgs.includes("psycopg2")) details.databases.push("PostgreSQL");
  if (pkgs.includes("celery")) details.signals.push("Task Queue / Celery");
  if (pkgs.includes("pytest")) details.signals.push("Testing");
  if (pkgs.includes("httpx") || pkgs.includes("requests")) details.signals.push("HTTP Client");
}

function detectPythonConfig(content: string, details: Record<string, any>) {
  details.signals.push("Python");
  const low = content.toLowerCase();
  if (low.includes("django")) details.framework = details.framework || "Django";
  if (low.includes("flask")) details.framework = details.framework || "Flask";
  if (low.includes("fastapi")) details.framework = details.framework || "FastAPI";
  if (low.includes("poetry")) details.signals.push("Poetry");
}

function detectPythonEntrypoint(content: string, filePath: string, details: Record<string, any>) {
  details.signals.push("Python");
  const low = content.toLowerCase();
  if (low.includes("django") || filePath === "manage.py") details.framework = details.framework || "Django";
  if (low.includes("flask")) details.framework = details.framework || "Flask";
  if (low.includes("fastapi")) details.framework = details.framework || "FastAPI";
}

function detectGoMod(content: string, details: Record<string, any>) {
  details.signals.push("Go");
  const low = content.toLowerCase();
  const match = low.match(/^module\s+(\S+)/m);
  if (match) details.signals.push(`Go module: ${match[1]}`);
  if (low.includes("gin")) details.framework = details.framework || "Gin";
  if (low.includes("echo")) details.framework = details.framework || "Echo";
  if (low.includes("fiber")) details.framework = details.framework || "Fiber";
  if (low.includes("chi ")) details.framework = details.framework || "Chi";
  if (low.includes("gorilla")) details.framework = details.framework || "Gorilla Mux";
  if (low.includes("gorm")) details.databases.push("GORM");
}

function detectCargoToml(content: string, details: Record<string, any>) {
  details.signals.push("Rust");
  const low = content.toLowerCase();
  if (low.includes("axum")) details.framework = details.framework || "Axum";
  if (low.includes("actix")) details.framework = details.framework || "Actix Web";
  if (low.includes("rocket")) details.framework = details.framework || "Rocket";
  if (low.includes("tide")) details.framework = details.framework || "Tide";
  if (low.includes("diesel")) details.databases.push("Diesel ORM");
  if (low.includes("sqlx")) details.databases.push("SQLx");
  if (low.includes("serde")) details.signals.push("Serde Serialization");
  if (low.includes("tokio")) details.signals.push("Tokio Async Runtime");
  if (low.includes("tracing")) details.signals.push("Tracing / Logging");
  if (low.includes("clap")) details.signals.push("CLI (Clap)");
}

function detectPomXml(content: string, details: Record<string, any>) {
  details.signals.push("Java / Maven");
  const low = content.toLowerCase();
  if (low.includes("spring-boot") || low.includes("spring boot")) details.framework = details.framework || "Spring Boot";
  if (low.includes("quarkus")) details.framework = details.framework || "Quarkus";
  if (low.includes("micronaut")) details.framework = details.framework || "Micronaut";
  if (low.includes("hibernate")) details.databases.push("Hibernate");
  if (low.includes("mybatis")) details.databases.push("MyBatis");
  if (low.includes("junit")) details.signals.push("Testing (JUnit)");
}

function detectGradle(content: string, details: Record<string, any>) {
  details.signals.push("Java / Gradle");
  const low = content.toLowerCase();
  if (low.includes("spring")) details.framework = details.framework || "Spring Boot";
  if (low.includes("quarkus")) details.framework = details.framework || "Quarkus";
  if (low.includes("kotlin")) details.signals.push("Kotlin");
  if (low.includes("android")) details.signals.push("Android");
}

function detectPubspec(content: string, details: Record<string, any>) {
  details.signals.push("Dart / Flutter");
  const low = content.toLowerCase();
  if (low.includes("flutter")) details.framework = "Flutter";
  if (low.includes("firebase")) details.authentication.push("Firebase");
  if (low.includes("sqflite")) details.databases.push("SQLite");
  if (low.includes("hive")) details.databases.push("Hive");
  if (low.includes("riverpod") || low.includes("provider")) details.signals.push("State Management");
  if (low.includes("dio")) details.signals.push("HTTP Client (Dio)");
}

function detectGemfile(content: string, details: Record<string, any>) {
  details.signals.push("Ruby");
  const low = content.toLowerCase();
  if (low.includes("rails")) details.framework = "Ruby on Rails";
  if (low.includes("sinatra")) details.framework = details.framework || "Sinatra";
  if (low.includes("devise")) details.authentication.push("Devise");
  if (low.includes("pg")) details.databases.push("PostgreSQL");
  if (low.includes("mysql")) details.databases.push("MySQL");
  if (low.includes("sqlite")) details.databases.push("SQLite");
  if (low.includes("mongoid")) details.databases.push("MongoDB");
  if (low.includes("rspec")) details.signals.push("Testing (RSpec)");
  if (low.includes("sidekiq")) details.signals.push("Background Jobs (Sidekiq)");
}

function detectComposerJson(content: string, details: Record<string, any>) {
  details.signals.push("PHP");
  const composer = safeJsonParse<Record<string, any>>(content, {});
  const phpLibs = [
    ...Object.keys(composer.require || {}),
    ...Object.keys(composer["require-dev"] || {}),
  ];
  details.libraries = [...details.libraries, ...phpLibs].slice(0, 40);
  const low = phpLibs.join(" ").toLowerCase();
  if (low.includes("laravel")) details.framework = "Laravel";
  if (low.includes("symfony")) details.framework = details.framework || "Symfony";
  if (low.includes("codeigniter")) details.framework = details.framework || "CodeIgniter";
  if (low.includes("yii")) details.framework = details.framework || "Yii";
  if (low.includes("cakephp")) details.framework = details.framework || "CakePHP";
  if (low.includes("doctrine")) details.databases.push("Doctrine ORM");
  if (low.includes("eloquent")) details.databases.push("Eloquent ORM");
  if (low.includes("phpunit")) details.signals.push("Testing (PHPUnit)");
}

function detectMixExs(content: string, details: Record<string, any>) {
  details.signals.push("Elixir");
  const low = content.toLowerCase();
  if (low.includes("phoenix")) details.framework = "Phoenix";
  if (low.includes("ecto")) details.databases.push("Ecto ORM");
  if (low.includes("postgrex")) details.databases.push("PostgreSQL");
}

function detectPackageSwift(content: string, details: Record<string, any>) {
  details.signals.push("Swift");
  const low = content.toLowerCase();
  if (low.includes("vapor")) details.framework = "Vapor";
  if (low.includes("hummingbird")) details.framework = details.framework || "Hummingbird";
}

function detectDockerfile(content: string, details: Record<string, any>) {
  details.signals.push("Docker");
  const low = content.toLowerCase();
  if (low.includes("python")) details.signals.push("Python");
  if (low.includes("node")) details.signals.push("Node.js");
  if (low.includes("golang") || low.includes("go ")) details.signals.push("Go");
  if (low.includes("rust") || low.includes("cargo")) details.signals.push("Rust");
  if (low.includes("openjdk") || low.includes("java")) details.signals.push("Java");
  if (low.includes("ruby")) details.signals.push("Ruby");
  if (low.includes("php")) details.signals.push("PHP");
  if (low.includes("nginx")) details.signals.push("Nginx");
  if (low.includes("alpine")) details.signals.push("Alpine Linux");
}

function detectDockerCompose(content: string, details: Record<string, any>) {
  details.signals.push("Docker Compose");
  const low = content.toLowerCase();
  if (low.includes("mongo")) details.databases.push("MongoDB");
  if (low.includes("redis")) details.databases.push("Redis");
  if (low.includes("postgres")) details.databases.push("PostgreSQL");
  if (low.includes("mysql")) details.databases.push("MySQL");
  if (low.includes("nginx")) details.signals.push("Nginx");
  if (low.includes("rabbitmq")) details.signals.push("RabbitMQ");
  if (low.includes("kafka")) details.signals.push("Kafka");
  if (low.includes("elasticsearch")) details.signals.push("Elasticsearch");
}

function detectTsconfig(content: string, details: Record<string, any>) {
  const ts = safeJsonParse<Record<string, any>>(content, {});
  if (ts.compilerOptions?.paths) details.signals.push("Path aliases");
  if (ts.compilerOptions?.strict) details.signals.push("TypeScript Strict Mode");
}

function detectEnvExample(content: string, details: Record<string, any>) {
  const envKeys = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const [key] = line.split("=");
      return key?.trim().toUpperCase() || "";
    });
  if (envKeys.some((key) => key.includes("AUTH") || key.includes("TOKEN") || key.includes("SECRET"))) {
    details.authentication.push("Auth env config");
  }
  if (envKeys.some((key) => key.includes("DB") || key.includes("DATABASE") || key.includes("MONGO") || key.includes("POSTGRES"))) {
    details.databases.push("Database env config");
  }
  if (envKeys.some((key) => key.includes("REDIS"))) details.databases.push("Redis");
  if (envKeys.some((key) => key.includes("S3") || key.includes("STORAGE") || key.includes("CLOUDINARY"))) {
    details.signals.push("File Storage");
  }
}
