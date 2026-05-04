import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  price: number;
  stock: number;
  brand: string;
  category_id: string;
  sizes: string[];
  is_active: boolean;
  created_at: string;
  categories?: Category;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';

  getProducts(filters: ProductFilters = {}): Observable<ProductsResponse> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http
      .get<ProductsResponse>(`${this.apiUrl}/products`, { params })
      .pipe(catchError(() => of({ data: [], total: 0, page: 1, limit: 12 })));
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<Category[]>(`${this.apiUrl}/categories`)
      .pipe(catchError(() => of([])));
  }

  createProduct(formData: FormData, token: string): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, formData, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    });
  }

  updateProduct(id: string, formData: FormData, token: string): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, formData, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    });
  }

  deleteProduct(id: string, token: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/products/${id}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    });
  }
}
