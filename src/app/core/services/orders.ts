import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface Order {
  id: string;
  customerEmail: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface CreateOrderResponse {
  idOrder: number;
  orderDate: string;
  paymentMethod: string;
  total: number;
  userEmail: string;
  cartId: number;
  orderDetails: OrderDetail[];
}

export interface OrderDetail {
  idOrderDetail: number;
  orderId: number;
  productId: number;
  amount: number;
  price: number;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly baseUrl = 'http://localhost:5007/api'; // Shopping microservice (contains orders)

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // Create order from cart
  createOrderFromCart(email: string): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(
      `${this.baseUrl}/orders/from-cart/${encodeURIComponent(email)}`,
      {},
      {
        headers: this.getHeaders(),
      }
    );
  }

  // Get user orders
  getUserOrders(email: string): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.baseUrl}/orders/user/${encodeURIComponent(email)}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  // Get a specific order
  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${orderId}`, {
      headers: this.getHeaders(),
    });
  }
}
