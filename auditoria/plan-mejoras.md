# Plan de mejoras y dirección creativa — Grupo Arpeco

## 1. Problemas que debe resolver el nuevo diseño

1. Que en 5 segundos quede claro **qué hace Arpeco** (diseña, fabrica y monta stands y espacios comerciales llave en mano) y **para quién**.
2. Que el portfolio deje de ser una galería muda y se lea como **evidencia**: qué se hizo, de qué tipo, para qué marca.
3. Que **pedir presupuesto** sea obvio desde cualquier página y que la consulta llegue con los datos necesarios para cotizar.
4. Que el sitio transmita el mismo **nivel de terminación** que sus obras: sin enlaces muertos, sin textos ajenos, rápido en el celular.

## 2. Público objetivo (hipótesis a validar)

| Perfil | Qué necesita saber | Qué lo convence |
|---|---|---|
| Responsable de marketing / trade de una marca que va a una feria | ¿Llegan con los plazos? ¿Resuelven todo (diseño, fabricación, gráfica, montaje)? ¿Trabajan en mi ciudad? | Stands reales de marcas comparables, proceso claro, fábrica propia, respuesta rápida |
| Agencia de eventos o BTL | ¿Pueden producir un diseño ajeno? ¿Tienen stock? | Talleres propios, capacidad, stock, mantenimiento |
| Dueño de comercio, franquicia o gastronomía | ¿Pueden diseñar y construir mi local? | Locales e interiores terminados, renders, llave en mano |
| Particular / desarrollador | ¿Hacen vivienda? | Proyectos residenciales (frente secundario) |

## 3. Propuesta de valor recomendada

> **Diseñamos, fabricamos y montamos tu stand. Con taller propio, desde 2009.**

Apoyos, todos tomados del sitio actual:
- Talleres propios de diseño, herrería, carpintería y gráfica.
- Más de 11.000 m² construidos.
- Llave en mano: gerenciamiento, dirección técnica, instalación y mantenimiento.
- Argentina y países limítrofes.

## 4. Dirección visual: "taller y plano"

La empresa vende arquitectura efímera que se fabrica en taller y se documenta en legajos constructivos. La dirección toma esos dos mundos:

- **Fotografía protagonista**, grande. Las obras son la prueba; el diseño se corre del camino.
- **Un solo gesto memorable:** en la portada, cuatro fotos de obra se recortan y ordenan con la geometría del isotipo de Arpeco (módulo alto a la izquierda, ancho arriba, cuadrado abajo, pequeño en la base). La marca se convierte en la vitrina del portfolio.
- **Módulo redondeado del logotipo** (rectángulos de esquinas suaves) en recortes de imagen y botones; el resto, sobrio y sin decoración.
- Numeración solo donde hay secuencia real: los pasos del proceso llave en mano.

Referencia justificada: los sitios de estudios de arquitectura y fabricantes de exhibición suelen usar fotografía grande y tipografía sobria; se evita expresamente la plantilla de "agencia tecnológica" (gradientes, glassmorphism, íconos 3D).

### Paleta (respeta la identidad existente)

| Rol | Color | Origen |
|---|---|---|
| Azul Arpeco (acción, enlaces) | `#005994` | Logotipo |
| Grafito (texto, fondos oscuros) | `#262626` / `#404040` | Logotipo |
| Blanco (fondo) | `#FFFFFF` | — |
| Acero galvanizado (bandas, fondos secundarios) | `#E7EAEC` | Nuevo, frío, evoca perfilería y estructura |
| Azul profundo (secciones oscuras) | `#0F2A3D` | Derivado del azul del logo |

El amarillo de los botones actuales se retira: compite con el azul de la marca y no forma parte del logotipo.

### Tipografías

Una sola familia, **Archivo** (variable), usada en dos anchos claramente distintos:
- Titulares en ancho condensado y peso alto: robusto, industrial, evoca rotulación de obra.
- Texto en ancho normal, 17–18 px, líneas de menos de 75 caracteres.
Se sirve localmente (sin bloquear el render con Google Fonts).

### Sistema de componentes

- **Botón primario:** azul, texto blanco, radio 10 px (módulo del logo). **Secundario:** contorno grafito. **WhatsApp:** verde oficial, con número visible.
- **Proyecto:** imagen con radio, nombre, tipo y estado (obra construida o render) en texto simple. Los servicios no son tarjetas iguales: se presentan como filas con foto grande alternada.
- **Formulario:** etiquetas siempre visibles, campos grandes (≥ 48 px), selección de tipo de proyecto con chips, mensajes de error en texto.
- **Navegación:** barra fija simple; CTA "Pedir presupuesto" siempre visible; menú móvil a pantalla completa.
- **Iconografía:** trazo fino lineal, mínima; se prefiere numeración y etiquetas antes que íconos.

## 5. Tono de comunicación

Directo, concreto y de oficio. Frases cortas, verbos de hacer (diseñamos, fabricamos, montamos). Sin superlativos sin respaldo ("líderes") salvo que el cliente aporte la evidencia. Se trata de **vos**, como en el sitio actual.

## 6. Nueva estructura del sitio

```
Inicio
├── Stands para ferias y eventos        (página de servicio principal)
├── Locales comerciales e interiores    (página de servicio)
├── Proyectos                           (portfolio filtrable: stands · locales · interiores · residencial)
├── Nosotros                            (historia, talleres, cifras, alcance)
└── Contacto / Pedir presupuesto        (formulario calificado + WhatsApp + datos)
```

Cambios respecto del actual: "Servicios" pasa a páginas reales; Interiores y Residencial se integran (página de locales y portfolio); "Formulario" pasa a llamarse "Contacto"; se eliminan las 25 URLs de contenido demo con redirección 301.

## 7. Fases de implementación

### Fase 1 — Correcciones urgentes (1 semana)
Sobre el WordPress actual, sin rediseño.
- Reparar el formulario y quitar el email expuesto (#1).
- Meta descriptions propias en las 5 páginas (#2).
- Eliminar contenido demo, redirecciones 301, limpiar sitemap (#3).
- Publicar WhatsApp, email y ciudad en el footer (#6).
- Comprimir y redimensionar imágenes existentes (#7 parcial).
- Eventos de conversión en GA4 (#16).

### Fase 2 — Rediseño y nuevo sitio (4 a 6 semanas)
- Nueva home, páginas de servicio, portfolio por proyectos, Nosotros y Contacto según este prototipo (#4, #5, #8, #9, #11).
- Tema liviano o sitio a medida; objetivo de laboratorio LCP < 2,5 s en móvil (#7, #12).
- SEO on‑page: H1, jerarquía, schema LocalBusiness, `alt` en todas las imágenes (#10).
- Insumos necesarios del cliente: lista de proyectos con marca, tipo, año, evento y estado; autorización para nombrar marcas; email comercial; dirección del taller; fotos en alta.

### Fase 3 — Crecimiento (continuo, opcional)
- Una ficha de caso por proyecto destacado (desafío, solución, plazos).
- Páginas por ferias principales donde participan (SEO).
- Integración del formulario con un CRM o planilla y respuesta automática.
- Medición mensual de consultas por canal.
