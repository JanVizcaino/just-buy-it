import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { CartService } from './cart.service';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly apiUrl = 'http://localhost:3000/api';

  private readonly _user = signal<User | null>(this.loadStoredUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');
  readonly isUser = computed(() => this._user()?.role === 'user');

  private loadStoredUser(): User | null {
    try {
      const data = localStorage.getItem('jbi_user');
      return data ? (JSON.parse(data) as User) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('jbi_token');
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('jbi_token', res.access_token);
          localStorage.setItem('jbi_user', JSON.stringify(res.user));
          this._user.set(res.user);
        })
      );
  }

  register(full_name: string, email: string, password: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/register`, { full_name, email, password });
  }

  logout(): void {
    localStorage.removeItem('jbi_token');
    localStorage.removeItem('jbi_user');
    this._user.set(null);
    this.cart.clear();
    this.cart.close();
    this.router.navigate(['/']);
  }
}
