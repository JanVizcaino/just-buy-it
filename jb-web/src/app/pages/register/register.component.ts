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
  templateUrl: './register.component.html',
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
