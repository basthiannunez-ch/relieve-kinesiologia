// Carrito de servicios, buscador y reserva de día y hora (agenda en /api/agenda).
(function () {
  const CAT = window.CATALOGO || [];
  const CATS = window.CATEGORIAS || {};
  const WA = typeof WHATSAPP !== "undefined" ? WHATSAPP : "56995729398";
  const byId = Object.fromEntries(CAT.map((s) => [s.id, s]));
  const clp = (n) => "$" + n.toLocaleString("es-CL");
  const norm = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const KEY = "relieve-carrito";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || "[]").filter((i) => byId[i.id] && i.qty > 0); } catch (e) { cart = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} };
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const ICON = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12.2a1 1 0 01-1 .8H7.2a1 1 0 01-1-.8z"/><path d="M9 8V6.5a3 3 0 016 0V8"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  // ---- Botones en el encabezado ----
  const top = document.querySelector(".top-in");
  if (!top) return;
  const tools = el("div", "tools");
  const bSearch = el("button", "tool-btn"); bSearch.type = "button"; bSearch.innerHTML = ICON.search; bSearch.setAttribute("aria-label", "Buscar servicios");
  const bCart = el("button", "tool-btn"); bCart.type = "button"; bCart.innerHTML = ICON.bag; bCart.setAttribute("aria-label", "Ver carrito");
  const badge = el("span", "tool-badge"); bCart.append(badge);
  tools.append(bSearch, bCart);
  top.insertBefore(tools, document.getElementById("menu-btn"));

  // ---- Paneles ----
  function panel(id, title) {
    const wrap = el("div", "sheet"); wrap.id = id; wrap.hidden = true;
    const back = el("div", "sheet-back");
    const box = el("div", "sheet-box"); box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", title);
    const head = el("div", "sheet-head"); const h = el("h2", null, title);
    const x = el("button", "tool-btn"); x.type = "button"; x.innerHTML = ICON.close; x.setAttribute("aria-label", "Cerrar");
    head.append(h, x); box.append(head); wrap.append(back, box); document.body.append(wrap);
    const close = () => { wrap.hidden = true; document.documentElement.classList.remove("sheet-open"); if (last) last.focus(); };
    back.onclick = close; x.onclick = close;
    return { wrap, box, close };
  }
  let last = null;
  const open = (p, focusEl) => { last = document.activeElement; p.wrap.hidden = false; document.documentElement.classList.add("sheet-open"); (focusEl || p.box.querySelector("button")).focus(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") [S, C, R].forEach((p) => { if (!p.wrap.hidden) p.close(); }); });

  // ---- Buscador ----
  const S = panel("buscador", "Buscar servicios");
  const input = el("input", "search-input"); input.type = "search"; input.placeholder = "Ej: masaje, espalda, facial, pies…"; input.setAttribute("aria-label", "Buscar servicios"); input.autocomplete = "off";
  const results = el("div", "search-results"); results.setAttribute("aria-live", "polite");
  S.box.append(input, results);
  function addBtn(s) {
    const b = el("button", "add-btn", "Agregar"); b.type = "button";
    b.onclick = () => { add(s.id); b.textContent = "Agregado ✓"; setTimeout(() => (b.textContent = "Agregar"), 1400); };
    return b;
  }
  function renderSearch() {
    const q = norm(input.value.trim());
    results.replaceChildren();
    if (!q) {
      results.append(el("p", "search-hint", "Escribe lo que buscas o elige un área:"));
      const chips = el("div", "search-cats");
      Object.values(CATS).forEach((c) => { const a = el("a", "search-cat", c.nombre); a.href = c.url; chips.append(a); });
      results.append(chips);
      return;
    }
    const words = q.split(/\s+/);
    const found = CAT.filter((s) => { const hay = norm([s.nombre, s.detalle, s.claves, (CATS[s.cat] || {}).nombre].join(" ")); return words.every((w) => hay.includes(w)); });
    if (!found.length) {
      results.append(el("p", "search-hint", "No encontramos ese servicio. Escríbenos por WhatsApp y te ayudamos."));
      return;
    }
    found.forEach((s) => {
      const row = el("div", "result");
      const info = el("a", "result-info"); info.href = (CATS[s.cat] || {}).url || "/";
      info.append(el("b", null, s.nombre), el("small", null, (CATS[s.cat] || {}).nombre + " · " + s.detalle));
      row.append(info, el("span", "result-price", clp(s.precio)), addBtn(s));
      results.append(row);
    });
  }
  input.addEventListener("input", renderSearch);
  bSearch.onclick = () => { renderSearch(); open(S, input); };

  // ---- Carrito ----
  const C = panel("carrito", "Tu carrito");
  const list = el("div", "cart-list");
  const foot = el("div", "cart-foot");
  C.box.append(list, foot);
  function add(id) {
    const it = cart.find((i) => i.id === id);
    if (it) it.qty++; else cart.push({ id, qty: 1 });
    save(); renderCart(); toast(byId[id].nombre + " se agregó al carrito");
  }
  function setQty(id, q) { cart = cart.map((i) => (i.id === id ? { ...i, qty: q } : i)).filter((i) => i.qty > 0); save(); renderCart(); }
  function total() { return cart.reduce((t, i) => t + byId[i.id].precio * i.qty, 0); }
  function renderCart() {
    const n = cart.reduce((t, i) => t + i.qty, 0);
    badge.textContent = n; badge.hidden = !n;
    bCart.setAttribute("aria-label", n ? "Ver carrito, " + n + " servicios" : "Ver carrito");
    list.replaceChildren(); foot.replaceChildren();
    if (!n) {
      list.append(el("p", "search-hint", "Tu carrito está vacío. Agrega servicios desde las páginas de servicios o con el buscador."));
      const b = el("button", "btn btn-main", "Buscar servicios"); b.type = "button"; b.onclick = () => { C.close(); bSearch.click(); };
      foot.append(b); return;
    }
    cart.forEach((i) => {
      const s = byId[i.id];
      const row = el("div", "cart-row");
      const info = el("div", "result-info"); info.append(el("b", null, s.nombre), el("small", null, s.detalle + " · " + clp(s.precio)));
      const qty = el("div", "qty");
      const m = el("button", null, "−"); m.type = "button"; m.setAttribute("aria-label", "Quitar uno"); m.onclick = () => setQty(i.id, i.qty - 1);
      const v = el("span", null, i.qty);
      const p = el("button", null, "+"); p.type = "button"; p.setAttribute("aria-label", "Agregar uno"); p.onclick = () => setQty(i.id, i.qty + 1);
      qty.append(m, v, p);
      row.append(info, qty, el("span", "result-price", clp(s.precio * i.qty)));
      list.append(row);
    });
    const tot = el("div", "cart-total"); tot.append(el("span", null, "Total"), el("b", null, clp(total())));
    const { bloques } = calcularBloques(cart);
    const note = el("p", "cart-note", "Tu pedido usa " + (bloques === 1 ? "1 hora" : bloques + " horas") + " de agenda (incluye 10 min de preparación por sesión). Elige día y hora y te la confirmamos por WhatsApp.");
    const bAgenda = el("button", "btn btn-main cart-send", "Elegir día y hora"); bAgenda.type = "button";
    bAgenda.onclick = () => { C.close(); abrirAgenda(); };
    const send = el("a", "btn btn-ghost cart-send", "Prefiero coordinar por WhatsApp");
    const lines = cart.map((i) => "• " + i.qty + " x " + byId[i.id].nombre + " (" + clp(byId[i.id].precio * i.qty) + ")");
    send.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hola relieve, quiero agendar estos servicios 🌿\n" + lines.join("\n") + "\nTotal: " + clp(total()) + "\n¿Qué horarios tienen disponibles?");
    send.target = "_blank"; send.rel = "noopener";
    if (pagoActivo) {
      const unidades = cart.reduce((t, i) => t + i.qty, 0);
      const pay = el("div", "pay-box");
      pay.append(el("p", "pay-title", "Paga en línea con Mercado Pago"));
      const bAbono = el("button", "btn btn-main", "Pagar abono · " + clp(10000 * unidades)); bAbono.type = "button";
      const bTotal = el("button", "btn btn-ghost", "Pagar total · " + clp(total())); bTotal.type = "button";
      const msg = el("p", "pay-msg"); msg.setAttribute("role", "status");
      const go = async (modo, b) => {
        [bAbono, bTotal].forEach((x) => (x.disabled = true)); msg.textContent = "Abriendo Mercado Pago…";
        try {
          const r = await fetch("/api/pago", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modo, items: cart }) });
          const out = await r.json().catch(() => ({}));
          if (!r.ok || !out.url) throw new Error(out.error || "No pudimos iniciar el pago.");
          location.href = out.url;
        } catch (e) { msg.textContent = e.message; [bAbono, bTotal].forEach((x) => (x.disabled = false)); }
      };
      bAbono.onclick = () => go("abono", bAbono); bTotal.onclick = () => go("total", bTotal);
      pay.append(bAbono, bTotal, el("p", "cart-note", "El abono es de $10.000 por cada servicio y reserva tu hora; el resto se paga en la consulta."), msg);
      foot.append(pay);
    }
    const clear = el("button", "link-btn", "Vaciar carrito"); clear.type = "button"; clear.onclick = () => { cart = []; save(); renderCart(); };
    foot.prepend(tot, note, bAgenda); foot.append(send, clear);
  }
  bCart.onclick = () => { renderCart(); open(C); document.querySelector(".toast")?.classList.remove("show"); };


  // ---- Agenda: elegir día y hora ----
  const R = panel("agenda", "Elige día y hora");
  const rBody = el("div", "agenda"); R.box.append(rBody);
  const pad = (n) => String(n).padStart(2, "0");
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const dow = (f) => new Date(f + "T12:00:00Z").getUTCDay();
  const fechaLarga = (f) => { const [y, m, d] = f.split("-").map(Number); return DIAS[dow(f)] + " " + d + " de " + MESES[m - 1] + " de " + y; };
  let AG = null, mes = null, dia = null, hora = null;
  const inicios = (f, n) => { const l = (AG.libres[f] || []); return l.filter((h) => { for (let k = 0; k < n; k++) if (!l.includes(h + k)) return false; return true; }); };

  async function abrirAgenda() {
    open(R); dia = null; hora = null;
    rBody.replaceChildren(el("p", "search-hint", "Cargando horas disponibles…"));
    try {
      const r = await fetch("/api/agenda");
      if (!r.ok) throw new Error();
      AG = await r.json();
      const n = calcularBloques(cart).bloques;
      const primero = Object.keys(AG.libres).sort().find((f) => inicios(f, n).length);
      mes = (primero || new Date().toISOString()).slice(0, 7);
      pintarAgenda();
    } catch (e) {
      rBody.replaceChildren(el("p", "search-hint", "No pudimos cargar la agenda. Escríbenos por WhatsApp y te ayudamos a elegir tu hora."), waLink("Hola relieve, quiero agendar una hora 🌿"));
    }
  }
  function waLink(texto, label) { const a = el("a", "btn btn-main cart-send", label || "Escribir por WhatsApp"); a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(texto); a.target = "_blank"; a.rel = "noopener"; return a; }

  function pintarAgenda() {
    const n = calcularBloques(cart).bloques;
    rBody.replaceChildren();
    if (!cart.length) { rBody.append(el("p", "search-hint", "Primero agrega servicios al carrito.")); return; }
    rBody.append(el("p", "cart-note", "Tu reserva usa " + (n === 1 ? "1 hora" : n + " horas seguidas") + ". Los días marcados tienen horas libres."));
    const [y, m] = mes.split("-").map(Number);
    const nav = el("div", "cal-nav");
    const prev = el("button", "tool-btn", "‹"); prev.type = "button"; prev.setAttribute("aria-label", "Mes anterior");
    const next = el("button", "tool-btn", "›"); next.type = "button"; next.setAttribute("aria-label", "Mes siguiente");
    const hoyMes = new Date().toISOString().slice(0, 7);
    prev.disabled = mes <= hoyMes; next.disabled = mes >= AG.fin.slice(0, 7);
    const mover = (k) => { const d = new Date(Date.UTC(y, m - 1 + k, 1)); mes = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1); dia = null; hora = null; pintarAgenda(); };
    prev.onclick = () => mover(-1); next.onclick = () => mover(1);
    nav.append(prev, el("b", null, MESES[m - 1] + " " + y), next);
    const cal = el("div", "cal");
    ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].forEach((d) => cal.append(el("span", "dow", d)));
    for (let i = 0, v = (dow(mes + "-01") + 6) % 7; i < v; i++) cal.append(el("span"));
    const nDias = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let d = 1; d <= nDias; d++) {
      const f = mes + "-" + pad(d);
      const b = el("button", "cal-day" + (f === dia ? " sel" : ""), d); b.type = "button";
      const ok = inicios(f, n).length > 0;
      b.disabled = !ok;
      b.setAttribute("aria-label", fechaLarga(f) + (ok ? "" : ", sin horas libres"));
      if (f === dia) b.setAttribute("aria-pressed", "true");
      b.onclick = () => { dia = f; hora = null; pintarAgenda(); rBody.querySelector(".cal-hours")?.scrollIntoView({ block: "nearest", behavior: "smooth" }); };
      cal.append(b);
    }
    rBody.append(nav, cal);
    if (!Object.keys(AG.libres).some((f) => f.startsWith(mes) && inicios(f, n).length)) rBody.append(el("p", "search-hint", "No quedan horas libres este mes. Prueba el mes siguiente."));
    if (!dia) return;
    rBody.append(el("p", "pay-title", fechaLarga(dia)));
    const hs = el("div", "cal-hours");
    inicios(dia, n).forEach((h) => {
      const b = el("button", "cal-hour" + (h === hora ? " sel" : ""), pad(h) + ":00 – " + pad(h + n) + ":00"); b.type = "button";
      b.setAttribute("aria-pressed", String(h === hora));
      b.onclick = () => { hora = h; pintarAgenda(); rBody.querySelector(".book-form input")?.focus(); };
      hs.append(b);
    });
    rBody.append(hs);
    if (hora == null) return;
    const form = el("form", "book-form");
    const campo = (lab, attrs) => { const l = el("label", null, lab); const i = el(attrs.tag || "input"); Object.assign(i, attrs); delete i.tag; l.append(i); return [l, i]; };
    const [lN, iN] = campo("Tu nombre", { name: "nombre", required: true, autocomplete: "name", maxLength: 60 });
    const [lT, iT] = campo("Tu WhatsApp", { name: "telefono", type: "tel", required: true, autocomplete: "tel", placeholder: "+56 9 …", maxLength: 30 });
    const [lO, iO] = campo("Algo que debamos saber (opcional)", { tag: "textarea", name: "nota", rows: 2, maxLength: 400 });
    const trampa = el("input"); trampa.name = "sitio"; trampa.tabIndex = -1; trampa.autocomplete = "off"; trampa.className = "t-trap"; trampa.setAttribute("aria-hidden", "true");
    const msg = el("p", "pay-msg"); msg.setAttribute("role", "status");
    const go = el("button", "btn btn-main cart-send", "Agendar · " + pad(hora) + ":00"); go.type = "submit";
    form.append(lN, lT, lO, trampa, el("p", "cart-note", "Al agendar, esa hora queda reservada para ti. Si avisas con 24 horas de anticipación puedes reagendar o recuperar tu pago."), go, msg);
    form.onsubmit = async (e) => {
      e.preventDefault(); go.disabled = true; msg.textContent = "Enviando…";
      try {
        const r = await fetch("/api/agenda", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart, fecha: dia, hora, nombre: iN.value, telefono: iT.value, nota: iO.value, sitio: trampa.value }) });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) {
          msg.textContent = out.error || "No pudimos guardar tu reserva.";
          go.disabled = false;
          if (r.status === 409) { const x = await fetch("/api/agenda?t=" + Date.now()).then((y) => y.json()).catch(() => null); if (x) { AG = x; hora = null; setTimeout(pintarAgenda, 1600); } }
          return;
        }
        listo(out, iN.value);
      } catch (err) { msg.textContent = "No pudimos guardar tu reserva. Intenta de nuevo o escríbenos por WhatsApp."; go.disabled = false; }
    };
    rBody.append(form);
  }

  function listo(out, nombre) {
    const lines = cart.map((i) => "• " + i.qty + " x " + byId[i.id].nombre);
    const cuando = fechaLarga(out.fecha) + " de " + out.desde + " a " + out.hasta;
    rBody.replaceChildren(
      el("p", "pay-title", "¡Listo, " + nombre.split(" ")[0] + "! Tu hora quedó agendada."),
      el("p", "cart-note", cuando + ". Esa hora ya es tuya; te escribiremos por WhatsApp con la confirmación.")
    );
    const waTxt = "Hola relieve, acabo de agendar una hora para el " + cuando + " 🌿\n" + lines.join("\n") + "\nTotal: " + clp(total()) + "\n¿Cómo hago el pago?";
    if (pagoActivo) {
      const b = el("button", "btn btn-main cart-send", "Pagar total · " + clp(total())); b.type = "button";
      const msg = el("p", "pay-msg"); msg.setAttribute("role", "status");
      b.onclick = async () => {
        b.disabled = true; msg.textContent = "Abriendo Mercado Pago…";
        try {
          const r = await fetch("/api/pago", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modo: "total", items: cart, reserva: out.id }) });
          const o = await r.json().catch(() => ({}));
          if (!r.ok || !o.url) throw new Error(o.error || "No pudimos iniciar el pago.");
          location.href = o.url;
        } catch (e) { msg.textContent = e.message; b.disabled = false; }
      };
      rBody.append(el("p", "cart-note", "Paga ahora el total en línea con Mercado Pago y tu hora queda lista."), b, msg, waLink(waTxt, "Prefiero pagar por WhatsApp"));
      rBody.lastChild.className = "btn btn-ghost cart-send";
    } else {
      rBody.append(el("p", "cart-note", "Te enviaremos los datos para pagar por WhatsApp."), waLink(waTxt, "Avisar por WhatsApp"));
    }
  }

  // ---- Aviso ----
  const t = el("div", "toast"); t.setAttribute("role", "status"); document.body.append(t);
  let tt;
  function toast(msg) {
    t.replaceChildren(el("span", null, msg));
    const v = el("button", null, "Ver carrito"); v.type = "button"; v.onclick = () => { t.classList.remove("show"); if (!S.wrap.hidden) S.close(); bCart.click(); };
    t.append(v); t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 3200);
  }

  // ---- Botón "Agregar" en las listas de precios ----
  document.querySelectorAll(".price-list li[data-id]").forEach((li) => {
    const s = byId[li.dataset.id]; if (!s) return;
    const b = addBtn(s); b.setAttribute("aria-label", "Agregar " + s.nombre + " al carrito");
    li.append(b);
  });

  // ---- Pago en línea (se activa solo cuando Mercado Pago está configurado) ----
  let pagoActivo = false;
  fetch("/api/pago", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).then((d) => { pagoActivo = Boolean(d && d.activo); renderCart(); }).catch(() => {});
  const estado = new URLSearchParams(location.search).get("pago");
  if (estado) {
    const txt = { ok: "¡Pago recibido! Te escribiremos por WhatsApp para confirmar tu hora.", pendiente: "Tu pago quedó pendiente. Te avisaremos cuando se confirme.", error: "El pago no se completó. Puedes intentarlo de nuevo o escribirnos por WhatsApp." }[estado];
    if (estado === "ok") { cart = []; save(); }
    if (txt) setTimeout(() => { t.replaceChildren(el("span", null, txt)); t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 7000); }, 400);
    history.replaceState(null, "", location.pathname + location.hash);
  }

  renderCart();
})();
