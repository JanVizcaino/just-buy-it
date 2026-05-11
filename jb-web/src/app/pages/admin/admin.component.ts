import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { AdminProductsComponent } from '../admin-products/admin-products.component';
import { AdminOrdersComponent } from '../admin-orders/admin-orders.component';

type AdminTab = 'products' | 'orders';

@Component({
  selector: 'app-admin',
  imports: [AdminProductsComponent, AdminOrdersComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.component.html',
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
