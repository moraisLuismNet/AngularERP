import { Routes } from '@angular/router';
import { DashboardComponent } from '@app/features/dashboard/dashboard/dashboard';
import { LoginComponent } from '@app/auth/login/login';
import { RegisterComponent } from '@app/auth/register/register';
import { HomeComponent } from '@app/features/public/home/home';
import { CartComponent } from '@app/features/shopping/cart/cart';
import { authGuard } from '@app/core/guards/auth-guard';
import { adminGuard } from '@app/core/guards/admin-guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'shopping/cart', component: CartComponent, canActivate: [authGuard] },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'inventory',
    loadChildren: () => 
      import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES),
    canActivate: [adminGuard],
  },
  {
    path: 'customers',
    loadChildren: () => 
      import('./features/customers/customers.routes').then(m => m.CUSTOMERS_ROUTES),
    canActivate: [adminGuard],
  },
  {
    path: 'suppliers',
    loadChildren: () => 
      import('./features/suppliers/suppliers.routes').then(m => m.SUPPLIERS_ROUTES),
    canActivate: [adminGuard],
  },
  {
    path: 'shopping',
    loadChildren: () => 
      import('./features/shopping/shopping.routes').then(m => m.SHOPPING_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'reports',
    loadChildren: () => 
      import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES),
    canActivate: [adminGuard],
  },
  { path: '**', redirectTo: '/login' },
];
