import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { AdminProductsComponent } from '../admin-products/admin-products.component';
import { AdminOrdersComponent } from '../admin-orders/admin-orders.component';

type AdminTab = 'products' | 'orders';

@Component({
  selector: 'app-admin',
  imports: [AdminProductsComponent, AdminOrdersComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-black">
      <div class="bg-zinc-900 border-b border-zinc-800 px-6 flex gap-1" role="tablist" aria-label="Secciones de administración">
        <button
          role="tab"
          [attr.aria-selected]="activeTab() === 'products'"
          (click)="activeTab.set('products')"
          [class]="tabClass('products')"
        >Productos</button>
        <button
          role="tab"
          [attr.aria-selected]="activeTab() === 'orders'"
          (click)="activeTab.set('orders')"
          [class]="tabClass('orders')"
        >Pedidos</button>
      </div>

      @if (activeTab() === 'products') {
        <app-admin-products />
      } @else {
        <app-admin-orders />
      }
    </div>
  `,
})
export class AdminComponent {
  protected readonly activeTab = signal<AdminTab>('products');

  protected tabClass(tab: AdminTab): string {
    const base = 'px-5 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 -mb-px ';
    return this.activeTab() === tab
      ? base + 'text-white border-white'
      : base + 'text-zinc-500 hover:text-zinc-300 border-transparent';
  }
}
