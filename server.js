const express = require("express");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const port = Number(process.env.PORT) || 8080;

const publicDir = path.join(__dirname, "public");
const indexPath = path.join(publicDir, "index.html");
const answerScriptPath = path.join(__dirname, "answer.js");
const pptxPath = path.join(__dirname, "answer.pptx");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(
    indexPath,
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PPT Builder Service</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f7fb;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #475569;
      --accent: #0ea5e9;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      background: radial-gradient(circle at 20% 0%, #e0f2fe 0%, var(--bg) 45%);
      color: var(--text);
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .card {
      width: min(720px, 100%);
      background: var(--card);
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
      border: 1px solid rgba(14, 165, 233, 0.2);
    }
    h1 { margin: 0 0 12px; font-size: 1.8rem; }
    p { margin: 8px 0; color: var(--muted); line-height: 1.6; }
    .row { margin-top: 18px; display: flex; gap: 10px; flex-wrap: wrap; }
    .btn {
      display: inline-block;
      text-decoration: none;
      border-radius: 10px;
      padding: 10px 14px;
      border: 1px solid rgba(15, 23, 42, 0.12);
      color: var(--text);
      font-weight: 600;
      background: #fff;
    }
    .btn.primary {
      border-color: var(--accent);
      background: var(--accent);
      color: #fff;
    }
  </style>
</head>
<body>
  <main class="card">
    <h1>PPT Builder Service Is Running</h1>
    <p>This deployment serves a minimal web server so DigitalOcean App Platform has a valid HTTP root endpoint.</p>
    <p>If your repository includes answer.js, use the build route to generate and download answer.pptx.</p>
    <div class="row">
      <a class="btn primary" href="/build">Build PPTX</a>
      <a class="btn" href="/download">Download answer.pptx</a>
      <a class="btn" href="/health">Health Check</a>
    </div>
  </main>
</body>
</html>`,
    "utf8",
  );
}

app.use(express.static(publicDir));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "ppt-builder", port });
});

app.get("/build", (_req, res) => {
  if (!fs.existsSync(answerScriptPath)) {
    res.status(404).json({
      ok: false,
      message: "answer.js was not found in the repository root.",
    });
    return;
  }

  const child = spawn(process.execPath, [answerScriptPath], {
    cwd: __dirname,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.on("close", (code) => {
    if (code !== 0) {
      res.status(500).json({
        ok: false,
        message: "PPT build failed.",
        exitCode: code,
        stderr: stderr.slice(-4000),
      });
      return;
    }

    if (!fs.existsSync(pptxPath)) {
      res.status(500).json({
        ok: false,
        message: "Build completed but answer.pptx was not found.",
      });
      return;
    }

    res.download(pptxPath, "answer.pptx");
  });
});

app.get("/download", (_req, res) => {
  if (!fs.existsSync(pptxPath)) {
    res.status(404).json({
      ok: false,
      message: "answer.pptx not found. Run /build first.",
    });
    return;
  }

  res.download(pptxPath, "answer.pptx");
});

app.get("/", (_req, res) => {
  res.sendFile(indexPath);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
