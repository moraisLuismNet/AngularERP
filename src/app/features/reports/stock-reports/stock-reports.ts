import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReportsService,
  StockItem,
  StockMovement,
  ApiReportResponse,
} from '../services/reports';

@Component({
  selector: 'app-stock-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-reports.html',
  styleUrl: './stock-reports.css',
})
export class StockReportsComponent implements OnInit {
  loading = true;
  hasError = false;
  errorMessage = '';
  stockItems: StockItem[] = [];
  recentMovements: StockMovement[] = [];
  totalProducts = 0;
  totalValue = 0;
  lowStockCount = 0;
  outOfStockCount = 0;
  apiResponse?: ApiReportResponse;

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadStockData();
  }

  private loadStockData(): void {
    this.loading = true;
    this.hasError = false;

    this.reportsService.getStockReport().subscribe({
      next: (report) => {
        this.stockItems = report.stockItems;
        this.recentMovements = report.recentMovements;
        this.totalProducts = report.totalProducts;
        this.totalValue = report.totalValue;
        this.lowStockCount = report.lowStockCount;
        this.outOfStockCount = report.outOfStockCount;
        this.apiResponse = report.apiResponse;
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('Error loading stock report:', error);
        this.loading = false;
        this.hasError = true;
        this.errorMessage =
          'The stock report could not be loaded. Please verify that the server is running.';
      },
    });
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusText(status: string): string {
    const statusMap = {
      low: 'Low Stock',
      normal: 'Normal',
      high: 'High Stock',
      out: 'Out of stock',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  retryLoad(): void {
    this.loadStockData();
  }
}
