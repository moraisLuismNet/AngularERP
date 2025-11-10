import { Routes } from '@angular/router';
import { ReportsComponent } from './reports/reports';
import { SalesReportsComponent } from './sales-reports/sales-reports';
import { StockReportsComponent } from './stock-reports/stock-reports';

export const REPORTS_ROUTES: Routes = [
  { 
    path: '', 
    component: ReportsComponent,
    children: [
      { path: 'sales', component: SalesReportsComponent },
      { path: 'stock', component: StockReportsComponent },
      { path: '', redirectTo: 'sales', pathMatch: 'full' },
    ]
  }
];
