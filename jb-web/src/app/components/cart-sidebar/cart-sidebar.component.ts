import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  viewChild,
  ElementRef,
  effect,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { toast } from 'ngx-sonner';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  X,
  Trash2,
} from 'lucide-angular';

interface PlaceSuggestion {
  text: string;
  placeId: string;
}

interface PlacesLibrary {
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(request: {
      input: string;
      sessionToken?: object;
      language?: string;
    }): Promise<{
      suggestions: Array<{
        placePrediction: {
          text: { toString(): string };
          placeId: string;
        } | null;
      }>;
    }>;
  };
}

declare const google: {
  maps: {
    importLibrary(lib: 'places'): Promise<PlacesLibrary>;
  };
};

@Component({
  selector: 'app-cart-sidebar',
  imports: [FormsModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ X, Trash2 }),
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cart.isOpen()) {
      <div
        class="fixed inset-0 z-50 flex justify-end"
        role="dialog"
        aria-label="Carrito de compras"
        aria-modal="true"
      >
        <div
          class="absolute inset-0 bg-black/60"
          (click)="cart.close()"
          aria-hidden="true"
        ></div>

        <div class="relative w-full max-w-md bg-zinc-900 h-full flex flex-col shadow-2xl">
          <div class="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 class="text-white text-xl font-semibold">Carrito</h2>
            <button
              (click)="cart.close()"
              class="text-zinc-400 hover:text-white transition-colors"
              aria-label="Cerrar carrito"
            >
              <lucide-icon name="x" [size]="24" aria-hidden="true" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            @if (cart.items().length === 0) {
              <div class="flex flex-col items-center justify-center h-full text-center">
                <p class="text-zinc-400 text-lg mb-2">Tu carrito está vacío</p>
                <p class="text-zinc-600 text-sm">Añade productos desde el catálogo</p>
              </div>
            } @else {
              <ul class="space-y-4">
                @for (item of cart.items(); track item.product_id + '-' + item.size) {
                  <li class="flex gap-4 items-start bg-zinc-800 rounded-xl p-4">
                    @if (item.image_url) {
                      <img
                        [src]="item.image_url"
                        [alt]="item.name"
                        class="w-16 h-16 object-cover rounded-lg shrink-0"
                      />
                    } @else {
                      <div class="w-16 h-16 bg-zinc-700 rounded-lg shrink-0 flex items-center justify-center text-zinc-500 text-xs">
                        Sin img
                      </div>
                    }
                    <div class="flex-1 min-w-0">
                      <p class="text-white font-medium truncate">{{ item.name }}</p>
                      <p class="text-zinc-400 text-sm">Talla {{ item.size }}</p>
                      <p class="text-zinc-400 text-sm">{{ item.quantity }}x {{ item.price.toFixed(2) }}€</p>
                      <p class="text-white font-semibold">{{ (item.price * item.quantity).toFixed(2) }}€</p>
                    </div>
                    <button
                      (click)="cart.removeItem(item.product_id, item.size)"
                      class="text-zinc-500 hover:text-red-400 transition-colors mt-1 shrink-0"
                      [attr.aria-label]="'Eliminar ' + item.name"
                    >
                      <lucide-icon name="trash-2" [size]="16" aria-hidden="true" />
                    </button>
                  </li>
                }
              </ul>
            }
          </div>

          @if (cart.items().length > 0) {
            <div class="p-6 border-t border-zinc-800 space-y-4">
              <div class="flex justify-between text-white">
                <span class="font-semibold">Total</span>
                <span class="text-xl font-bold">{{ cart.total().toFixed(2) }}€</span>
              </div>

              @if (!showCheckout()) {
                <button
                  (click)="showCheckout.set(true)"
                  class="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
                >
                  Finalizar Pedido
                </button>
              } @else {
                <div class="space-y-3">
                  <div class="relative">
                    <input
                      #addressInputRef
                      type="text"
                      [(ngModel)]="shippingAddress"
                      placeholder="Dirección de envío *"
                      class="w-full bg-zinc-800 text-white placeholder-zinc-500 px-4 py-3 rounded-xl border border-zinc-700 focus:border-zinc-400 focus:outline-none"
                      aria-label="Dirección de envío"
                      autocomplete="off"
                      role="combobox"
                      aria-autocomplete="list"
                      [attr.aria-expanded]="suggestions().length > 0"
                      aria-haspopup="listbox"
                    />
                    @if (suggestions().length > 0) {
                      <ul
                        class="absolute top-full left-0 w-full z-50 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl"
                        role="listbox"
                        aria-label="Sugerencias de dirección"
                      >
                        @for (s of suggestions(); track s.placeId) {
                          <li role="option" [attr.aria-selected]="false">
                            <button
                              type="button"
                              class="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-zinc-700 transition-colors border-b border-zinc-700/50 last:border-0 truncate"
                              (mousedown)="$event.preventDefault()"
                              (click)="selectSuggestion(s)"
                            >{{ s.text }}</button>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                  <textarea
                    [(ngModel)]="notes"
                    placeholder="Observaciones (opcional)"
                    rows="2"
                    class="w-full bg-zinc-800 text-white placeholder-zinc-500 px-4 py-3 rounded-xl border border-zinc-700 focus:border-zinc-400 focus:outline-none resize-none"
                    aria-label="Observaciones del pedido"
                  ></textarea>
                  <button
                    (click)="placeOrder()"
                    [disabled]="isPlacing()"
                    class="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    @if (isPlacing()) { Procesando... } @else { Confirmar Pedido }
                  </button>
                  <button
                    (click)="showCheckout.set(false)"
                    class="w-full text-zinc-400 hover:text-white text-sm transition-colors py-1"
                  >
                    Cancelar
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class CartSidebarComponent implements OnDestroy {
  protected readonly cart = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly ngZone = inject(NgZone);

  protected readonly showCheckout = signal(false);
  protected readonly isPlacing = signal(false);
  protected readonly suggestions = signal<PlaceSuggestion[]>([]);
  protected shippingAddress = '';
  protected notes = '';

  private readonly addressInputRef =
    viewChild<ElementRef<HTMLInputElement>>('addressInputRef');

  private placesLib: PlacesLibrary | null = null;
  private sessionToken: object | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const el = this.addressInputRef();
      if (el) {
        this.initAutocomplete(el.nativeElement);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  private initAutocomplete(inputEl: HTMLInputElement): void {
    this.loadPlacesLib().then((lib) => {
      if (!lib) return;
      this.sessionToken = new lib.AutocompleteSessionToken();
    });

    inputEl.addEventListener('input', () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      const value = inputEl.value;
      if (value.length < 3) {
        this.ngZone.run(() => this.suggestions.set([]));
        return;
      }
      this.debounceTimer = setTimeout(() => this.fetchSuggestions(value), 350);
    });

    inputEl.addEventListener('blur', () => {
      setTimeout(() => this.ngZone.run(() => this.suggestions.set([])), 200);
    });
  }

  private async loadPlacesLib(): Promise<PlacesLibrary | null> {
    if (this.placesLib) return this.placesLib;
    if (typeof google === 'undefined') return null;
    try {
      this.placesLib = await google.maps.importLibrary('places');
      return this.placesLib;
    } catch {
      return null;
    }
  }

  private async fetchSuggestions(input: string): Promise<void> {
    const lib = await this.loadPlacesLib();
    if (!lib || !this.sessionToken) return;
    try {
      const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken: this.sessionToken,
        language: 'es',
      });
      this.ngZone.run(() => {
        this.suggestions.set(
          suggestions
            .filter((s) => s.placePrediction !== null)
            .map((s) => ({
              text: s.placePrediction!.text.toString(),
              placeId: s.placePrediction!.placeId,
            }))
        );
      });
    } catch {
      // ignore fetch errors silently
    }
  }

  protected selectSuggestion(suggestion: PlaceSuggestion): void {
    this.shippingAddress = suggestion.text;
    this.suggestions.set([]);
    this.loadPlacesLib().then((lib) => {
      if (lib) this.sessionToken = new lib.AutocompleteSessionToken();
    });
  }

  protected placeOrder(): void {
    if (!this.shippingAddress.trim()) {
      toast.error('Introduce una dirección de envío');
      return;
    }
    this.isPlacing.set(true);
    const payload = {
      items: this.cart.items().map((i) => ({
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
        this.cart.clear();
        this.cart.close();
        this.showCheckout.set(false);
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
}
