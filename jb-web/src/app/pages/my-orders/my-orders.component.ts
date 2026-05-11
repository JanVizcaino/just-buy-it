import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { OrderService, Order } from '../../services/order.service';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  ChevronDown,
  ChevronUp,
  Package,
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
  selector: 'app-my-orders',
  imports: [LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ChevronDown, ChevronUp, Package }),
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-orders.component.html',
})
export class MyOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly expandedId = signal<string | null>(null);

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
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
