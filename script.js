// relieve · boceto
// Cuando Javiera confirme sus datos, basta con cambiar estas dos líneas.
const WHATSAPP = "";   // ej. "56912345678" (sin + ni espacios)
const INSTAGRAM = "";  // ej. "relieve.kine" (sin @)

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
const ig = document.getElementById("ig-link");
if (INSTAGRAM) { ig.href = "https://www.instagram.com/" + INSTAGRAM + "/"; ig.target = "_blank"; ig.rel = "noopener"; ig.textContent = "@" + INSTAGRAM; }
if (WHATSAPP && INSTAGRAM) document.getElementById("pending").hidden = true;

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
    el.textContent = open ? "Abierto ahora" : sunday ? "Hoy domingo, cerrado. Escríbeme y coordinamos." : "Fuera de horario. Escríbeme y te respondo apenas pueda.";
    el.classList.toggle("open", open);
    el.hidden = false;
  } catch (e) { /* sin aviso */ }
})();

document.getElementById("year").textContent = new Date().getFullYear();
