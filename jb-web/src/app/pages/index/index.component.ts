import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-index',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full h-screen bg-black flex flex-col items-center justify-center">
      <h1 class="text-7xl text-white tracking-wide">
        JUST <span class="font-bold italic">BUY IT</span>
      </h1>
      <nav
        class="mt-8 flex gap-10 text-zinc-400 text-sm tracking-widest"
        aria-label="Main navigation"
      >
        <a
          routerLink="/shop"
          class="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
        >shop</a>
        <a
          href="#"
          class="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
        >login</a>
        <a
          href="#"
          class="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white"
        >about us</a>
      </nav>
    </div>
  `,
})
export class IndexComponent {}
