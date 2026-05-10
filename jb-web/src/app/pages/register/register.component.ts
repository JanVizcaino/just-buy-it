import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { toast } from 'ngx-sonner';

function passwordMatch(control: AbstractControl): Record<string, boolean> | null {
  const pwd = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pwd === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-black dot-pattern flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <h1 class="text-white text-3xl font-bold tracking-wider mb-2 text-center">
          Crear Cuenta
        </h1>
        <p class="text-zinc-400 text-center mb-8 text-sm">
          Únete a Just Buy It
        </p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>
          <div>
            <label for="full_name" class="block text-zinc-300 text-sm mb-2">Nombre completo</label>
            <input
              id="full_name"
              type="text"
              formControlName="full_name"
              class="w-full bg-zinc-900 text-white placeholder-zinc-500 px-4 py-3 rounded-xl border border-zinc-800 focus:border-zinc-500 focus:outline-none"
              placeholder="Tu nombre"
              autocomplete="name"
            />
          </div>

          <div>
            <label for="reg-email" class="block text-zinc-300 text-sm mb-2">Email</label>
            <input
              id="reg-email"
              type="email"
              formControlName="email"
              class="w-full bg-zinc-900 text-white placeholder-zinc-500 px-4 py-3 rounded-xl border border-zinc-800 focus:border-zinc-500 focus:outline-none"
              placeholder="tu@email.com"
              autocomplete="email"
            />
          </div>

          <div>
            <label for="reg-password" class="block text-zinc-300 text-sm mb-2">Contraseña</label>
            <input
              id="reg-password"
              type="password"
              formControlName="password"
              class="w-full bg-zinc-900 text-white placeholder-zinc-500 px-4 py-3 rounded-xl border border-zinc-800 focus:border-zinc-500 focus:outline-none"
              placeholder="Mínimo 6 caracteres"
              autocomplete="new-password"
            />
          </div>

          <div>
            <label for="confirmPassword" class="block text-zinc-300 text-sm mb-2">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              class="w-full bg-zinc-900 text-white placeholder-zinc-500 px-4 py-3 rounded-xl border border-zinc-800 focus:border-zinc-500 focus:outline-none"
              placeholder="Repite tu contraseña"
              autocomplete="new-password"
            />
          </div>

          @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
            <p class="text-red-400 text-sm" role="alert">Las contraseñas no coinciden</p>
          }
          @if (error()) {
            <p class="text-red-400 text-sm text-center" role="alert">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            @if (loading()) { Creando cuenta... } @else { Crear Cuenta }
          </button>
        </form>

        <p class="text-zinc-400 text-center mt-6 text-sm">
          ¿Ya tienes cuenta?
          <a routerLink="/login" class="text-white underline hover:text-zinc-300 ml-1">
            Inicia Sesión
          </a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.nonNullable.group(
    {
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatch }
  );

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { full_name, email, password } = this.form.getRawValue();
    this.auth.register(full_name, email, password).subscribe({
      next: () => {
        toast.success('Cuenta creada. Inicia sesión.');
        this.router.navigate(['/login']);
      },
      error: (err: { error?: { error?: string } }) => {
        this.error.set(err?.error?.error ?? 'Error al crear la cuenta');
        this.loading.set(false);
      },
    });
  }
}
