import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  product_id: string;
  name: string;
  image_url: string;
  price: number;
  quantity: number;
  size: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);
  readonly isOpen = signal(false);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  addItem(item: CartItem): void {
    this._items.update((items) => {
      const existing = items.find(
        (i) => i.product_id === item.product_id && i.size === item.size
      );
      if (existing) {
        return items.map((i) =>
          i.product_id === item.product_id && i.size === item.size
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...items, item];
    });
  }

  removeItem(product_id: string, size: string): void {
    this._items.update((items) =>
      items.filter((i) => !(i.product_id === product_id && i.size === size))
    );
  }

  clear(): void {
    this._items.set([]);
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((v) => !v);
  }
}
