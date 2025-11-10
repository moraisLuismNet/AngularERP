import { Routes } from '@angular/router';
import { CustomersLayoutComponent } from './customers-layout/customers-layout';

export const CUSTOMERS_ROUTES: Routes = [
  { 
    path: '', 
    component: CustomersLayoutComponent,
    children: [
      { 
        path: '', 
        loadComponent: () => import('./customers-list/customers-list').then(m => m.CustomersListComponent) 
      },
    ]
  }
];
