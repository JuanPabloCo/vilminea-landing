Vilminea_byColqui — Guía funcional de la landing
================================================

Descripción general
- Landing enfocada en conversión: muestra productos artesanales, CTA de compra (Mercado Pago) y contacto directo por WhatsApp.
- Secciones: Hero, Navegación fija, Colección (carrusel), Sobre Nosotros, Contacto, Footer y botón flotante de WhatsApp siempre visible.

Estructura del proyecto
- `index.html` — Página principal (secciones, JSON‑LD, botón WhatsApp).
- `styles/styles.css` — Estilos (paleta, tipografía, carrusel, modal QR, About, Contacto, WhatsApp).
- `scripts/carousel.js` — Lógica del carrusel, accesibilidad, compra/QR y scroll a la colección.
- `server/` — Servidor Node.js para crear preferencias Mercado Pago (mock sin token o real con token/encriptado).

Cómo ejecutar
Opción A: Servido por Node (recomendado)
1) Terminal en `c:\Users\Usuario\Desktop\landPage\server`
2) Instalar dependencias:
```bash
npm install
```
3) Ejecutar el servidor:
```bash
node server.js
```
4) Abrir en el navegador: `http://localhost:3000`

Opción B: Servidor estático rápido (alternativa)
Terminal en `c:\Users\Usuario\Desktop\landPage` y:
```bash
python -m http.server 8000
```
Abrir `http://localhost:8000`

Secciones y funcionalidades
- Hero: titular, subtítulo y botón “Ver la Colección” con scroll suave a `#coleccion`.
- Navbar fija: anclas a `#home`, `#about`, `#services` (placeholder) y `#contacto`.
- Colección (carrusel):
  - Navegación con flechas y dots.
  - Cada slide es un `<article.slide>` con imágenes, descripción, precio y acciones.
  - Accesibilidad: `aria-live` en el viewport, `aria-selected` en dots, estado anunciado en `#carousel-status`.
  - Carga diferida de imágenes secundarias (`loading="lazy"`).
- Sobre Nosotros (`#about`): texto de marca, valores y CTA.
- Contacto (`#contacto`): tarjeta con CTA a WhatsApp.
- WhatsApp flotante: botón fijo abajo a la izquierda, siempre visible (SVG oficial de WhatsApp).
- SEO/semántica: uso de `<main>`, `<article>`, `<data>` para precios y JSON‑LD tipo `ItemList` con productos.

Pagos con Mercado Pago (modo actual simplificado)
Se usa un único link de pago directo para todos los productos:
- Añadido en cada slide como `data-mp-url="https://mpago.la/1HL6D8s"`.
- El botón “Comprar” y el QR utilizan esa misma URL.

Si en el futuro necesitas preferencias dinámicas:
1) Quita `data-mp-url` y agrega `data-create-pref="true"`.
2) Configura token en `.env`.
3) El frontend volverá a llamar a `/create-preference` sin cambiar más código.

Configurar el servidor (solo si regresas a preferencias dinámicas)
- Usa los archivos existentes (`server/server.js`, `config.js`) y añade tu token.
- Encriptado opcional soportado (`MP_ACCESS_TOKEN_ENC`, `MP_DECRYPT_KEY`).

QR de pago
- Botón “Mostrar QR” genera un código usando `https://api.qrserver.com/v1/create-qr-code/` con la URL de pago.
- Para producción: considera generarlo desde tu backend o usar soluciones oficiales.

Validaciones backend
- Rechaza `price <= 0` o `quantity <= 0` (HTTP 400).
- Limita longitud de `title` (120) y `description` (600).
- Devuelve solo campos mínimos (no toda la preferencia completa) para reducir superficie.

Extender seguridad (ideas futuras)
- Rate limiting (ej. X peticiones/minuto por IP).
- Verificación de dominio origen con cabecera personalizada.
- Reemplazar QR externo por generación propia (lib svg/png en backend).

WhatsApp (contacto directo)
- Botón flotante: en `index.html`, busca `<a class="whatsapp-float" ...>` y reemplaza el número placeholder por el tuyo.
- CTA de Contacto: en `#contacto`, el enlace también usa `wa.me` con un mensaje por defecto.
- Formato número: `códigoPais + códigoArea + número` sin “+”, sin 0, sin espacios. Ej.: Argentina (11) → `54911XXXXXXXX`.

Editar o agregar productos (slides)
Cada producto es un `<article class="slide" ...>` con atributos:
- `data-title`: nombre del producto.
- `data-price`: precio numérico (también se muestra en `<p class="price"><data ...>`).
- `data-currency`: ISO de moneda (ej. `ARS`).
- Opcional pago:
  - `data-mp-url`: enlace directo a Mercado Pago, o
  - `data-create-pref="true"`: para crear preferencia con el servidor.
Estructura mínima dentro del slide:
```html
<article class="slide" data-title="Nombre" data-price="999" data-currency="ARS" data-mp-url="https://...">
  <div class="image-pair">
    <img class="main-img" src="URL_GRANDE" alt="...">
    <img class="detail-thumb" loading="lazy" src="URL_DETALLE" alt="...">
  </div>
  <div class="product-info">
    <h3>Nombre</h3>
    <p>Descripción corta.</p>
    <p class="price"><data value="999" class="price-value">999</data> <span class="currency">ARS</span></p>
    <div class="product-actions">
      <button class="buy-button">Comprar</button>
      <button class="qr-button">Mostrar QR</button>
    </div>
  </div>
</article>
```

Archivos clave y qué hacen
- `scripts/carousel.js`
  - Desplaza las slides (translateX), crea dots, gestiona `aria-hidden`, `aria-selected` y `#carousel-status`.
  - Compra: abre `data-mp-url` o solicita crear preferencia al servidor si `data-create-pref="true"`.
  - QR: genera un PNG de QR a partir del enlace y abre el modal.
  - Cierra modal y click fuera del contenido.
  - Scroll suave al hacer clic en “Ver la Colección”.
- `styles/styles.css`
  - Paleta/Tipografía, Hero, Navbar fija, Carrusel, Acciones de producto, Modal QR, About, Contacto.
  - `.whatsapp-float` fijo abajo-izquierda con SVG; versión responsive.
  - `.price` para resaltar valores, y estilos para accesibilidad (dots con `aria-selected`).
- `index.html`
  - Estructura semántica mejorada, JSON‑LD de productos y metainformación de accesibilidad.

Personalización rápida
- Textos y títulos: editar en `index.html` (secciones Hero, About, Contacto y slides).
- Imágenes: reemplazar URLs placeholder por las tuyas.
- Colores/tipografías: variables y reglas en `styles/styles.css`.
- Números de WhatsApp: reemplazar en los 2 enlaces (`.whatsapp-float` y CTA de `#contacto`).

Pruebas rápidas (checklist)
- Carrusel: flechas y dots cambian de producto correctamente.
- Botón Comprar: abre ventana de pago con tu enlace o la preferencia creada.
- QR: se muestra y cierra correctamente.
- WhatsApp: botón flotante y CTA de Contacto abren conversación con el mensaje esperado.
- Accesibilidad: con teclado se puede navegar, dots marcan estado, lector anuncia slide actual.

Solución de problemas
- No abre pago: verifica `data-mp-url` o configuración del servidor (`/create-preference`).
- QR vacío: requiere una URL de pago válida.
- WhatsApp no abre: valida el formato `wa.me` y el número.
- CORS con servidor: usa `http://localhost:3000` servido por `server/server.js`.
- Encriptado falla: revisa formato `iv:cipher:tag` y que la clave tenga 32 caracteres exactos.

Siguientes pasos sugeridos
- Integrar Mercado Pago real en `server/` con `MP_ACCESS_TOKEN`.
- Internacionalización (textos ES/EN).
- Galería por producto y “Agregar al carrito” simple.
- Añadir rate limiting y logs estructurados.

Licencia
Este proyecto es para uso del propietario. No incluye credenciales ni enlaces de pago reales.