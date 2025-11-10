import { Routes } from '@angular/router';
import { SuppliersListComponent } from './suppliers-list/suppliers-list';

export const SUPPLIERS_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./suppliers-layout/suppliers-layout').then(m => m.SuppliersLayoutComponent),
    children: [
      { path: '', component: SuppliersListComponent },
    ]
  }
];
