// relieve · Centro kinesiológico
// Cuando Javiera confirme sus datos, basta con cambiar estas dos líneas.
const WHATSAPP = "56995729398";   // ej. "56912345678" (sin + ni espacios)
const INSTAGRAM = "kinejavimiranda";  // ej. "kinejavimiranda" (sin @)

document.documentElement.classList.add("js");

// Menú del celular
const btn = document.getElementById("menu-btn");
const menu = document.getElementById("menu");
btn.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", String(open));
});
menu.addEventListener("click", (e) => {
  if (e.target.closest("a")) { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
});

// Botones de WhatsApp con mensaje ya escrito
document.querySelectorAll("[data-wa]").forEach((a) => {
  if (!WHATSAPP) return;
  a.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(a.dataset.wa);
  a.target = "_blank"; a.rel = "noopener";
});
document.querySelectorAll(".ig-foot").forEach((a) => { if (INSTAGRAM) { a.href = "https://www.instagram.com/" + INSTAGRAM + "/"; a.target = "_blank"; a.rel = "noopener"; } });
const ig = document.getElementById("ig-link");
if (INSTAGRAM && ig) { ig.href = "https://www.instagram.com/" + INSTAGRAM + "/"; ig.target = "_blank"; ig.rel = "noopener"; }

// "Abierto ahora" según la hora de Chile
(function () {
  const el = document.getElementById("today");
  try {
    const parts = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value || "";
    const day = get("weekday").toLowerCase();
    const mins = parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10);
    const sunday = day.startsWith("dom");
    const open = !sunday && ((mins >= 540 && mins < 720) || (mins >= 1020 && mins < 1200));
    el.textContent = open ? "Abierto ahora" : sunday ? "Hoy domingo, cerrado. Escríbenos y coordinamos." : "Fuera de horario. Escríbenos y te respondemos apenas podamos.";
    el.classList.toggle("open", open);
    el.hidden = false;
  } catch (e) { /* sin aviso */ }
})();

// Testimonios
(function () {
  const list = document.getElementById("t-list");
  const empty = document.getElementById("t-empty");
  const form = document.getElementById("t-form");
  const msg = document.getElementById("t-msg");
  if (!list || !form) return;
  const fmt = (d) => { try { return new Date(d).toLocaleDateString("es-CL", { month: "long", year: "numeric" }); } catch (e) { return ""; } };
  fetch("/api/testimonios", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : []))
    .then((items) => {
      if (!Array.isArray(items) || !items.length) return;
      empty.hidden = true;
      items.forEach((t) => {
        const fig = document.createElement("figure"); fig.className = "t-card";
        const q = document.createElement("blockquote"); q.textContent = "“" + t.texto + "”";
        const cap = document.createElement("figcaption");
        const b = document.createElement("b"); b.textContent = t.nombre;
        cap.append(b, document.createTextNode([t.servicio, fmt(t.fecha)].filter(Boolean).map((x) => " · " + x).join("")));
        fig.append(q, cap); list.append(fig);
      });
    })
    .catch(() => {});
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    msg.className = "t-msg";
    if ((data.nombre || "").trim().length < 2 || (data.texto || "").trim().length < 10) {
      msg.textContent = "Escribe tu nombre y un testimonio de al menos 10 letras."; msg.classList.add("err"); return;
    }
    const btn = form.querySelector("button"); btn.disabled = true; msg.textContent = "Enviando…";
    try {
      const r = await fetch("/api/testimonios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const out = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(out.error || "No se pudo enviar.");
      form.reset(); msg.textContent = "¡Gracias! Tu testimonio se publicará cuando lo revisemos.";
    } catch (err) {
      msg.textContent = err.message || "No se pudo enviar. Intenta de nuevo."; msg.classList.add("err");
    } finally { btn.disabled = false; }
  });
})();

document.getElementById("year").textContent = new Date().getFullYear();

// Globo "¿Necesitas ayuda?" junto al botón de WhatsApp
(function () {
  const wa = document.querySelector(".wa-float");
  if (!wa) return;
  try { if (sessionStorage.getItem("wa-globo-cerrado")) return; } catch (e) {}
  const g = document.createElement("div");
  g.className = "wa-bubble";
  const a = document.createElement("a");
  a.href = wa.href; a.target = "_blank"; a.rel = "noopener";
  a.innerHTML = "<span>¿Necesitas ayuda?</span><b>Chatea con nosotros</b>";
  const x = document.createElement("button");
  x.type = "button"; x.setAttribute("aria-label", "Cerrar aviso"); x.textContent = "×";
  x.onclick = () => { g.remove(); try { sessionStorage.setItem("wa-globo-cerrado", "1"); } catch (e) {} };
  g.append(a, x);
  document.body.append(g);
  setTimeout(() => g.classList.add("show"), 1500);
})();
