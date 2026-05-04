import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  size: string;
  unit_price: number;
  products: { name: string; image_url: string; brand: string };
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_address: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  order_items: OrderItem[];
}

interface CreateOrderPayload {
  items: { product_id: string; quantity: number; size: string }[];
  shipping_address: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:3000/api';

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  createOrder(payload: CreateOrderPayload): Observable<{ message: string; order: Order }> {
    return this.http.post<{ message: string; order: Order }>(
      `${this.apiUrl}/orders`,
      payload,
      { headers: this.authHeaders() }
    );
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/my-orders`, {
      headers: this.authHeaders(),
    });
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`, {
      headers: this.authHeaders(),
    });
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/orders/${id}/status`,
      { status },
      { headers: this.authHeaders() }
    );
  }
}
