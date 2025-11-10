import { Routes } from '@angular/router';
import { ShoppingLayoutComponent } from './shopping-layout/shopping-layout';

export const SHOPPING_ROUTES: Routes = [
  { 
    path: '', 
    component: ShoppingLayoutComponent,
    children: [
      { 
        path: 'cart', 
        loadComponent: () => import('./cart/cart').then(m => m.CartComponent) 
      },
    ]
  }
];
