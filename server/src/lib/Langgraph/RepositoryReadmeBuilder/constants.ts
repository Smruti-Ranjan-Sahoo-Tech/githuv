export const README_PATH = "README.md";

export const CONFIG_FILES = [
  // JavaScript / TypeScript / Node
  "package.json", "bun.lockb", "pnpm-lock.yaml", "yarn.lock",
  "tsconfig.json", "jsconfig.json",
  "next.config.js", "next.config.mjs", "next.config.ts",
  "nuxt.config.js", "nuxt.config.ts",
  "vue.config.js",
  "svelte.config.js",
  "angular.json",
  "astro.config.mjs", "astro.config.ts",
  "tailwind.config.js", "tailwind.config.ts", "postcss.config.js",
  "vite.config.ts", "vite.config.js", "webpack.config.js",
  ".babelrc", "babel.config.js", ".eslintrc.js", ".prettierrc",
  // Python
  "requirements.txt", "Pipfile", "pyproject.toml", "setup.py", "setup.cfg",
  "manage.py", "app.py", "wsgi.py", "asgi.py",
  "tox.ini", "pytest.ini",
  // Go
  "go.mod", "go.sum",
  // Rust
  "Cargo.toml", "Cargo.lock",
  // Java / Kotlin / JVM
  "pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle",
  "gradlew", "mvnw",
  // Dart / Flutter
  "pubspec.yaml", "pubspec.lock",
  // Ruby
  "Gemfile", "Gemfile.lock", "Rakefile",
  // PHP
  "composer.json", "composer.lock",
  // .NET / C# (individual project files matched via folder tree)
  // Elixir
  "mix.exs",
  // Swift
  "Package.swift",
  // Deno
  "deno.json", "deno.jsonc", "deno.lock",
  // Zig
  "build.zig",
  // CMake
  "CMakeLists.txt",
  // Generic
  "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
  "Makefile", "justfile",
  ".env.example", ".env",
  "docker-entrypoint.sh",
];

export const IGNORED_SEGMENTS = [
  // JS/TS
  "node_modules", ".next", "dist", "build", "coverage",
  ".turbo", ".cache", ".parcel-cache",
  // Python
  "__pycache__", "*.pyc", "*.pyo", ".pytest_cache",
  "venv", ".venv", "env", ".env", ".tox",
  // Go
  "vendor",
  // Rust
  "target",
  // Java / JVM
  ".gradle", "gradle", "build/",
  // Dart / Flutter
  ".dart_tool", ".packages", "build/",
  // Ruby
  "vendor/bundle",
  // PHP
  "vendor",
  // Elixir
  "_build", "deps",
  // iOS / macOS
  "DerivedData",
  // Generic
  ".git", "__MACOSX", ".DS_Store",
  "public/images",
];

export const FEATURE_KEYWORDS = [
  "auth", "oauth", "jwt", "session", "login",
  "notification", "push",
  "socket", "websocket", "realtime",
  "email", "mail", "sendgrid", "resend",
  "cloudinary", "upload", "media",
  "resume", "cv",
  "github", "git",
  "portfolio",
  "payment", "stripe", "razorpay", "checkout",
  "analytics", "tracking",
  "search", "elasticsearch", "algolia",
  "cache", "redis", "memcached",
  "queue", "bull", "rabbitmq", "kafka",
  "database", "orm", "prisma", "mongoose",
  "docker", "kubernetes", "k8s",
  "ci", "cd", "github-actions", "jenkins",
  "test", "jest", "pytest", "cypress",
  "graphql", "rest", "api", "grpc",
  "monitoring", "logging", "sentry",
  "ai", "ml", "llm", "rag", "openai", "langchain",
  "i18n", "localization",
  "swagger", "openapi", "docs",
  "admin", "dashboard",
  "cli", "terminal",
  "mobile", "android", "ios",
  "webhook",
  "rss", "feed",
  "pdf", "report",
  "cron", "scheduler",
  "feature-flag", "ab-testing",
];

export const REQUIRED_SECTIONS = [
  "Overview",
  "Features",
  "Tech Stack",
  "Installation",
  "Usage",
  "Architecture",
  "Contributing",
  "License",
];
