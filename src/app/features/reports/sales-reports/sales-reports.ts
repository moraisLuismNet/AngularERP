import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReportsService,
  SalesReportData,
  TopProduct,
  ApiReportResponse,
} from '../services/reports';

@Component({
  selector: 'app-sales-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-reports.html',
  styleUrl: './sales-reports.css',
})
export class SalesReportsComponent implements OnInit {
  loading = true;
  hasError = false;
  errorMessage = '';
  salesData: SalesReportData[] = [];
  topProducts: TopProduct[] = [];
  totalRevenue = 0;
  totalOrders = 0;
  averageOrderValue = 0;
  apiResponse?: ApiReportResponse;

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadSalesData();
  }

  private loadSalesData(): void {
    this.loading = true;
    this.hasError = false;

    this.reportsService.getSalesReport().subscribe({
      next: (report) => {
        this.salesData = report.salesData;
        this.topProducts = report.topProducts;
        this.totalRevenue = report.totalRevenue;
        this.totalOrders = report.totalOrders;
        this.averageOrderValue = report.averageOrderValue;
        this.apiResponse = report.apiResponse;
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('Error loading sales report:', error);
        this.loading = false;
        this.hasError = true;
        this.errorMessage =
          'The sales report could not be loaded. Please verify that the server is running.';
      },
    });
  }

  retryLoad(): void {
    this.loadSalesData();
  }
}
