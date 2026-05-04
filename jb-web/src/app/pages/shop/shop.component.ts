import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, Category } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  Menu,
  Eye,
  Info,
  ShoppingCart,
  ArrowRight,
} from 'lucide-angular';
import { toast } from 'ngx-sonner';

interface CarouselItem {
  product: Product;
  originalIndex: number;
  isActive: boolean;
}

@Component({
  selector: 'app-shop',
  imports: [LucideAngularModule, FormsModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Menu, Eye, Info, ShoppingCart, ArrowRight }),
    },
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly selectedIndex = signal(0);
  protected readonly viewMode = signal<'image' | 'info'>('image');
  protected readonly selectedSize = signal<string | null>(null);
  protected readonly showCategories = signal(false);
  protected readonly searchText = signal('');

  protected readonly cartCount = computed(() => this.cartService.count());

  protected readonly selectedProduct = computed(() => this.products()[this.selectedIndex()]);

  protected readonly productSizes = computed(
    () => this.selectedProduct()?.sizes ?? []
  );

  protected readonly carouselProducts = computed((): CarouselItem[] => {
    const all = this.products();
    if (all.length === 0) return [];
    const idx = this.selectedIndex();
    const count = Math.min(5, all.length);
    const halfFloor = Math.floor(count / 2);
    return Array.from({ length: count }, (_, i) => {
      const offset = i - halfFloor;
      const originalIndex = ((idx + offset) % all.length + all.length) % all.length;
      return { product: all[originalIndex], originalIndex, isActive: originalIndex === idx };
    });
  });

  ngOnInit(): void {
    this.loadProducts();
    this.productService.getCategories().subscribe((c) => this.categories.set(c));
  }

  private loadProducts(categorySlug?: string): void {
    this.productService
      .getProducts({ category: categorySlug, limit: 20 })
      .subscribe((res) => {
        this.products.set(res.data);
        this.selectedIndex.set(0);
        this.selectedSize.set(null);
      });
  }

  protected selectProduct(index: number): void {
    this.selectedIndex.set(index);
    this.viewMode.set('image');
    this.selectedSize.set(null);
  }

  protected selectSize(size: string): void {
    this.selectedSize.set(this.selectedSize() === size ? null : size);
  }

  protected addToCart(): void {
    if (!this.auth.isLoggedIn()) {
      toast.error('Inicia sesión para añadir al carrito');
      this.router.navigate(['/login']);
      return;
    }
    const product = this.selectedProduct();
    if (!product) return;

    if (product.sizes && product.sizes.length > 0 && !this.selectedSize()) {
      toast.error('Selecciona una talla');
      return;
    }

    this.cartService.addItem({
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      price: product.price,
      quantity: 1,
      size: this.selectedSize() ?? 'Única',
    });
    toast.success('Añadido al carrito');
    this.cartService.open();
  }

  protected goToProductDetail(): void {
    const product = this.selectedProduct();
    if (product?.slug) {
      this.router.navigate(['/product', product.slug]);
    }
  }

  protected toggleCategories(): void {
    this.showCategories.update((v) => !v);
  }

  protected filterByCategory(slug: string | null): void {
    this.loadProducts(slug ?? undefined);
    this.showCategories.set(false);
  }

  protected onSearch(value: string): void {
    this.productService
      .getProducts({ search: value || undefined, limit: 20 })
      .subscribe((res) => {
        this.products.set(res.data);
        this.selectedIndex.set(0);
        this.selectedSize.set(null);
      });
  }
}
