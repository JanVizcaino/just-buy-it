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

---

# Documentación Técnica Frontend

---

## Parte I — Angular Masterclass

### ¿Qué es Angular?

Angular es un **framework de desarrollo web** creado y mantenido por Google. Se usa para construir **Single Page Applications (SPA)**: aplicaciones donde el navegador carga una sola página HTML y Angular se encarga de renderizar las vistas, gestionar la navegación y comunicarse con APIs, sin recargar la página.

Características clave:
- Escrito en **TypeScript** — tipado estático desde el día uno.
- Arquitectura basada en **componentes** — cada pieza de UI es un componente reutilizable.
- **Signals** (Angular 16+) para gestión de estado reactivo local.
- **Inyección de Dependencias** integrada — los servicios se comparten entre componentes de forma automática.
- **Routing** cliente — la navegación entre páginas es instantánea (no hay petición al servidor).

Este proyecto usa **Angular 21**, la versión más moderna, con standalone components por defecto.

---

### 1. Componentes — El bloque fundamental

Un **componente** es la unidad básica de Angular. Cada componente es una clase TypeScript decorada con `@Component` que combina lógica (TypeScript), vista (HTML template) y estilos (CSS/Tailwind).

```typescript
// Estructura básica de un componente
@Component({
  selector: 'app-cart-sidebar',   // etiqueta HTML personalizada
  imports: [FormsModule],          // dependencias del template
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>...</div>`,      // HTML inline
})
export class CartSidebarComponent {
  // lógica aquí
}
```

**En este proyecto**, cada página y cada widget es un componente:

| Componente | Archivo | Propósito |
|---|---|---|
| `ShopComponent` | `pages/shop/` | Página principal de la tienda |
| `CartSidebarComponent` | `components/cart-sidebar/` | Slide-over del carrito |
| `NavbarComponent` | `components/navbar/` | Barra de navegación |
| `AdminComponent` | `pages/admin/` | Panel de administración |
| `MyOrdersComponent` | `pages/my-orders/` | Historial de pedidos |

El `selector` define la etiqueta HTML con la que se usa el componente. Por ejemplo, `app-cart-sidebar` se añade en el template del componente raíz así:

```html
<app-cart-sidebar />
```

---

### 2. Templates y control de flujo

Los templates de Angular son HTML enriquecido con sintaxis especial. Angular 17 introdujo el **control de flujo nativo** (`@if`, `@for`, `@switch`) que sustituye a las directivas antiguas (`*ngIf`, `*ngFor`).

#### `@if` — Renderizado condicional

```html
<!-- En cart-sidebar: muestra el formulario solo cuando showCheckout() es true -->
@if (!showCheckout()) {
  <button (click)="showCheckout.set(true)">Finalizar Pedido</button>
} @else {
  <input [(ngModel)]="shippingAddress" />
  <button (click)="placeOrder()">Confirmar Pedido</button>
}
```

#### `@for` — Bucle de renderizado

```html
<!-- En shop.component.html: renderiza cada nodo del carrusel -->
@for (item of carouselProducts(); track item.product.id) {
  <div class="shoe-node" [class.active]="item.isActive">
    <img [src]="item.product.image_url" [alt]="item.product.name" />
  </div>
} @empty {
  <p>No hay productos</p>
}
```

El `track` es obligatorio: le indica a Angular cómo identificar cada elemento para reutilizar el DOM eficientemente en lugar de recrearlo.

#### Event binding `(evento)`

```html
<!-- Llama al método cuando se hace click -->
<button (click)="toggleCategories()">Menu</button>

<!-- Llama al método pasando un argumento -->
<div (click)="selectProduct(item.originalIndex)">...</div>
```

#### Property binding `[propiedad]`

```html
<!-- Pasa el valor de un signal a un atributo HTML -->
<span [attr.aria-label]="cartCount() + ' items en el carrito'">
  {{ cartCount() }}
</span>

<!-- Aplica la clase 'active' condicionalmente -->
<div [class.active]="item.isActive">...</div>
```

#### Two-way binding `[(ngModel)]`

```html
<!-- El input y la variable shippingAddress se sincronizan bidireccionalmente -->
<input [(ngModel)]="shippingAddress" placeholder="Dirección de envío" />
```

Cuando el usuario escribe, `shippingAddress` se actualiza. Si el código modifica `shippingAddress` (por ejemplo, via Google Maps Autocomplete), el input se actualiza en pantalla.

---

### 3. Signals — El sistema de reactividad

Los **signals** son el sistema moderno de reactividad de Angular (introducido en Angular 16). Un signal es un **contenedor de un valor** que notifica a Angular cuándo cambia para que actualice la vista automáticamente.

#### `signal()` — Estado básico

```typescript
// Declaración
protected readonly selectedIndex = signal(0);
protected readonly viewMode = signal<'image' | 'info'>('image');
protected readonly showCheckout = signal(false);

// Leer el valor — se llama como función ()
const index = this.selectedIndex();  // → 0

// Actualizar
this.selectedIndex.set(2);                          // reemplaza el valor
this.viewMode.update(v => v === 'image' ? 'info' : 'image'); // transforma el valor
```

#### `computed()` — Estado derivado

`computed()` crea un signal cuyo valor se calcula automáticamente a partir de otros signals. Se recalcula solo cuando sus dependencias cambian.

```typescript
// El producto seleccionado depende de products() y selectedIndex()
protected readonly selectedProduct = computed(
  () => this.products()[this.selectedIndex()]
);

// En CartService: el total se recalcula cada vez que cambia _items
readonly total = computed(() =>
  this._items().reduce((sum, i) => sum + i.price * i.quantity, 0)
);
```

#### `effect()` — Efectos secundarios reactivos

`effect()` ejecuta código cada vez que los signals que lee cambian. Es el equivalente reactivo de un `watch`.

```typescript
// En CartSidebarComponent: cuando el input de dirección aparece en el DOM,
// inicializa el Autocomplete de Google Maps
constructor() {
  effect(() => {
    const el = this.addressInputRef();  // signal del viewChild
    if (el) {
      this.initAutocomplete(el.nativeElement);
    }
  });
}
```

#### `viewChild()` — Referencia a elementos del DOM

```typescript
// Obtiene una referencia al elemento marcado con #addressInputRef en el template
private readonly addressInputRef =
  viewChild<ElementRef<HTMLInputElement>>('addressInputRef');
```

En el template:

```html
<input #addressInputRef type="text" ... />
```

`viewChild` devuelve un **signal** que es `undefined` cuando el elemento no está en el DOM (por ejemplo, dentro de un `@if` cerrado) y un `ElementRef` cuando sí está. El `effect()` anterior reacciona a ese cambio automáticamente.

---

### 4. Servicios e Inyección de Dependencias

Un **servicio** es una clase que encapsula lógica reutilizable: llamadas a APIs, gestión de estado compartido, etc. Los servicios son **singletons** — existe una sola instancia en toda la aplicación.

```typescript
@Injectable({ providedIn: 'root' })  // singleton global
export class CartService {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();  // expone solo lectura al exterior
  readonly count = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  addItem(item: CartItem): void { ... }
  removeItem(product_id: string, size: string): void { ... }
  clear(): void { this._items.set([]); }
}
```

**Inyección** — los componentes obtienen servicios con `inject()`:

```typescript
export class ShopComponent {
  // Angular busca la instancia singleton y la inyecta
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly auth = inject(AuthService);
}
```

Cualquier componente que inyecte `CartService` accede al **mismo carrito**, porque el servicio es un singleton. Así el `NavbarComponent` y el `CartSidebarComponent` ven el mismo estado sin necesidad de pasarse datos entre ellos.

---

### 5. Routing y Navegación

El routing de Angular mapea **URLs** a **componentes** sin recargar la página.

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '',       loadComponent: () => import('./pages/index/...') },
  { path: 'shop',   loadComponent: () => import('./pages/shop/...') },
  { path: 'orders', canActivate: [authGuard], loadComponent: () => import('./pages/my-orders/...') },
  { path: 'admin',  canActivate: [adminGuard], loadComponent: () => import('./pages/admin/...') },
  { path: '**', redirectTo: '' },  // cualquier URL no reconocida → inicio
];
```

La navegación programática se hace con el servicio `Router`:

```typescript
private readonly router = inject(Router);

// En ShopComponent: si el usuario no está logueado, redirige al login
if (!this.auth.isLoggedIn()) {
  this.router.navigate(['/login']);
}
```

---

### 6. Guards — protección de rutas

Un **guard** es una función que Angular ejecuta antes de activar una ruta. Si devuelve `false` (o una URL de redirección), la navegación se cancela.

```typescript
// Solo permite el acceso si el usuario está autenticado
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};

// Solo permite el acceso si el usuario es administrador
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAdmin() ? true : inject(Router).createUrlTree(['/']);
};
```

Si un usuario no autenticado visita `/orders`, el guard lo intercepta y lo manda a `/login` antes de que se cargue el componente.

---

### 7. Formularios

Angular ofrece dos tipos de formularios:

**Template-driven** (usado en `CartSidebarComponent` con `[(ngModel)]`): más simple, el modelo vive en el template.

```html
<input [(ngModel)]="shippingAddress" placeholder="Dirección de envío *" />
```

**Reactive Forms** (`FormGroup`, `FormControl`): más potente, el modelo vive en la clase TypeScript. Usado en login/register para validaciones complejas.

```typescript
this.form = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', [Validators.required]),
});
```

El `FormsModule` (template-driven) o `ReactiveFormsModule` se importan directamente en el componente que los necesita, sin necesidad de un módulo global.

---

### 8. ChangeDetection OnPush

Por defecto Angular verifica **todos los componentes** en cada evento (click, setTimeout, petición HTTP...). Con `OnPush`, Angular solo verifica el componente cuando:

1. Cambia un `@Input()`.
2. Un signal que lee el template emite un nuevo valor.
3. Se dispara un evento dentro del propio componente.

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,  // activado en todos los componentes
})
```

Con `OnPush` + Signals, Angular sabe exactamente qué parte del DOM cambiar. El rendimiento mejora drásticamente en aplicaciones grandes.

**Trampa importante**: los callbacks externos (Google Maps, setTimeout nativo) se ejecutan **fuera de la zona de Angular**. La solución es `NgZone.run()`:

```typescript
// El callback de Google Maps se ejecuta fuera de Angular
autocomplete.addListener('place_changed', () => {
  this.ngZone.run(() => {
    // Ahora Angular detecta el cambio y actualiza la vista
    this.shippingAddress = place.formatted_address;
  });
});
```

---

### 9. Standalone Components

Desde Angular 19 los componentes son **standalone por defecto**: se autocontienen y declaran sus propias dependencias en el array `imports`, sin necesidad de un `NgModule`.

```typescript
@Component({
  selector: 'app-shop',
  imports: [
    LucideAngularModule,  // iconos
    FormsModule,           // ngModel
  ],
  // Sin NgModule — el componente se basta a sí mismo
})
export class ShopComponent { ... }
```

La configuración global de la aplicación se hace en `app.config.ts`:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),   // activa el router
    provideHttpClient(),      // activa HttpClient para llamadas HTTP
  ],
};
```

---

### 10. Lazy Loading

El **lazy loading** significa que el código de un componente solo se descarga cuando el usuario navega a su ruta. Mejora el tiempo de carga inicial.

```typescript
// En lugar de importar directamente (eager loading):
// import { ShopComponent } from './pages/shop/shop.component';

// Se usa una función que importa dinámicamente cuando la ruta se activa:
{
  path: 'shop',
  loadComponent: () =>
    import('./pages/shop/shop.component').then(m => m.ShopComponent),
}
```

Angular divide el bundle en chunks separados. El código de `/admin` (que solo usan los administradores) no se descarga para los usuarios normales.

---

## Parte II — Análisis Completo del ShopComponent

### Visión general

`ShopComponent` es la página principal de la tienda (`/shop`). Ocupa toda la pantalla (menos la navbar) y presenta los productos en un **carrusel circular** con navegación visual.

```
ShopComponent
├── Lógica (shop.component.ts)    ← signals, servicios, métodos
├── Template (shop.component.html) ← HTML con control de flujo Angular
└── Estilos (shop.component.css)   ← animaciones y posicionamiento del carrusel
```

**Servicios inyectados:**

```typescript
private readonly productService = inject(ProductService);  // API de productos
private readonly cartService = inject(CartService);         // carrito compartido
private readonly auth = inject(AuthService);                // estado de sesión
private readonly router = inject(Router);                   // navegación programática
```

---

### Estado interno — los signals del Shop

Toda la interfaz del shop se mueve a través de estos signals:

| Signal | Tipo | Propósito |
|---|---|---|
| `products` | `Product[]` | Lista de productos cargada de la API |
| `categories` | `Category[]` | Lista de categorías para el panel de filtros |
| `selectedIndex` | `number` | Índice del producto activo en el carrusel |
| `viewMode` | `'image' \| 'info'` | Controla si el centro muestra imagen o ficha de datos |
| `selectedSize` | `string \| null` | Talla seleccionada para el producto activo |
| `showCategories` | `boolean` | Visibilidad del panel de filtros |
| `searchText` | `string` | Texto del buscador |

**Signals derivados (computed):**

```typescript
// Siempre apunta al producto en la posición selectedIndex
protected readonly selectedProduct = computed(
  () => this.products()[this.selectedIndex()]
);

// Tallas del producto seleccionado. Array vacío si no tiene tallas.
protected readonly productSizes = computed(
  () => this.selectedProduct()?.sizes ?? []
);

// Badge del botón de carrito
protected readonly cartCount = computed(() => this.cartService.count());

// Los 5 nodos visibles del carrusel
protected readonly carouselProducts = computed((): CarouselItem[] => { ... });
```

---

### Ciclo de vida — ngOnInit

`ngOnInit` es el hook que Angular llama una vez, justo después de crear el componente. Es el lugar correcto para iniciar peticiones HTTP.

```typescript
ngOnInit(): void {
  this.loadProducts();  // carga los primeros 20 productos sin filtro
  this.productService.getCategories().subscribe(c => this.categories.set(c));
}

private loadProducts(categorySlug?: string): void {
  this.productService
    .getProducts({ category: categorySlug, limit: 20 })
    .subscribe(res => {
      this.products.set(res.data);    // actualiza el signal → Angular re-renderiza
      this.selectedIndex.set(0);      // vuelve al primer producto
      this.selectedSize.set(null);    // limpia la talla seleccionada
    });
}
```

`getProducts()` retorna un `Observable` (RxJS). El `.subscribe()` ejecuta la función cuando la petición HTTP responde. En el momento en que se llama a `this.products.set(...)`, Angular detecta el cambio de signal y actualiza el carrusel, el producto central y las tallas automáticamente.

---

### La lógica del carrusel

El carrusel muestra siempre **5 nodos** centrados alrededor del producto activo. La lógica está en el computed `carouselProducts`:

```typescript
protected readonly carouselProducts = computed((): CarouselItem[] => {
  const all = this.products();
  if (all.length === 0) return [];
  const idx = this.selectedIndex();
  const count = Math.min(5, all.length);
  const halfFloor = Math.floor(count / 2); // = 2

  return Array.from({ length: count }, (_, i) => {
    const offset = i - halfFloor;  // -2, -1, 0, +1, +2
    // Módulo con corrección para negativos (JavaScript % puede devolver negativos)
    const originalIndex = ((idx + offset) % all.length + all.length) % all.length;
    return {
      product: all[originalIndex],
      originalIndex,
      isActive: originalIndex === idx,  // true solo para el nodo central
    };
  });
});
```

**Ejemplo con 10 productos, `idx=3`:**

| offset | originalIndex | isActive |
|---|---|---|
| -2 | 1 | false |
| -1 | 2 | false |
|  0 | 3 | **true** |
| +1 | 4 | false |
| +2 | 5 | false |

**Ejemplo con wrap-around, `idx=0`:**

| offset | originalIndex | isActive |
|---|---|---|
| -2 | 8 | false |
| -1 | 9 | false |
|  0 | 0 | **true** |
| +1 | 1 | false |
| +2 | 2 | false |

El carrusel es **circular**: siempre hay 5 nodos visibles independientemente del índice. Cuando el usuario hace click en un nodo:

```typescript
protected selectProduct(index: number): void {
  this.selectedIndex.set(index);  // cambia el activo
  this.viewMode.set('image');      // vuelve a vista imagen
  this.selectedSize.set(null);     // limpia la talla
}
```

El `computed` de `carouselProducts` se recalcula automáticamente, reordenando los 5 nodos visibles alrededor del nuevo índice.

---

### Panel de búsqueda y filtros

El botón de menú (esquina superior izquierda) muestra u oculta un panel flotante con buscador + categorías:

```typescript
protected toggleCategories(): void {
  this.showCategories.update(v => !v);  // invierte el booleano
}
```

**Búsqueda por texto:**

```typescript
protected onSearch(value: string): void {
  this.productService
    .getProducts({ search: value || undefined, limit: 20 })
    .subscribe(res => {
      this.products.set(res.data);
      this.selectedIndex.set(0);
      this.selectedSize.set(null);
    });
}
```

Cada vez que el usuario escribe una letra, se lanza una petición a la API con el parámetro `search`. La API filtra y devuelve los productos que coinciden. El carrusel se actualiza automáticamente.

En el template se usa `[ngModel]` / `(ngModelChange)` en lugar de `[(ngModel)]` para poder llamar a `onSearch` en cada keystroke, en vez de solo actualizar una variable:

```html
<input
  [ngModel]="searchText()"
  (ngModelChange)="onSearch($event)"
/>
```

**Filtro por categoría:**

```typescript
protected filterByCategory(slug: string | null): void {
  this.loadProducts(slug ?? undefined);  // reutiliza loadProducts con el slug
  this.showCategories.set(false);         // cierra el panel
}
```

`filterByCategory(null)` recarga todos los productos. `filterByCategory('running')` filtra solo los de esa categoría.

---

### Vista central dinámica

El centro de la pantalla muestra el producto seleccionado en dos modos controlados por el signal `viewMode`:

```html
@if (selectedProduct(); as product) {

  @if (viewMode() === 'image') {
    <!-- Modo imagen: foto grande con efecto hover scale -->
    <img [src]="product.image_url" [alt]="product.name"
         class="w-[30rem] drop-shadow-2xl transition-transform hover:scale-105" />

  } @else {
    <!-- Modo info: tarjeta con datos del producto -->
    <div class="bg-zinc-500 p-10 rounded-xl">
      <h2>{{ product.name }}</h2>
      <p>{{ product.brand }}</p>
      <p>{{ product.description }}</p>
      <p>{{ product.price.toFixed(2) }} €</p>
      <p>Stock: {{ product.stock }}</p>
    </div>
  }

} @else {
  <p>Cargando productos...</p>
}
```

El bloque `@if (selectedProduct(); as product)` es una asignación de alias: si `selectedProduct()` devuelve un valor truthy, lo asigna a la variable local `product` para usarlo dentro del bloque sin llamar al computed múltiples veces.

Los botones de toggle (ojo/info) en la esquina inferior derecha cambian el `viewMode` directamente desde el template:

```html
<button (click)="viewMode.set('image')" [attr.aria-pressed]="viewMode() === 'image'">
  <lucide-icon name="eye" />
</button>
<button (click)="viewMode.set('info')" [attr.aria-pressed]="viewMode() === 'info'">
  <lucide-icon name="info" />
</button>
```

---

### Sistema de tallas

`productSizes` es un computed que devuelve las tallas del producto activo. Si el producto tiene tallas `["38","39","40","41","42"]`, el template las renderiza como botones circulares:

```html
@if (productSizes().length > 0) {
  <div class="grid grid-cols-5 gap-2">
    @for (size of productSizes(); track size) {
      <button
        [class]="selectedSize() === size
          ? 'bg-white text-black'     <!-- talla seleccionada: blanco -->
          : 'bg-zinc-500 text-white'" <!-- talla no seleccionada: gris -->
        (click)="selectSize(size)"
        [attr.aria-pressed]="selectedSize() === size"
      >{{ size }}</button>
    }
  </div>
} @else {
  <!-- placeholder visual de 10 círculos opacos si el producto no tiene tallas -->
}
```

La lógica de selección actúa como un **toggle**: si la talla ya estaba seleccionada, la deselecciona.

```typescript
protected selectSize(size: string): void {
  this.selectedSize.set(this.selectedSize() === size ? null : size);
}
```

---

### Añadir al carrito

```typescript
protected addToCart(): void {
  // 1. Verificar autenticación
  if (!this.auth.isLoggedIn()) {
    toast.error('Inicia sesión para añadir al carrito');
    this.router.navigate(['/login']);
    return;
  }

  const product = this.selectedProduct();
  if (!product) return;

  // 2. Verificar que se haya elegido talla (si el producto tiene tallas)
  if (product.sizes && product.sizes.length > 0 && !this.selectedSize()) {
    toast.error('Selecciona una talla');
    return;
  }

  // 3. Añadir al carrito (servicio singleton compartido con toda la app)
  this.cartService.addItem({
    product_id: product.id,
    name: product.name,
    image_url: product.image_url,
    price: product.price,
    quantity: 1,
    size: this.selectedSize() ?? 'Única',
  });

  // 4. Notificación toast + abrir slide-over del carrito
  toast.success('Añadido al carrito');
  this.cartService.open();
}
```

`CartService.addItem()` gestiona la deduplicación: si el mismo producto con la misma talla ya está en el carrito, incrementa la cantidad en lugar de añadir una nueva línea:

```typescript
addItem(item: CartItem): void {
  this._items.update(items => {
    const existing = items.find(
      i => i.product_id === item.product_id && i.size === item.size
    );
    if (existing) {
      return items.map(i =>
        i.product_id === item.product_id && i.size === item.size
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    }
    return [...items, item];  // nuevo item → añade al final
  });
}
```

---

### CartSidebarComponent — el slide-over

El slide-over se renderiza condicionalmente según el signal `cart.isOpen()`, que es `true` cuando `CartService.open()` ha sido llamado (desde `addToCart()` o desde el botón de la navbar).

**Estados del slide-over:**

1. **Carrito vacío**: mensaje informativo.
2. **Carrito con items**: lista de productos (imagen, talla, cantidad, precio, botón eliminar).
3. **Checkout oculto** (`showCheckout() === false`): total + botón "Finalizar Pedido".
4. **Checkout visible** (`showCheckout() === true`): formulario de dirección + notas + botón confirmar.
5. **Procesando** (`isPlacing() === true`): botón deshabilitado mostrando "Procesando...".

**Flujo de confirmación del pedido:**

```typescript
protected placeOrder(): void {
  if (!this.shippingAddress.trim()) {
    toast.error('Introduce una dirección de envío');
    return;
  }
  this.isPlacing.set(true);
  const payload = {
    items: this.cart.items().map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      size: i.size,
    })),
    shipping_address: this.shippingAddress.trim(),
    notes: this.notes.trim() || undefined,
  };
  this.orderService.createOrder(payload).subscribe({
    next: () => {
      toast.success('Pedido realizado correctamente');
      this.cart.clear();           // vacía el carrito
      this.cart.close();           // cierra el slide-over
      this.showCheckout.set(false); // resetea el estado del formulario
      this.shippingAddress = '';
      this.notes = '';
      this.isPlacing.set(false);
    },
    error: () => {
      toast.error('Error al realizar el pedido');
      this.isPlacing.set(false);
    },
  });
}
```

---

### Integración Google Maps Places

Cuando el usuario hace click en "Finalizar Pedido", el formulario con el input `#addressInputRef` aparece en el DOM. El signal `viewChild` pasa de `undefined` a tener el `ElementRef`, y el `effect()` lo detecta y llama a `initAutocomplete`.

La integración usa la **nueva API `AutocompleteSuggestion`** (la clase `Autocomplete` quedó obsoleta para cuentas nuevas en marzo 2025):

```
Usuario click "Finalizar Pedido"
  → showCheckout.set(true)
  → @if renderiza el formulario → addressInputRef() pasa de undefined a ElementRef
  → effect() se ejecuta → initAutocomplete(inputEl)
  → google.maps.importLibrary('places') carga la librería dinámicamente
  → se crea un AutocompleteSessionToken (agrupa peticiones para facturación)
  → el input escucha el evento 'input' con debounce de 350ms
  → usuario escribe "Calle Mayor"
  → AutocompleteSuggestion.fetchAutocompleteSuggestions({ input, sessionToken, language: 'es' })
  → Google devuelve array de sugerencias de dirección
  → ngZone.run(() => suggestions.set([...]))
  → @if (suggestions().length > 0) renderiza el dropdown propio (dark theme)
  → usuario selecciona una sugerencia → selectSuggestion()
  → shippingAddress = suggestion.text; suggestions.set([])
  → se renueva el sessionToken para la próxima búsqueda
```

**Diferencias clave respecto a la API antigua:**

| Aspecto | `Autocomplete` (obsoleto) | `AutocompleteSuggestion` (actual) |
|---|---|---|
| Carga | `libraries=places` en URL | `importLibrary('places')` dinámico |
| UI | Widget nativo de Google | Dropdown propio (estilizable) |
| Facturación | Por keystroke | Por sesión (token) |
| Disponibilidad | Solo cuentas antiguas | Cuentas nuevas y antiguas |

**Por qué `NgZone.run()`:** las respuestas de `fetch` en JavaScript se ejecutan fuera del zone de Angular. Con `OnPush`, Angular no detectaría el nuevo valor del signal `suggestions` sin `ngZone.run()`. Al envolver la llamada a `suggestions.set()` dentro de `ngZone.run()`, forzamos que Angular procese el cambio y re-renderice el dropdown.

**Por qué `(mousedown)="$event.preventDefault()"` en las sugerencias:** cuando el usuario hace click en una sugerencia, el navegador dispara `blur` en el input (porque el foco se moverá al botón) antes de que el `click` registre. `preventDefault()` en `mousedown` evita que el input pierda el foco, así el `blur` no oculta el dropdown antes de que el `click` seleccione la sugerencia.

---

## Arquitectura CSS del proyecto

El proyecto separa los estilos en dos capas:

### Capa global — `src/styles.css`

Contiene todo lo que es reutilizable en cualquier página:

```css
/* Patrón de puntos — aplicado con clase .dot-pattern */
.dot-pattern {
  background-image: radial-gradient(rgba(22, 189, 202, 0.15) 1px, transparent 1px);
  background-size: 30px 30px;
}

/* Animaciones de entrada */
.fade-in        { animation: fade-in 0.5s ease-out forwards; }
.fade-in-up     { animation: fade-in-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.fade-in-scale  { animation: fade-in-scale 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.animate-pulse-slow { animation: pulse-slow 2s infinite; }

/* Scrollbar personalizado */
.custom-scrollbar { ... }
```

Todas las páginas (`IndexComponent`, `LoginComponent`, `RegisterComponent`, `MyOrdersComponent`, `AdminComponent`, `ShopComponent`) añaden la clase `dot-pattern` a su div raíz para mantener el fondo consistente.

### Capa de componente — `shop.component.css`

Solo contiene lo que es exclusivo del carrusel del shop: `.carrousel-container`, `.shoe-node`, `.img-container` y sus variantes de estado (`.active`, `:hover`, `:focus-visible`).

### Convención de colores

El color de acento del proyecto es **cyan-600** (`#16bdca`). Se usa en:
- Botones de acción principales (menú, añadir al carrito)
- Indicadores de estado activo (toggle de vista, nodo activo del carrusel)
- Focus rings (`focus-visible:ring-cyan-300`)
- Textos de categoría/marca (`text-cyan-400`)
- Sombras decorativas (`drop-shadow`, `blur`) 

---

## Configuración de Google Maps

Para activar el autocompletado de direcciones en el checkout necesitas una API key de Google Cloud:

### 1. Obtener la API key

1. Accede a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto (o usa uno existente).
3. Activa la **Places API (New)** en "APIs y Servicios" → "Biblioteca".
4. Ve a "Credenciales" → "Crear credenciales" → "Clave de API".
5. **Importante:** Restringe la clave a tu dominio (HTTP referrer) en producción.

### 2. Añadir la key en `index.html`

Abre [`jb-web/src/index.html`](jb-web/src/index.html). El script ya está añadido — solo sustituye la clave:

```html
<!-- NO incluir libraries=places — importLibrary() lo carga dinámicamente -->
<script async src="https://maps.googleapis.com/maps/api/js?key=TU_CLAVE&loading=async"></script>
```

### 3. Consideraciones de seguridad

- **Nunca** subas tu API key a un repositorio público sin restricciones de dominio.
- En producción, restringe la clave a tu dominio en Google Cloud Console.
- Para múltiples entornos, considera usar `environment.ts` y un script de reemplazo en el proceso de build.
