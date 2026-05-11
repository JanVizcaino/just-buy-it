import { Component, inject, computed } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CartSidebarComponent } from './components/cart-sidebar/cart-sidebar.component';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, CartSidebarComponent, NgxSonnerToaster],
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
  );

  protected readonly showNavbar = computed(() => this.currentUrl() !== '/');
}
