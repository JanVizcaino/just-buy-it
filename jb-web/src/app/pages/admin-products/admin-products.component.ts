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
  templateUrl: './admin-products.component.html',
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
