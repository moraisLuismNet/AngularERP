import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      // Authorization header will be added automatically by the interceptor
    });
  }

  // Generic method that allows specifying the microservice
  private callMicroservice<T>(
    microservice: keyof typeof environment.microservices,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any,
    params?: HttpParams
  ): Observable<T> {
    const baseUrl = environment.microservices[microservice];
    const url = `${baseUrl}/${endpoint}`;
    const options = {
      headers: this.getHeaders(),
      ...(params && { params }),
    };

    switch (method) {
      case 'GET':
        return this.http.get<T>(url, options);
      case 'POST':
        return this.http.post<T>(url, data, options);
      case 'PUT':
        return this.http.put<T>(url, data, options);
      case 'DELETE':
        return this.http.delete<T>(url, options);
      default:
        throw new Error(`Método HTTP no soportado: ${method}`);
    }
  }

  // Specific methods for each microservice
  users = {
    get: <T>(endpoint: string, params?: HttpParams) =>
      this.callMicroservice<T>('users', endpoint, 'GET', undefined, params),
    post: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('users', endpoint, 'POST', data),
    put: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('users', endpoint, 'PUT', data),
    delete: <T>(endpoint: string) =>
      this.callMicroservice<T>('users', endpoint, 'DELETE'),
  };

  products = {
    get: <T>(endpoint: string, params?: HttpParams) =>
      this.callMicroservice<T>('products', endpoint, 'GET', undefined, params),
    post: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('products', endpoint, 'POST', data),
    put: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('products', endpoint, 'PUT', data),
    delete: <T>(endpoint: string) =>
      this.callMicroservice<T>('products', endpoint, 'DELETE'),
  };

  customers = {
    get: <T>(endpoint: string, params?: HttpParams) =>
      this.callMicroservice<T>('customers', endpoint, 'GET', undefined, params),
    post: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('customers', endpoint, 'POST', data),
    put: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('customers', endpoint, 'PUT', data),
    delete: <T>(endpoint: string) =>
      this.callMicroservice<T>('customers', endpoint, 'DELETE'),
  };

  suppliers = {
    get: <T>(endpoint: string, params?: HttpParams) =>
      this.callMicroservice<T>('suppliers', endpoint, 'GET', undefined, params),
    post: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('suppliers', endpoint, 'POST', data),
    put: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('suppliers', endpoint, 'PUT', data),
    delete: <T>(endpoint: string) =>
      this.callMicroservice<T>('suppliers', endpoint, 'DELETE'),
  };

  shopping = {
    get: <T>(endpoint: string, params?: HttpParams) =>
      this.callMicroservice<T>('shopping', endpoint, 'GET', undefined, params),
    post: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('shopping', endpoint, 'POST', data),
    put: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('shopping', endpoint, 'PUT', data),
    delete: <T>(endpoint: string) =>
      this.callMicroservice<T>('shopping', endpoint, 'DELETE'),
  };

  reports = {
    get: <T>(endpoint: string, params?: HttpParams) =>
      this.callMicroservice<T>('reports', endpoint, 'GET', undefined, params),
    post: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('reports', endpoint, 'POST', data),
    put: <T>(endpoint: string, data: any) =>
      this.callMicroservice<T>('reports', endpoint, 'PUT', data),
    delete: <T>(endpoint: string) =>
      this.callMicroservice<T>('reports', endpoint, 'DELETE'),
  };

  // Backward compatibility methods (deprecated)
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    console.warn(
      'Método get() deprecated. Usa apiService.products.get() o el microservicio específico'
    );
    return this.products.get<T>(endpoint, params);
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    console.warn(
      'Método post() deprecated. Usa apiService.products.post() o el microservicio específico'
    );
    return this.products.post<T>(endpoint, data);
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    console.warn(
      'Método put() deprecated. Usa apiService.products.put() o el microservicio específico'
    );
    return this.products.put<T>(endpoint, data);
  }

  delete<T>(endpoint: string): Observable<T> {
    console.warn(
      'Método delete() deprecated. Usa apiService.products.delete() o el microservicio específico'
    );
    return this.products.delete<T>(endpoint);
  }
}
