import { Routes } from '@angular/router';
import { InventoryLayoutComponent } from './inventory-layout/inventory-layout';

export const INVENTORY_ROUTES: Routes = [
  { 
    path: '', 
    component: InventoryLayoutComponent,
    children: [
      { 
        path: '', 
        redirectTo: 'products', 
        pathMatch: 'full' 
      },
      { 
        path: 'products', 
        loadComponent: () => import('./products/products').then(m => m.ProductsComponent)
      },
      { 
        path: 'categories', 
        loadComponent: () => import('./categories/categories').then(m => m.CategoriesComponent)
      },
    ]
  }
];
