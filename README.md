# arpeco-web

Repositorio único de trabajo para la web de Grupo Arpeco. Incluye el sitio estático, su generador, la auditoría y la propuesta de rediseño.

Relevamiento del 9 de octubre de 2026 sobre https://grupo-arpeco.com. No se modificó el sitio real.

## Contenido

| Ruta | Qué es |
|---|---|
| `auditoria/informe-auditoria.md` | Diagnóstico con tabla priorizada de 16 hallazgos, evidencia y limitaciones |
| `auditoria/inventario-paginas.md` | Páginas, navegación, canales de contacto, URLs demo y material visual |
| `auditoria/plan-mejoras.md` | Dirección creativa, estructura nueva y fases de implementación |
| `auditoria/crawl.json` | Datos crudos del rastreo (SEO, enlaces, imágenes, formularios) |
| `auditoria/lighthouse/` | Reportes Lighthouse 12 (inicio y stands, celular y escritorio) |
| `auditoria/qa-prototipo.log` | Resultado de las 55 pruebas funcionales del prototipo |
| `prototipo/` | Sitio estático de 6 páginas (HTML, CSS, JS, fuente local, imágenes WebP) |
| `capturas/antes/` | Capturas del sitio actual, generadas por los scripts (no incluidas) |
| `capturas/despues/` | Capturas del prototipo, generadas por los scripts (no incluidas) |
| `entregables/propuesta-redisenio.pdf` | Propuesta comercial, 22 páginas A4 apaisado |
| `entregables/fuente/` | HTML e imágenes usadas para generar el PDF |
| `scripts/` | Rastreo, capturas, recortes, pruebas y generación del PDF |

## Ver el prototipo

```bash
cd prototipo
python3 -m http.server 8765
# abrir http://localhost:8765/index.html
```

Es un sitio estático. Para una vista previa, configurar `prototipo/` como directorio de publicación en un hosting estático. Todas las páginas tienen `noindex` y un aviso de "prototipo".

Para cambiar textos o proyectos, editar `prototipo/build.py` (lista `P` y bloques de cada página) y ejecutar `python3 build.py`.

## Estado antes de publicar como sitio oficial

- El formulario de contacto solo valida y muestra una confirmación local; no envía mensajes. Se necesita conectar un servicio de recepción y probarlo.
- Confirmar con Grupo Arpeco los datos y autorizaciones de la sección siguiente.
- Cuando el sitio oficial esté aprobado, retirar el aviso de prototipo y `noindex` desde `prototipo/build.py`, regenerar las páginas y revisar las seis páginas resultantes.
- No hay remoto Git configurado. Para subir este repositorio más adelante, crear `arpeco-web` en GitHub y agregarlo como `origin`.

## Regenerar capturas y PDF

Requisitos: Python 3, Playwright con Chromium (`pip install playwright && playwright install chromium`), Pillow.

```bash
# con el prototipo servido en localhost:8765
B=https://grupo-arpeco.com; L=http://localhost:8765
python3 scripts/shoot.py capturas/antes inicio=$B/ stands=$B/stands/ locales=$B/locales/ nosotros=$B/nosotros/ formulario=$B/formulario/ post-frances=$B/bijoux-etniques-femme/
python3 scripts/shoot.py capturas/despues inicio=$L/index.html stands=$L/stands.html locales=$L/locales.html proyectos=$L/proyectos.html nosotros=$L/nosotros.html contacto=$L/contacto.html
python3 scripts/secciones.py      # recortes comparables antes/después
python3 scripts/qa_prototipo.py   # pruebas funcionales
python3 scripts/informe.py        # genera entregables/propuesta-redisenio.pdf
```

Atención: si el sitio real cambia, las coordenadas de los recortes "antes" (`scripts/secciones.py`) y de los marcadores de las páginas 4 y 5 del PDF (`scripts/informe.py`) deben revisarse.

## Pendiente de confirmar con Grupo Arpeco

- Qué proyectos son obra construida y cuáles render (en el prototipo se infirió por la imagen).
- Autorización para nombrar a las marcas de los proyectos.
- Email comercial y dirección del taller (marcados "A completar" en el prototipo).
- Ubicación: solo se infiere Córdoba por la característica 351 del WhatsApp.
- Uso del número de WhatsApp: es el publicado en el botón del sitio actual.

## Imágenes

Las fotos del prototipo son las del propio sitio de Grupo Arpeco (`wp-content/uploads/2023/02/`), convertidas a WebP. Los originales descargados no se incluyen en el paquete entregable.
