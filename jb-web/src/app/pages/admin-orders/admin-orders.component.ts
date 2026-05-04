import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../services/order.service';
import { toast } from 'ngx-sonner';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-angular';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  confirmed: 'bg-blue-500/20 text-blue-300',
  shipped: 'bg-purple-500/20 text-purple-300',
  delivered: 'bg-green-500/20 text-green-300',
  cancelled: 'bg-red-500/20 text-red-300',
};

@Component({
  selector: 'app-admin-orders',
  imports: [FormsModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ChevronDown, ChevronUp, MapPin }),
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-black text-white">
      <div class="max-w-5xl mx-auto px-6 py-8">
        <h1 class="text-2xl font-bold mb-8">Gestión de Pedidos</h1>

        @if (loading()) {
          <div class="flex justify-center py-20">
            <p class="text-zinc-400 animate-pulse">Cargando pedidos...</p>
          </div>
        } @else if (orders().length === 0) {
          <p class="text-zinc-400 text-center py-20">No hay pedidos registrados.</p>
        } @else {
          <ul class="space-y-4">
            @for (order of orders(); track order.id) {
              <li class="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                <div class="flex items-start gap-3 p-5 flex-wrap">
                  <!-- Order Info + Expand -->
                  <button
                    class="flex-1 flex items-start gap-3 text-left min-w-0"
                    (click)="toggleOrder(order.id)"
                    [attr.aria-expanded]="expandedId() === order.id"
                    [attr.aria-controls]="'admin-order-items-' + order.id"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-3 flex-wrap">
                        <p class="text-white font-medium text-sm">
                          Pedido #{{ order.id.slice(0, 8).toUpperCase() }}
                        </p>
                        <span [class]="'px-2.5 py-0.5 rounded-full text-xs font-medium ' + statusColor(order.status)">
                          {{ statusLabel(order.status) }}
                        </span>
                      </div>
                      <p class="text-zinc-500 text-xs mt-0.5">{{ formatDate(order.created_at) }}</p>
                      @if (order.shipping_address) {
                        <p class="text-zinc-500 text-xs mt-0.5 truncate max-w-xs flex items-center gap-2">
                          <lucide-icon name="map-pin" class="w-4"/> {{ order.shipping_address }}
                        </p>
                      }
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <span class="text-white font-bold">{{ order.total_amount.toFixed(2) }}€</span>
                      <lucide-icon
                        [name]="expandedId() === order.id ? 'chevron-up' : 'chevron-down'"
                        [size]="16"
                        class="text-zinc-500"
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  <!-- Status Selector -->
                  <select
                    [ngModel]="order.status"
                    (ngModelChange)="updateStatus(order, $event)"
                    class="bg-zinc-800 text-white text-xs px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-zinc-500 flex-shrink-0"
                    [attr.aria-label]="'Estado del pedido ' + order.id.slice(0, 8)"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                @if (expandedId() === order.id) {
                  <div
                    [id]="'admin-order-items-' + order.id"
                    class="px-5 pb-5 border-t border-zinc-800"
                  >
                    @if (order.notes) {
                      <p class="text-zinc-500 text-xs mt-3 mb-2">{{ order.notes }}</p>
                    }
                    <ul class="space-y-3 mt-4">
                      @for (item of order.order_items; track item.id) {
                        <li class="flex items-center gap-3">
                          @if (item.products?.image_url) {
                            <img
                              [src]="item.products.image_url"
                              [alt]="item.products.name"
                              class="w-10 h-10 object-cover rounded-lg bg-zinc-800 flex-shrink-0"
                            />
                          } @else {
                            <div class="w-10 h-10 bg-zinc-800 rounded-lg flex-shrink-0"></div>
                          }
                          <div class="flex-1 min-w-0">
                            <p class="text-white text-sm truncate">{{ item.products.name }}</p>
                            <p class="text-zinc-500 text-xs">
                              Talla {{ item.size }} · {{ item.quantity }}x ·
                              {{ item.unit_price.toFixed(2) }}€/u
                            </p>
                          </div>
                          <p class="text-white text-sm font-semibold flex-shrink-0">
                            {{ (item.unit_price * item.quantity).toFixed(2) }}€
                          </p>
                        </li>
                      }
                    </ul>
                  </div>
                }
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly expandedId = signal<string | null>(null);

  ngOnInit(): void {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected toggleOrder(id: string): void {
    this.expandedId.update((v) => (v === id ? null : id));
  }

  protected updateStatus(order: Order, newStatus: string): void {
    if (order.status === newStatus) return;
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (updated) => {
        this.orders.update((orders) =>
          orders.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o))
        );
        toast.success('Estado actualizado correctamente');
      },
      error: () => toast.error('Error al actualizar el estado'),
    });
  }

  protected statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  protected statusColor(status: string): string {
    return STATUS_COLORS[status] ?? 'bg-zinc-700 text-zinc-300';
  }

  protected formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
