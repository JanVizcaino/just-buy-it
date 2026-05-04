# Just Buy It

E-commerce de zapatillas con panel de administración. Proyecto full-stack compuesto por una API REST en Node.js y un frontend en Angular 21.

---

## Estructura del repositorio

```
just-buy-it/
├── jb-api/          # Backend — API REST (Node.js + Express + Supabase)
└── jb-web/          # Frontend — SPA (Angular 21 + Tailwind CSS)
```

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 21, Tailwind CSS 4, Lucide Angular, ngx-sonner |
| Backend | Node.js, Express 4, Multer |
| Base de datos | Supabase (PostgreSQL) |
| Almacenamiento de imágenes | Cloudinary |
| Autenticación | Supabase Auth (JWT) |

---

## Backend — `jb-api/`

### Puesta en marcha

```bash
cd jb-api
npm install
# Copia jb-api/.env.example a jb-api/.env y rellena las variables
npm run dev   # Node --watch (recarga automática)
```

El servidor arranca en `http://localhost:3000` por defecto.

### Variables de entorno (`.env`)

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Clave de servicio (service_role) |
| `SUPABASE_JWT_SECRET` | Secret para verificar tokens JWT |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud de Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |
| `FRONTEND_URL` | URL del frontend para CORS (ej. `http://localhost:4200`) |
| `PORT` | Puerto del servidor (por defecto `3000`) |

### Endpoints de la API

Todas las rutas están bajo el prefijo `/api`.

#### Autenticación — `/api/auth`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/register` | Público | Registra un usuario nuevo |
| POST | `/login` | Público | Inicia sesión, devuelve `access_token` + `user` |
| GET | `/profile` | Auth | Devuelve el perfil del usuario autenticado |

#### Categorías — `/api/categories`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/` | Público | Lista todas las categorías |

#### Productos — `/api/products`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/` | Público | Lista productos (filtros: `search`, `category`, `page`, `limit`) |
| GET | `/:slug` | Público | Obtiene un producto por slug |
| POST | `/` | Admin | Crea un producto (multipart/form-data con `image`) |
| PUT | `/:id` | Admin | Actualiza un producto (multipart/form-data con `image` opcional) |
| DELETE | `/:id` | Admin | Elimina un producto (soft delete — `is_active = false`) |

#### Pedidos — `/api/orders`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/` | Auth | Crea un pedido con los artículos del carrito |
| GET | `/my-orders` | Auth | Devuelve los pedidos del usuario autenticado |
| GET | `/` | Admin | Devuelve todos los pedidos del sistema |
| PATCH | `/:id/status` | Admin | Actualiza el estado de un pedido |

### Cómo funciona la autenticación

El backend delega toda la autenticación en **Supabase Auth**. Al hacer login, Supabase emite un JWT firmado con `SUPABASE_JWT_SECRET`. Los middlewares `authMiddleware` y `adminMiddleware` verifican ese token en cada petición protegida. El rol del usuario (`user` / `admin`) se guarda en `raw_user_meta_data` dentro de Supabase.

### Base de datos

La base de datos es PostgreSQL gestionada por Supabase. Tablas principales:

- **categories** — catálogo de categorías de producto
- **products** — productos con stock, tallas, imagen (URL de Cloudinary) y categoría
- **orders** — cabecera del pedido (usuario, dirección, estado, total)
- **order_items** — líneas de pedido (producto, talla, cantidad, precio unitario)

Las operaciones de escritura que requieren permisos elevados (insertar/actualizar/eliminar productos, leer todos los pedidos) se ejecutan mediante funciones RPC de Supabase con `SECURITY DEFINER`, lo que evita exponer la `service_role` key directamente en las queries del cliente.

---

## Frontend — `jb-web/`

### Puesta en marcha

```bash
cd jb-web
npm install
ng serve
```

La aplicación queda disponible en `http://localhost:4200`.

### Arquitectura general

Es una **Single Page Application** (SPA) Angular con componentes standalone, carga lazy de rutas y gestión de estado mediante **signals**.

```
jb-web/src/app/
├── app.ts                          # Componente raíz
├── app.routes.ts                   # Definición de rutas
├── components/
│   ├── navbar/                     # Barra de navegación (oculta en la portada)
│   └── cart-sidebar/               # Panel lateral del carrito
├── guards/
│   ├── auth.guard.ts               # Redirige a /login si no hay sesión
│   └── admin.guard.ts              # Redirige a / si no es admin
├── pages/
│   ├── index/                      # Portada con menú contextual
│   ├── login/                      # Formulario de login
│   ├── register/                   # Formulario de registro
│   ├── shop/                       # Catálogo con carrusel y filtros
│   ├── my-orders/                  # Historial de pedidos del usuario
│   └── admin/                      # Panel de administración (tabs)
│       ├── admin-products/         # Gestión de productos (CRUD)
│       └── admin-orders/           # Gestión de pedidos (cambio de estado)
└── services/
    ├── auth.service.ts             # Sesión, login, logout, señales de rol
    ├── cart.service.ts             # Estado del carrito en memoria
    ├── product.service.ts          # Llamadas a /api/products y /api/categories
    └── order.service.ts            # Llamadas a /api/orders
```

### Rutas

| Ruta | Componente | Guarda |
|------|-----------|--------|
| `/` | `IndexComponent` | — |
| `/shop` | `ShopComponent` | — |
| `/login` | `LoginComponent` | — |
| `/register` | `RegisterComponent` | — |
| `/orders` | `MyOrdersComponent` | `authGuard` |
| `/admin` | `AdminComponent` | `adminGuard` |
| `**` | Redirige a `/` | — |

### Servicios y cómo conectan con la API

#### `AuthService`

Gestiona la sesión del usuario. Al hacer login, guarda el `access_token` y el objeto `user` en `localStorage` (claves `jbi_token` y `jbi_user`). Expone tres **computed signals** reactivos que los componentes consumen directamente:

```
isLoggedIn → true si hay usuario en memoria
isAdmin    → true si role === 'admin'
isUser     → true si role === 'user'
```

Al hacer logout limpia el localStorage, vacía el carrito y navega a `/`.

#### `CartService`

Estado en memoria (signals). No persiste entre recargas de página. Almacena un array de `CartItem` con `product_id`, `name`, `image_url`, `price`, `quantity` y `size`. Expone `count` y `total` como computed signals. El sidebar del carrito se abre/cierra con `isOpen` (signal writable).

El carrito se vacía automáticamente al cerrar sesión (`AuthService.logout()` llama a `CartService.clear()`).

#### `ProductService`

Llamadas HTTP a `/api/products` y `/api/categories`. Las operaciones de escritura (crear, editar, eliminar) incluyen el token Bearer en la cabecera `Authorization` y envían los datos como `FormData` para soportar subida de imagen.

#### `OrderService`

Incluye el token Bearer en todas las peticiones. Llama a:

- `POST /api/orders` — crear pedido desde el carrito
- `GET /api/orders/my-orders` — pedidos del usuario
- `GET /api/orders` — todos los pedidos (admin)
- `PATCH /api/orders/:id/status` — cambiar estado (admin)

### Flujo completo de un pedido

1. El usuario navega a `/shop` y selecciona talla para un producto.
2. Pulsa **Añadir al carrito** → `CartService.addItem()` añade (o incrementa) el artículo en memoria.
3. Abre el carrito lateral → ve el resumen y el total.
4. Pulsa **Finalizar Pedido** → aparece el campo de dirección de envío.
5. Pulsa **Confirmar Pedido** → `CartSidebarComponent` llama a `OrderService.createOrder()`.
6. El servicio hace `POST /api/orders` con el token del usuario en la cabecera y el payload:
   ```json
   {
     "items": [{ "product_id": "...", "quantity": 1, "size": "42" }],
     "shipping_address": "Calle Mayor 1, Barcelona",
     "notes": ""
   }
   ```
7. La API crea el pedido en Supabase, calcula el total y devuelve el objeto `order`.
8. El frontend muestra un toast de éxito, vacía el carrito y cierra el sidebar.

### Gestión de imágenes

Los productos llevan una imagen almacenada en **Cloudinary**. El flujo es:

1. El admin sube un archivo desde el formulario del panel `/admin`.
2. El frontend envía `FormData` con el campo `image` a `PUT /api/products/:id` (o `POST`).
3. El backend recibe el archivo con **Multer** (en memoria) y lo sube a Cloudinary.
4. Cloudinary devuelve una URL pública que se guarda en `products.image_url`.
5. El frontend usa esa URL directamente en las etiquetas `<img>`.

### Navbar y portada

El **navbar** no se muestra en la portada (`/`). El componente raíz (`App`) escucha los eventos de navegación del `Router` y oculta el navbar cuando la URL es exactamente `/`.

La **portada** actúa como menú contextual:

- Sin sesión → `shop`, `login`, `register`
- Usuario autenticado → `shop`, `mis pedidos`, `salir`
- Admin → `shop`, `admin`, `salir`

### Panel de administración

La ruta `/admin` está protegida por `adminGuard`. Renderiza `AdminComponent`, que contiene dos **tabs**:

- **Productos** → `AdminProductsComponent`: grid de productos con modal de creación/edición y confirmación de borrado.
- **Pedidos** → `AdminOrdersComponent`: lista de todos los pedidos del sistema con selector de estado inline.

---

## Usuarios de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| user@test.com | 123456 | user |
| admin@test.com | 123456 | admin |
