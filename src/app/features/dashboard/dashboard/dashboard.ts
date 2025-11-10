import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { InventoryService } from '@app/features/inventory/services/inventory';
import { UsersService } from '@app/core/services/users';
import { Product } from '@app/core/models/product.model';

// Define the User interface to fix type issues
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  lowStockProducts: Product[] = [];
  totalProducts = 0;
  totalUsers = 0;
  activeUsers = 0;
  loading = true;
  hasError = false;
  errorMessage = '';

  constructor(
    private inventoryService: InventoryService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Load basic dashboard data
    Promise.all([
      firstValueFrom(this.inventoryService.getProducts() as Observable<Product[]>),
      firstValueFrom(this.inventoryService.getLowStockProducts() as Observable<Product[]>),
      firstValueFrom(this.usersService.getUsers() as Observable<User[]>),
    ])
      .then(([products, lowStockProducts, users]) => {
        this.totalProducts = products?.length || 0;
        this.lowStockProducts = lowStockProducts || [];

        // Calculate total and active users (only users with the "User" role)
        const allUsers: User[] = users || [];
        const activeUsersFiltered = allUsers.filter(
          (user: User) => user.role.toLowerCase() === 'user'
        );

        this.totalUsers = allUsers.length;
        this.activeUsers = activeUsersFiltered.length;

        this.loading = false;
        this.hasError = false;
      })
      .catch((error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
        this.hasError = true;
        this.errorMessage =
          'Some dashboard data could not be loaded. Microservices may not be available.';
      });
  }

  retryLoad(): void {
    this.loading = true;
    this.hasError = false;
    this.loadDashboardData();
  }
}
