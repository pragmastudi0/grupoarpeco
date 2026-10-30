// Menú móvil
const menuBtn = document.querySelector(".menu-btn");
const nav = document.getElementById("nav");
menuBtn.addEventListener("click", () => {
  const abierto = nav.classList.toggle("abierto");
  menuBtn.setAttribute("aria-expanded", abierto);
  menuBtn.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});

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

// Formulario de presupuesto (demostrativo: valida, no envía)
const form = document.getElementById("form-presupuesto");
if (form) {
  const tipo = params.get("tipo");
  const radio = tipo && form.querySelector(`input[name=tipo][value="${tipo}"]`);
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
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const malos = Object.keys(reglas).filter((id) => !validar(id));
    if (malos.length) { form.elements[malos[0]].focus(); return; }
    form.hidden = true;
    conf.classList.add("visible");
    conf.focus();
  });
  document.getElementById("otro").addEventListener("click", () => {
    conf.classList.remove("visible");
    form.hidden = false;
    form.reset();
    sync();
  });
}
