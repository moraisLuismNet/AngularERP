import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api';
import {
  Product,
  CreateProductRequest,
} from '../../../core/models/product.model';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../../core/models/category.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  constructor(private apiService: ApiService) {}

  // Methods for products (ProductsAPI - port 5002)
  getProducts(): Observable<Product[]> {
    return this.apiService.products.get<Product[]>('api/products');
  }

  getProduct(id: string): Observable<Product> {
    return this.apiService.products.get<Product>(`api/products/${id}`);
  }

  createProduct(product: CreateProductRequest): Observable<Product> {
    return this.apiService.products.post<Product>('api/products', product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.apiService.products.put<Product>(`api/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.apiService.products.delete<void>(`api/products/${id}`);
  }

  getLowStockProducts(): Observable<Product[]> {
    return new Observable((observer) => {
      this.getProducts().subscribe({
        next: (products) => {
          // Filter products with low stock (assuming they have the stock property)
          const lowStockProducts = products.filter((product) => {
            const productWithStock = product as any;
            return (
              productWithStock.stock !== undefined &&
              productWithStock.stock < 10
            );
          });

          observer.next(lowStockProducts);
          observer.complete();
        },
        error: (error) => {
          console.warn(
            'Products could not be obtained to verify low stock:',
            error
          );
          observer.next([]);
          observer.complete();
        },
      });
    });
  }

  // Methods for categories (ProductsAPI - port 5002)
  getCategories(): Observable<Category[]> {
    return this.apiService.products.get<Category[]>('api/categories');
  }

  getCategory(id: number): Observable<Category> {
    return this.apiService.products.get<Category>(`api/categories/${id}`);
  }

  createCategory(category: CreateCategoryRequest): Observable<Category> {
    return this.apiService.products.post<Category>('api/categories', category);
  }

  updateCategory(
    id: number,
    category: UpdateCategoryRequest
  ): Observable<void> {
    return this.apiService.products.put<void>(`api/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.apiService.products.delete<void>(`api/categories/${id}`);
  }
}
