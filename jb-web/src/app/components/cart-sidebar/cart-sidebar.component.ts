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
  templateUrl: './cart-sidebar.component.html',
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
