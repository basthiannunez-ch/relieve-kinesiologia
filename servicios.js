// Botones dentro de cada tarjeta de servicio: agregar al carrito, ver valores y agendar.
(function () {
  const CAT = window.CATALOGO || [];
  const WA = typeof WHATSAPP !== "undefined" ? WHATSAPP : "56995729398";
  const byId = Object.fromEntries(CAT.map((s) => [s.id, s]));
  const clp = (n) => "$" + n.toLocaleString("es-CL");
  const wa = (txt) => "https://wa.me/" + WA + "?text=" + encodeURIComponent(txt);
  document.querySelectorAll(".xp").forEach((card) => {
    const s = byId[card.dataset.id];
    const nombre = card.dataset.agendar || (s ? s.nombre.toLowerCase() : (card.querySelector("h3") || {}).textContent);
    const row = document.createElement("div"); row.className = "xp-actions";
    if (s) {
      const b = document.createElement("button"); b.type = "button"; b.className = "btn btn-main btn-sm";
      b.textContent = "Lo quiero · " + clp(s.precio);
      b.onclick = () => {
        const add = document.querySelector('.price-list li[data-id="' + s.id + '"] .add-btn');
        if (add) add.click();
        b.textContent = "Agregado al carrito ✓"; setTimeout(() => (b.textContent = "Lo quiero · " + clp(s.precio)), 1600);
      };
      row.append(b);
    } else if (card.dataset.valores) {
      const v = document.createElement("a"); v.className = "btn btn-main btn-sm"; v.href = card.dataset.valores; v.textContent = "Ver valores";
      row.append(v);
    }
    const ag = document.createElement("a"); ag.className = "btn btn-ghost btn-sm"; ag.target = "_blank"; ag.rel = "noopener";
    ag.href = wa("Hola relieve, quiero agendar " + nombre + " 🌿"); ag.textContent = "Agendar mi hora";
    row.append(ag);
    card.append(row);
  });
})();
