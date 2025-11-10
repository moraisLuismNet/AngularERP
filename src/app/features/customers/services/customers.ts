import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api';

export interface CustomerSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  customerType: string;
  isActive: boolean;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  customerType: string;
  defaultPaymentMethod: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  constructor(private apiService: ApiService) {}

  // Get all customers (summary)
  getCustomers(): Observable<CustomerSummary[]> {
    return this.apiService.customers.get<CustomerSummary[]>('api/customers');
  }

  // Acquire a specific client
  getCustomer(id: number): Observable<Customer> {
    return this.apiService.customers.get<Customer>(`api/customers/${id}`);
  }

  // Find clients
  searchCustomers(query: string): Observable<CustomerSummary[]> {
    return this.apiService.customers.get<CustomerSummary[]>(
      `api/customers/search?query=${encodeURIComponent(query)}`
    );
  }

  // Create client
  createCustomer(customer: Partial<Customer>): Observable<Customer> {
    return this.apiService.customers.post<Customer>('api/customers', customer);
  }

  // Update client
  updateCustomer(id: number, customer: Partial<Customer>): Observable<void> {
    return this.apiService.customers.put<void>(`api/customers/${id}`, customer);
  }

  // Delete client
  deleteCustomer(id: number): Observable<void> {
    return this.apiService.customers.delete<void>(`api/customers/${id}`);
  }
}
