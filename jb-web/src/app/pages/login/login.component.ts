import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-black flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <h1 class="text-white text-3xl font-bold tracking-wider mb-2 text-center">
          Iniciar Sesión
        </h1>
        <p class="text-zinc-400 text-center mb-8 text-sm">
          Accede a tu cuenta de Just Buy It
        </p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>
          <div>
            <label for="email" class="block text-zinc-300 text-sm mb-2">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full bg-zinc-900 text-white placeholder-zinc-500 px-4 py-3 rounded-xl border border-zinc-800 focus:border-zinc-500 focus:outline-none"
              placeholder="tu@email.com"
              autocomplete="email"
            />
          </div>

          <div>
            <label for="password" class="block text-zinc-300 text-sm mb-2">Contraseña</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="w-full bg-zinc-900 text-white placeholder-zinc-500 px-4 py-3 rounded-xl border border-zinc-800 focus:border-zinc-500 focus:outline-none"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          @if (error()) {
            <p class="text-red-400 text-sm text-center" role="alert">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            @if (loading()) { Entrando... } @else { Iniciar Sesión }
          </button>
        </form>

        <p class="text-zinc-400 text-center mt-6 text-sm">
          ¿No tienes cuenta?
          <a routerLink="/register" class="text-white underline hover:text-zinc-300 ml-1">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        toast.success('¡Bienvenido/a!');
        this.router.navigate(['/']);
      },
      error: () => {
        this.error.set('Email o contraseña incorrectos');
        this.loading.set(false);
      },
    });
  }
}
