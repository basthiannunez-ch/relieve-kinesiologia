// Clave de acceso temporal para toda la página.
// Para quitarla y dejar la página abierta: borrar este archivo (middleware.js).
const CLAVE = process.env.SITE_PASSWORD || "1234";
const COOKIE = "relieve_acceso";
const TOKEN = "ok-" + [...CLAVE].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);

export const config = { matcher: "/:path*" };

const pagina = (error) => `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>relieve · Acceso</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=Jost:wght@400;500&display=swap">
<style>
:root{--bg:#F8F4EC;--card:#FFFDF8;--ink:#2F382D;--soft:#5E6659;--verde:#4A5745;--arena:#C2A483;--line:#E2D8C6}
@media (prefers-color-scheme: dark){:root{--bg:#232A22;--card:#2B3329;--ink:#F1EBDF;--soft:#C9C2B4;--verde:#C2A483;--line:#3C4639}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--ink);font:16px/1.5 "Jost",system-ui,sans-serif}
.box{width:min(100%,380px);background:var(--card);border:1px solid var(--line);border-radius:24px;padding:36px 28px;display:grid;gap:14px;text-align:center}
.top{font-size:.72rem;letter-spacing:.3em;text-transform:uppercase;color:var(--soft)}
h1{margin:0;font:500 3rem/1 "Fraunces",Georgia,serif;color:var(--verde)}
p{margin:0;color:var(--soft)}
input{font:inherit;padding:13px 16px;border-radius:14px;border:1px solid var(--line);background:var(--bg);color:var(--ink);text-align:center;letter-spacing:.2em}
button{font:inherit;font-weight:500;padding:13px;border:0;border-radius:999px;background:var(--verde);color:var(--bg);cursor:pointer}
.err{color:#B4554A;font-weight:500;min-height:1.5em}
</style></head><body>
<form class="box" method="post">
<span class="top">Centro kinesiológico</span>
<h1>relieve</h1>
<p>La página está en construcción. Escribe la clave para entrar.</p>
<label for="clave" hidden>Clave</label>
<input id="clave" name="clave" type="password" inputmode="numeric" autocomplete="off" placeholder="Clave" autofocus required>
<button type="submit">Entrar</button>
<p class="err" role="status">${error ? "Clave incorrecta, intenta de nuevo." : ""}</p>
</form></body></html>`;

const html = (body, status) => new Response(body, {
  status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
});

export default async function middleware(request) {
  const cookies = request.headers.get("cookie") || "";
  if (cookies.split(/;\s*/).includes(COOKIE + "=" + TOKEN)) return; // ya entró: sigue normal

  if (request.method === "POST" && !new URL(request.url).pathname.startsWith("/api/")) {
    let clave = "";
    try { clave = String((await request.formData()).get("clave") || "").trim(); } catch (e) {}
    if (clave === CLAVE) {
      return new Response(null, {
        status: 303,
        headers: {
          location: new URL(request.url).pathname,
          "set-cookie": `${COOKIE}=${TOKEN}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }
    return html(pagina(true), 401);
  }
  if (new URL(request.url).pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "Acceso restringido" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  return html(pagina(false), 401);
}
