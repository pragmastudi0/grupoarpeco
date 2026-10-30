# Grupo Arpeco — web oficial

Sitio estático de Grupo Arpeco: seis páginas en HTML, CSS y JavaScript, con imágenes y fuente locales. El código fuente y los archivos publicados están en `site/`. La auditoría y la propuesta de rediseño de octubre de 2026 permanecen en `auditoria/` y `entregables/` como documentación histórica; Vercel no los publica.

## Desplegar en Vercel

1. Importar [pragmastudi0/grupoarpeco](https://github.com/pragmastudi0/grupoarpeco) en Vercel.
2. Dejar **Root Directory** en la raíz del repositorio y elegir **Framework Preset: Other**.
3. Desplegar. `vercel.json` configura `site/` como **Output Directory**. No se necesitan variables de entorno ni comando de build.
4. Cuando el dominio esté listo, agregarlo en **Settings → Domains** del proyecto en Vercel y configurar los DNS que indique Vercel.

La página inicial se sirve en `/`. Las otras páginas usan URLs `.html` enlazadas entre sí.
Las rutas principales del sitio anterior (`/stands/`, `/locales/`, `/nosotros/`, `/formulario/`) redirigen a las páginas nuevas.

## Contacto

El formulario de presupuesto valida los datos y abre WhatsApp con un mensaje preparado para el número publicado por Grupo Arpeco (`+54 9 351 563-9656`). El visitante debe pulsar **Enviar** dentro de WhatsApp. No hay un servidor que reciba o almacene consultas, y la web no muestra una confirmación de recepción que no pueda verificar.

No se muestran email comercial ni dirección de taller porque esos datos no estaban publicados y no fueron confirmados. Las solicitudes se canalizan por WhatsApp.

## Desarrollo local

```bash
cd site
python3 -m http.server 8765
# abrir http://localhost:8765/
```

Para cambiar textos o proyectos, editar `scripts/build_site.py` y ejecutar `python3 scripts/build_site.py` desde la raíz del repositorio. Las seis páginas generadas deben incluirse en el commit. El despliegue publica esos HTML directamente.

## Archivos de referencia

- `auditoria/`: relevamiento del sitio anterior, informes Lighthouse y registro de pruebas históricas.
- `entregables/`: propuesta de rediseño y sus imágenes.
- `scripts/`: herramientas para rastreo, capturas, informe y pruebas funcionales.

Las imágenes de proyectos provienen del sitio anterior de Grupo Arpeco y se convirtieron a WebP. Los nombres de marcas y la clasificación de obras y renders se basan en ese material; conviene que Grupo Arpeco los revise antes de promocionar la web.
