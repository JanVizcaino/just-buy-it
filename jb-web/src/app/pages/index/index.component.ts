import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-index',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full h-screen bg-black dot-pattern flex flex-col items-center justify-center">
      <h1 class="text-7xl text-white tracking-wide">
        JUST <span class="font-bold italic">BUY IT</span>
      </h1>
      <nav
        class="mt-8 flex gap-10 text-zinc-400 text-sm tracking-widest"
        aria-label="Menú principal"
      >
        <a
          routerLink="/shop"
          class="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
        >shop</a>

        @if (auth.isAdmin()) {
          <a
            routerLink="/admin"
            class="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
          >admin</a>
        }

        @if (auth.isUser()) {
          <a
            routerLink="/orders"
            class="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
          >mis pedidos</a>
        }

        @if (auth.isLoggedIn()) {
          <button
            (click)="auth.logout()"
            class="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
            aria-label="Cerrar sesión"
          >salir</button>
        } @else {
          <a
            routerLink="/login"
            class="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
          >login</a>
          <a
            routerLink="/register"
            class="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
          >register</a>
        }
      </nav>
    </div>
  `,
})
export class IndexComponent {
  protected readonly auth = inject(AuthService);
}
