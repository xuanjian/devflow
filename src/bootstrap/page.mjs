export function renderBootstrapPage({ checks = [] } = {}) {
  const rows = checks.map((check) => `
    <li class="check check-${escapeHtml(check.status)}">
      <span>
        <strong>${escapeHtml(check.title)}</strong>
        <small>${escapeHtml(check.area)} · ${escapeHtml(check.status)}</small>
        <em>${escapeHtml(check.message)}</em>
      </span>
      ${check.actionId ? `<button data-action="${escapeHtml(check.actionId)}">Fix</button>` : ""}
    </li>
  `).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Context Studio Initialization</title>
    <style>
      :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; background: #f6f7f9; color: #1f2933; }
      main { max-width: 980px; margin: 0 auto; padding: 40px 24px; }
      h1 { margin: 0 0 8px; font-size: 32px; letter-spacing: 0; }
      .subtitle { margin: 0 0 28px; color: #667085; }
      .panel { background: #fff; border: 1px solid #d9dee7; border-radius: 8px; overflow: hidden; }
      .panel-header { padding: 18px 20px; border-bottom: 1px solid #e7eaf0; display: flex; justify-content: space-between; align-items: center; }
      .checks { list-style: none; margin: 0; padding: 0; }
      .check { padding: 16px 20px; border-bottom: 1px solid #eef1f5; display: flex; gap: 16px; justify-content: space-between; align-items: center; }
      .check:last-child { border-bottom: 0; }
      .check strong, .check small, .check em { display: block; font-style: normal; }
      .check small { margin-top: 4px; color: #7b8794; }
      .check em { margin-top: 6px; color: #52606d; }
      .check-pass { border-left: 4px solid #2f9e44; }
      .check-warning { border-left: 4px solid #f08c00; }
      .check-fail { border-left: 4px solid #d64545; }
      button { border: 1px solid #1f2933; background: #1f2933; color: white; border-radius: 6px; padding: 8px 12px; cursor: pointer; }
      pre { white-space: pre-wrap; background: #111827; color: #e5e7eb; padding: 12px; border-radius: 8px; display: none; }
    </style>
  </head>
  <body>
    <main>
      <h1>Context Studio</h1>
      <p class="subtitle">Initialization checks for the local ai-context panel.</p>
      <section class="panel">
        <div class="panel-header">
          <h2>Initialization</h2>
          <button id="refresh">Refresh</button>
        </div>
        <ul class="checks">${rows}</ul>
      </section>
      <pre id="output"></pre>
    </main>
    <script>
      const output = document.querySelector("#output");
      document.querySelector("#refresh").addEventListener("click", () => location.reload());
      document.addEventListener("click", async (event) => {
        const actionId = event.target?.dataset?.action;
        if (!actionId) return;
        output.style.display = "block";
        output.textContent = "Running " + actionId + "...";
        const response = await fetch("/api/actions/" + encodeURIComponent(actionId), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}"
        });
        output.textContent = JSON.stringify(await response.json(), null, 2);
      });
    </script>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
