import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductService, Product, Category } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { toast } from 'ngx-sonner';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-angular';

@Component({
  selector: 'app-admin-products',
  imports: [ReactiveFormsModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Plus, Pencil, Trash2, X }),
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-black text-white">
      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-2xl font-bold">Gestión de Productos</h1>
          <button
            (click)="openCreateForm()"
            class="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
          >
            <lucide-icon name="plus" [size]="18" aria-hidden="true" />
            Nuevo Producto
          </button>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-20">
            <p class="text-zinc-400 animate-pulse">Cargando productos...</p>
          </div>
        } @else if (products().length === 0) {
          <p class="text-zinc-400 text-center py-20">No hay productos. Crea el primero.</p>
        } @else {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (product of products(); track product.id) {
              <div class="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                <div class="aspect-square bg-zinc-800 overflow-hidden">
                  @if (product.image_url) {
                    <img
                      [src]="product.image_url"
                      [alt]="product.name"
                      class="w-full h-full object-cover"
                    />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                      Sin imagen
                    </div>
                  }
                </div>
                <div class="p-3">
                  <p class="text-white font-medium text-sm truncate">{{ product.name }}</p>
                  <p class="text-zinc-500 text-xs">{{ product.brand }}</p>
                  <p class="text-white font-bold text-sm mt-1">{{ product.price.toFixed(2) }}€</p>
                  <p class="text-zinc-600 text-xs mt-0.5">Stock: {{ product.stock }}</p>
                  <div class="flex gap-2 mt-3">
                    <button
                      (click)="openEditForm(product)"
                      class="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 rounded-lg text-xs transition-colors"
                      [attr.aria-label]="'Editar ' + product.name"
                    >
                      <lucide-icon name="pencil" [size]="12" aria-hidden="true" />
                      Editar
                    </button>
                    <button
                      (click)="confirmDelete(product)"
                      class="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-300 py-1.5 rounded-lg text-xs transition-colors"
                      [attr.aria-label]="'Eliminar ' + product.name"
                    >
                      <lucide-icon name="trash-2" [size]="12" aria-hidden="true" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Product Form Modal -->
      @if (showForm()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="editingProduct() ? 'Editar producto' : 'Crear producto'"
        >
          <div
            class="absolute inset-0 bg-black/80"
            (click)="closeForm()"
            aria-hidden="true"
          ></div>
          <div class="relative w-full max-w-lg bg-zinc-900 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div class="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 class="text-white text-lg font-semibold">
                {{ editingProduct() ? 'Editar Producto' : 'Nuevo Producto' }}
              </h2>
              <button
                (click)="closeForm()"
                class="text-zinc-400 hover:text-white transition-colors"
                aria-label="Cerrar formulario"
              >
                <lucide-icon name="x" [size]="20" aria-hidden="true" />
              </button>
            </div>

            <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
              <div>
                <label for="p-name" class="block text-zinc-300 text-sm mb-1">Nombre *</label>
                <input
                  id="p-name"
                  type="text"
                  formControlName="name"
                  class="w-full bg-zinc-800 text-white placeholder-zinc-500 px-3 py-2.5 rounded-xl border border-zinc-700 focus:border-zinc-500 focus:outline-none text-sm"
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <label for="p-brand" class="block text-zinc-300 text-sm mb-1">Marca</label>
                <input
                  id="p-brand"
                  type="text"
                  formControlName="brand"
                  class="w-full bg-zinc-800 text-white placeholder-zinc-500 px-3 py-2.5 rounded-xl border border-zinc-700 focus:border-zinc-500 focus:outline-none text-sm"
                  placeholder="Nike, Adidas, Puma..."
                />
              </div>

              <div>
                <label for="p-category" class="block text-zinc-300 text-sm mb-1">Categoría *</label>
                <select
                  id="p-category"
                  formControlName="category_id"
                  class="w-full bg-zinc-800 text-white px-3 py-2.5 rounded-xl border border-zinc-700 focus:border-zinc-500 focus:outline-none text-sm"
                >
                  <option value="">Selecciona categoría</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="p-price" class="block text-zinc-300 text-sm mb-1">Precio (€) *</label>
                  <input
                    id="p-price"
                    type="number"
                    formControlName="price"
                    min="0"
                    step="0.01"
                    class="w-full bg-zinc-800 text-white placeholder-zinc-500 px-3 py-2.5 rounded-xl border border-zinc-700 focus:border-zinc-500 focus:outline-none text-sm"
                    placeholder="99.99"
                  />
                </div>
                <div>
                  <label for="p-stock" class="block text-zinc-300 text-sm mb-1">Stock *</label>
                  <input
                    id="p-stock"
                    type="number"
                    formControlName="stock"
                    min="0"
                    class="w-full bg-zinc-800 text-white placeholder-zinc-500 px-3 py-2.5 rounded-xl border border-zinc-700 focus:border-zinc-500 focus:outline-none text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label for="p-sizes" class="block text-zinc-300 text-sm mb-1">
                  Tallas (separadas por comas)
                </label>
                <input
                  id="p-sizes"
                  type="text"
                  formControlName="sizes"
                  class="w-full bg-zinc-800 text-white placeholder-zinc-500 px-3 py-2.5 rounded-xl border border-zinc-700 focus:border-zinc-500 focus:outline-none text-sm"
                  placeholder="37,38,39,40,41,42,43,44"
                />
              </div>

              <div>
                <label for="p-description" class="block text-zinc-300 text-sm mb-1">
                  Descripción
                </label>
                <textarea
                  id="p-description"
                  formControlName="description"
                  rows="3"
                  class="w-full bg-zinc-800 text-white placeholder-zinc-500 px-3 py-2.5 rounded-xl border border-zinc-700 focus:border-zinc-500 focus:outline-none text-sm resize-none"
                  placeholder="Descripción del producto..."
                ></textarea>
              </div>

              <div>
                <label for="p-image" class="block text-zinc-300 text-sm mb-1">
                  Imagen {{ editingProduct() ? '(opcional — reemplaza la actual)' : '' }}
                </label>
                <input
                  id="p-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  (change)="onFileChange($event)"
                  class="w-full text-zinc-400 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-white file:text-sm hover:file:bg-zinc-600 file:cursor-pointer"
                />
              </div>

              @if (formError()) {
                <p class="text-red-400 text-sm" role="alert">{{ formError() }}</p>
              }

              <button
                type="submit"
                [disabled]="productForm.invalid || submitting()"
                class="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (submitting()) {
                  Guardando...
                } @else {
                  {{ editingProduct() ? 'Guardar Cambios' : 'Crear Producto' }}
                }
              </button>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirm Modal -->
      @if (deletingProduct()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación"
        >
          <div class="absolute inset-0 bg-black/80" aria-hidden="true"></div>
          <div class="relative bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-zinc-800 text-center">
            <h2 class="text-white font-semibold text-lg mb-2">¿Eliminar producto?</h2>
            <p class="text-zinc-400 text-sm mb-6">
              "<strong>{{ deletingProduct()!.name }}</strong>" se eliminará del catálogo de forma permanente.
            </p>
            <div class="flex gap-3">
              <button
                (click)="deletingProduct.set(null)"
                class="flex-1 bg-zinc-800 text-zinc-300 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors"
              >Cancelar</button>
              <button
                (click)="doDelete()"
                [disabled]="submitting()"
                class="flex-1 bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                @if (submitting()) { Eliminando... } @else { Eliminar }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly showForm = signal(false);
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly deletingProduct = signal<Product | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal('');

  private selectedFile: File | null = null;

  protected readonly productForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    brand: [''],
    category_id: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    sizes: [''],
    description: [''],
  });

  ngOnInit(): void {
    this.productService.getCategories().subscribe((cats) => this.categories.set(cats));
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts({ limit: 100 }).subscribe((res) => {
      this.products.set(res.data);
      this.loading.set(false);
    });
  }

  protected openCreateForm(): void {
    this.editingProduct.set(null);
    this.selectedFile = null;
    this.formError.set('');
    this.productForm.reset({ stock: 0, price: 0 });
    this.showForm.set(true);
  }

  protected openEditForm(product: Product): void {
    this.editingProduct.set(product);
    this.selectedFile = null;
    this.formError.set('');
    this.productForm.patchValue({
      name: product.name,
      brand: product.brand ?? '',
      category_id: product.category_id,
      price: product.price,
      stock: product.stock,
      sizes: product.sizes?.join(',') ?? '',
      description: product.description ?? '',
    });
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  protected confirmDelete(product: Product): void {
    this.deletingProduct.set(product);
  }

  protected doDelete(): void {
    const product = this.deletingProduct();
    if (!product) return;
    this.submitting.set(true);
    this.productService.deleteProduct(product.id, this.auth.getToken()!).subscribe({
      next: () => {
        toast.success('Producto eliminado correctamente');
        this.deletingProduct.set(null);
        this.submitting.set(false);
        this.loadProducts();
      },
      error: () => {
        toast.error('Error al eliminar el producto');
        this.submitting.set(false);
      },
    });
  }

  protected onSubmit(): void {
    if (this.productForm.invalid) return;
    const token = this.auth.getToken();
    if (!token) return;

    const val = this.productForm.getRawValue();
    const formData = new FormData();
    formData.append('name', val.name);
    if (val.brand) formData.append('brand', val.brand);
    formData.append('category_id', val.category_id);
    formData.append('price', val.price.toString());
    formData.append('stock', val.stock.toString());
    if (val.description) formData.append('description', val.description);
    if (val.sizes) {
      const sizesArr = val.sizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      formData.append('sizes', JSON.stringify(sizesArr));
    }
    if (this.selectedFile) formData.append('image', this.selectedFile);

    this.submitting.set(true);
    this.formError.set('');

    const editing = this.editingProduct();
    const request$ = editing
      ? this.productService.updateProduct(editing.id, formData, token)
      : this.productService.createProduct(formData, token);

    request$.subscribe({
      next: () => {
        toast.success(editing ? 'Producto actualizado' : 'Producto creado correctamente');
        this.closeForm();
        this.submitting.set(false);
        this.loadProducts();
      },
      error: (err: { error?: { error?: string } }) => {
        this.formError.set(err?.error?.error ?? 'Error al guardar el producto');
        this.submitting.set(false);
      },
    });
  }
}
