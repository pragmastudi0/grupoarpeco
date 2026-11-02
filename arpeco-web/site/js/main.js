// Menú móvil
const menuBtn = document.querySelector(".menu-btn");
const nav = document.getElementById("nav");
const setMenu = (abierto) => {
  nav.classList.toggle("abierto", abierto);
  document.body.classList.toggle("menu-abierto", abierto);
  menuBtn.setAttribute("aria-expanded", abierto);
  menuBtn.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  menuBtn.querySelector("path").setAttribute("d", abierto ? "M5 5l14 14M19 5L5 19" : "M4 7h16M4 12h16M4 17h16");
};
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("abierto")));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
window.addEventListener("resize", () => { if (window.innerWidth > 960) setMenu(false); });

// Las cifras cuentan una sola vez cuando entran en pantalla.
const cifras = document.querySelectorAll("[data-count]");
const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mostrarCifra = (elemento) => {
  const final = Number(elemento.dataset.count);
  const inicio = performance.now();
  const duracion = reducirMovimiento ? 0 : 900;
  const prefijo = elemento.dataset.prefix || "";
  const sufijo = elemento.dataset.suffix || "";
  const actualizar = (ahora) => {
    const progreso = duracion ? Math.min((ahora - inicio) / duracion, 1) : 1;
    const suave = 1 - (1 - progreso) ** 3;
    const actual = Math.round(final * suave);
    elemento.textContent = `${prefijo}${actual.toLocaleString("es-AR")}${sufijo}`;
    if (progreso < 1) requestAnimationFrame(actualizar);
  };
  requestAnimationFrame(actualizar);
};
if ("IntersectionObserver" in window) {
  const observadorCifras = new IntersectionObserver((entradas, observador) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        mostrarCifra(entrada.target);
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.35 });
  cifras.forEach((cifra) => observadorCifras.observe(cifra));
} else {
  cifras.forEach(mostrarCifra);
}

const params = new URLSearchParams(location.search);

// Filtros de proyectos
const grilla = document.getElementById("grilla");
if (grilla) {
  const botones = document.querySelectorAll(".filtro");
  const conteo = document.getElementById("conteo");
  const aplicar = (f) => {
    let n = 0;
    grilla.querySelectorAll(".proyecto").forEach((p) => {
      const ver = f === "todos" || p.dataset.cat === f;
      p.hidden = !ver;
      if (ver) n++;
    });
    botones.forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === f));
    conteo.textContent = `${n} proyectos`;
  };
  botones.forEach((b) => b.addEventListener("click", () => {
    aplicar(b.dataset.f);
    history.replaceState(null, "", b.dataset.f === "todos" ? "proyectos.html" : `?f=${b.dataset.f}`);
  }));
  const inicial = params.get("f");
  aplicar([...botones].some((b) => b.dataset.f === inicial) ? inicial : "todos");
}

// El formulario prepara la consulta y abre WhatsApp; el visitante confirma el envío allí.
const form = document.getElementById("form-presupuesto");
if (form) {
  // Endpoint del CRM que registra la consulta como Oportunidad "Nueva".
  // Reemplazar por la URL pública real del CRM tras desplegarlo en Vercel.
  const CRM_ENDPOINT = "https://TU-CRM.vercel.app/api/lead-web";

  const tipo = params.get("tipo");
  const radio = [...form.querySelectorAll('input[name="tipo"]')].find((r) => r.value === tipo);
  if (radio) radio.checked = true;

  const campoEvento = form.querySelector('[data-solo="stand"]');
  const sync = () => { campoEvento.hidden = form.tipo.value !== "stand"; };
  form.querySelectorAll("input[name=tipo]").forEach((r) => r.addEventListener("change", sync));
  sync();

  const reglas = {
    nombre: (v) => v.trim().length > 1,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    tel: (v) => v.replace(/\D/g, "").length >= 8,
  };
  const validar = (id) => {
    const input = form.elements[id];
    const ok = reglas[id](input.value);
    input.closest(".campo").classList.toggle("con-error", !ok);
    input.setAttribute("aria-invalid", !ok);
    if (!ok) input.setAttribute("aria-describedby", `e-${id}`); else input.removeAttribute("aria-describedby");
    return ok;
  };
  Object.keys(reglas).forEach((id) => {
    const input = form.elements[id];
    // Clear an error as soon as the value becomes valid, so the layout is stable before the user clicks Enviar.
    input.addEventListener("input", () => {
      if (input.closest(".campo").classList.contains("con-error")) validar(id);
    });
    input.addEventListener("blur", () => { if (input.value) validar(id); });
  });

  const conf = document.getElementById("confirmacion");
  const enlaceWa = document.getElementById("abrir-whatsapp");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const malos = Object.keys(reglas).filter((id) => !validar(id));
    if (malos.length) { form.elements[malos[0]].focus(); return; }
    const valor = (id) => form.elements[id].value.trim();

    // Registrar la consulta en el CRM (sin bloquear: si el CRM falla, igual seguimos a WhatsApp).
    if (CRM_ENDPOINT && CRM_ENDPOINT.indexOf("TU-CRM") === -1) {
      const datos = {
        tipo: valor("tipo"),
        nombre: valor("nombre"),
        empresa: valor("empresa"),
        email: valor("email"),
        tel: valor("tel"),
        evento: valor("evento"),
        fecha: valor("fecha"),
        m2: valor("m2"),
        ciudad: valor("ciudad"),
        mensaje: valor("mensaje"),
        _hp: form.elements._hp ? form.elements._hp.value : "",
      };
      try {
        fetch(CRM_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(datos),
          keepalive: true,
        }).catch(() => {});
      } catch (_) { /* el CRM nunca debe romper el envío por WhatsApp */ }
    }

    const tipos = { stand: "Stand para feria", local: "Local comercial", interior: "Interiores", residencial: "Residencial" };
    const lineas = [
      "Hola, quiero solicitar un presupuesto a Grupo Arpeco.",
      `Proyecto: ${tipos[valor("tipo")]}`,
      `Nombre: ${valor("nombre")}`,
      `Email: ${valor("email")}`,
      `Teléfono: ${valor("tel")}`,
    ];
    for (const [id, etiqueta] of [["empresa", "Empresa o marca"], ["evento", "Feria o evento"], ["fecha", "Fecha estimada"], ["m2", "Superficie"], ["ciudad", "Ciudad"], ["mensaje", "Detalles"]]) {
      if (id === "evento" && valor("tipo") !== "stand") continue;
      if (valor(id)) lineas.push(`${etiqueta}: ${valor(id)}`);
    }
    const url = `https://wa.me/5493515639656?text=${encodeURIComponent(lineas.join("\n"))}`;
    enlaceWa.href = url;
    form.hidden = true;
    conf.hidden = false;
    conf.focus();
    window.open(url, "_blank", "noopener,noreferrer");
  });
  document.getElementById("otro").addEventListener("click", () => {
    conf.hidden = true;
    form.hidden = false;
    form.elements.nombre.focus();
  });
}
