import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { ProductService, Product, Category } from '../../services/product.service';
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
import { NgxSonnerToaster, toast } from 'ngx-sonner';

interface CarouselItem {
  product: Product;
  originalIndex: number;
  isActive: boolean;
}

@Component({
  selector: 'app-shop',
  imports: [LucideAngularModule, NgxSonnerToaster],
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

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly selectedIndex = signal(0);
  protected readonly viewMode = signal<'image' | 'info'>('image');
  protected readonly cartCount = signal(0);
  protected readonly selectedSize = signal<number | null>(null);
  protected readonly showCategories = signal(false);

  protected readonly sizes = [37, 38, 39, 40, 41, 42, 43, 44, 45, 46];

  protected readonly selectedProduct = computed(() => this.products()[this.selectedIndex()]);

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
    this.productService.getProducts().subscribe(p => this.products.set(p));
    this.productService.getCategories().subscribe(c => this.categories.set(c));
  }

  protected selectProduct(index: number): void {
    this.selectedIndex.set(index);
    this.viewMode.set('image');
  }

  protected selectSize(size: number): void {
    this.selectedSize.set(this.selectedSize() === size ? null : size);
  }

  protected addToCart(): void {
    this.cartCount.update(n => n + 1);
    toast.success('Añadido al carrito');
  }

  protected toggleCategories(): void {
    this.showCategories.update(v => !v);
  }

  protected filterByCategory(categoryId: number): void {
    // Future: filter products by category
    void categoryId;
    this.showCategories.set(false);
  }
}
