import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from '../../../core/models/supplier.model';
import { AuthService } from '../../../core/services/auth';

@Injectable({
  providedIn: 'root',
})
export class SuppliersService {
  private readonly baseUrl = 'http://localhost:5004/api'; // Suppliers microservice

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.baseUrl}/suppliers`, {
      headers: this.getHeaders(),
    });
  }

  getSupplier(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}/suppliers/${id}`, {
      headers: this.getHeaders(),
    });
  }

  createSupplier(supplier: CreateSupplierRequest): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.baseUrl}/suppliers`, supplier, {
      headers: this.getHeaders(),
    });
  }

  updateSupplier(
    id: number,
    supplier: UpdateSupplierRequest
  ): Observable<Supplier> {
    return this.http.put<Supplier>(
      `${this.baseUrl}/suppliers/${id}`,
      supplier,
      {
        headers: this.getHeaders(),
      }
    );
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/suppliers/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
