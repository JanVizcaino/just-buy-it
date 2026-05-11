import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  ShoppingCart,
  CircleUser,
  LogOut,
} from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ShoppingCart, LogOut, CircleUser }),
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
}
