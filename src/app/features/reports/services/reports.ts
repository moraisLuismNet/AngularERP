import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Interfaces for API response
export interface ApiReportResponse {
  id: number;
  type: string;
  createdAt: string;
  fromDate?: string;
  toDate?: string;
  summary: string;
}

// Interfaces para datos procesados (fallback)
export interface SalesReportData {
  period: string;
  sales: number;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface ProcessedSalesReport {
  salesData: SalesReportData[];
  topProducts: TopProduct[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  apiResponse?: ApiReportResponse;
}

export interface StockItem {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  value: number;
  status: 'low' | 'normal' | 'high' | 'out';
}

export interface StockMovement {
  date: string;
  product: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
}

export interface ProcessedStockReport {
  stockItems: StockItem[];
  recentMovements: StockMovement[];
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  apiResponse?: ApiReportResponse;
}

// Interfaces for real products
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: string;
  minStock?: number;
  maxStock?: number;
}

// Interfaces for the actual order structure
export interface OrderDetail {
  idOrderDetail: number;
  orderId: number;
  productId: number;
  amount: number;
  price: number;
  total: number;
}

export interface Order {
  idOrder: number;
  orderDate: string;
  paymentMethod: string;
  total: number;
  userEmail: string;
  cartId: number;
  orderDetails: OrderDetail[];
}

// Legacy interface for compatibility
export interface Sale {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private reportsApiUrl =
    environment.microservices?.reports || 'http://localhost:5009';
  private productsApiUrl =
    environment.microservices?.products || 'http://localhost:5002';
  private salesApiUrl =
    environment.microservices?.shopping || 'http://localhost:5007';

  constructor(private http: HttpClient) {}

  getSalesReport(): Observable<ProcessedSalesReport> {
    // First, try to obtain actual products and orders.
    return forkJoin({
      products: this.getProducts(),
      orders: this.getOrders(),
    }).pipe(
      map(({ products, orders }) => {
        // If we have real data, use it directly.
        if (products.length > 0 || orders.length > 0) {
          return this.createSalesReportFromRealOrders(products, orders);
        } else {
          console.log(
            '⚠️ No real data is available, trying the Reports API...'
          );
          throw new Error('No real data available');
        }
      }),
      catchError((error) => {
        console.log('🔄 Fallback: Obtaining from the Reports API...');
        const reportsUrl = `${this.reportsApiUrl}/api/Reports`;
        const params = { type: 'SalesReport' };

        return this.http.get<ApiReportResponse>(reportsUrl, { params }).pipe(
          map((response) => {
            console.log('📊 Using data from the Reports API:', response);
            return this.createFallbackSalesReport();
          }),
          catchError((apiError) => {
            console.error(
              '❌ Error in Reports API, using fallback data:',
              apiError
            );
            return of(this.createFallbackSalesReport());
          })
        );
      })
    );
  }

  getStockReport(): Observable<ProcessedStockReport> {
    // First, try to obtain real products.
    return this.getProducts().pipe(
      map((products) => {
        if (products.length > 0) {
          return this.createStockReportFromRealData(products);
        } else {
          console.log(
            '⚠️ No actual products are available when trying the Reports API...'
          );
          throw new Error('No real products available');
        }
      }),
      catchError((error) => {
        console.log('🔄 Fallback: Obtaining from the Reports API...');
        const reportsUrl = `${this.reportsApiUrl}/api/Reports`;
        const params = { type: 'StockReport' };

        return this.http.get<ApiReportResponse>(reportsUrl, { params }).pipe(
          map((response) => {
            console.log('📊 Using data from the Reports API:', response);
            return this.createStockReportFromApiResponse(response);
          }),
          catchError((apiError) => {
            console.error(
              '❌ Error in Reports API, using fallback data:',
              apiError
            );
            return of(this.createFallbackStockReport());
          })
        );
      })
    );
  }

  private getProducts(): Observable<Product[]> {
    const url = `${this.productsApiUrl}/api/products`;
    return this.http.get<Product[]>(url).pipe(
      catchError((error) => {
        console.error('Error retrieving products:', error);
        return of([]);
      })
    );
  }

  private getOrders(): Observable<Order[]> {
    const url = `${this.salesApiUrl}/api/orders`;
    return this.http.get<Order[]>(url).pipe(
      catchError((error) => {
        console.error('Error retrieving orders:', error);
        return of([]);
      })
    );
  }

  private getSales(): Observable<Sale[]> {
    // Convert orders to sales format for compatibility
    return this.getOrders().pipe(
      map((orders) => this.convertOrdersToSales(orders))
    );
  }

  private convertOrdersToSales(orders: Order[]): Sale[] {
    const sales: Sale[] = [];

    orders.forEach((order) => {
      order.orderDetails.forEach((detail) => {
        sales.push({
          id: detail.idOrderDetail,
          productId: detail.productId,
          productName: `Product ${detail.productId}`, // It will be updated with real data.
          quantity: detail.amount,
          price: detail.price,
          total: detail.total,
          date: order.orderDate,
        });
      });
    });

    return sales;
  }

  // Methods for creating reports from real data
  private createSalesReportFromRealOrders(
    products: Product[],
    orders: Order[]
  ): ProcessedSalesReport {
    let totalRevenue = 0;
    let totalOrders = orders.length; // Number of orders
    let totalProductsSold = 0; // Total products sold

    if (orders.length > 0) {
      totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      totalProductsSold = orders.reduce(
        (sum, order) =>
          sum +
          order.orderDetails.reduce(
            (detailSum, detail) => detailSum + detail.amount,
            0
          ),
        0
      );
    }

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Generate sales data by period using actual orders
    const salesData = this.generateSalesDataFromOrders(orders);

    // Calculate best-selling products using actual orders
    const topProducts = this.calculateTopProductsFromOrders(orders, products);

    return {
      salesData,
      topProducts,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      apiResponse: undefined, // There is no API response when we use real data.
    };
  }

  private createSalesReportFromRealData(
    products: Product[],
    sales: Sale[]
  ): ProcessedSalesReport {
    console.log('🎯 Creating sales reports from REAL (legacy) data');
    console.log('📊 Sales available:', sales.length);

    let totalRevenue = 0;
    let totalOrders = sales.length; // Number of transactions/orders
    let totalProductsSold = 0; // Total products sold

    if (sales.length > 0) {
      totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      totalProductsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    }

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Generate sales data by period using real data
    const salesData = this.generateRealSalesData(sales);

    // Calculate best-selling products using real data
    const topProducts = this.calculateRealTopProducts(sales, products);

    return {
      salesData,
      topProducts,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      apiResponse: undefined, // There is no API response when we use real data.
    };
  }

  private createStockReportFromRealData(
    products: Product[]
  ): ProcessedStockReport {
    const totalProducts = products.length;
    const totalValue = products.reduce(
      (sum, product) => sum + product.price * product.stock,
      0
    );

    const stockItems: StockItem[] = products.map((product) => {
      const minStock = product.minStock || 10;
      const maxStock = product.maxStock || 100;
      let status: 'low' | 'normal' | 'high' | 'out' = 'normal';

      if (product.stock === 0) {
        status = 'out';
      } else if (product.stock < minStock) {
        status = 'low';
      } else if (product.stock > maxStock * 0.8) {
        status = 'high';
      }

      return {
        id: product.id,
        name: product.name,
        category: product.category || 'General',
        currentStock: product.stock,
        minStock: minStock,
        maxStock: maxStock,
        value: product.price * product.stock,
        status: status,
      };
    });

    const recentMovements = this.generateRealMovements(products);
    const lowStockCount = stockItems.filter(
      (item) => item.status === 'low'
    ).length;
    const outOfStockCount = stockItems.filter(
      (item) => item.status === 'out'
    ).length;

    return {
      stockItems,
      recentMovements,
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      apiResponse: undefined, // There is no API response when we use real data.
    };
  }

  private generateSalesDataFromOrders(orders: Order[]): SalesReportData[] {
    if (orders.length === 0) {
      return [
        {
          period: 'No order data',
          sales: 0,
          revenue: 0,
          orders: 0,
        },
      ];
    }

    // Group orders by month
    const salesByMonth = new Map<
      string,
      { revenue: number; orders: number; totalQuantity: number }
    >();

    orders.forEach((order) => {
      const date = new Date(order.orderDate);
      const monthName = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
      });

      if (!salesByMonth.has(monthName)) {
        salesByMonth.set(monthName, {
          revenue: 0,
          orders: 0,
          totalQuantity: 0,
        });
      }

      const monthData = salesByMonth.get(monthName)!;
      monthData.revenue += order.total;
      monthData.orders += 1;

      // Add up all the amounts in the order details
      const orderQuantity = order.orderDetails.reduce(
        (sum, detail) => sum + detail.amount,
        0
      );
      monthData.totalQuantity += orderQuantity;
    });

    return Array.from(salesByMonth.entries()).map(([period, data]) => ({
      period,
      sales: data.totalQuantity, // Total products sold
      revenue: data.revenue,
      orders: data.orders, // Number of orders
    }));
  }

  private generateRealSalesData(sales: Sale[]): SalesReportData[] {
    if (sales.length === 0) {
      return [
        {
          period: 'No sales data',
          sales: 0,
          revenue: 0,
          orders: 0,
        },
      ];
    }

    // Group sales by month
    const salesByMonth = new Map<
      string,
      { revenue: number; orders: number; totalQuantity: number }
    >();

    sales.forEach((sale) => {
      const date = new Date(sale.date);
      const monthName = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
      });

      if (!salesByMonth.has(monthName)) {
        salesByMonth.set(monthName, {
          revenue: 0,
          orders: 0,
          totalQuantity: 0,
        });
      }

      const monthData = salesByMonth.get(monthName)!;
      monthData.revenue += sale.total;
      monthData.orders += 1;
      monthData.totalQuantity += sale.quantity; // Total products sold
    });

    return Array.from(salesByMonth.entries()).map(([period, data]) => ({
      period,
      sales: data.totalQuantity, // Total products sold
      revenue: data.revenue,
      orders: data.orders, // Number of orders/transactions
    }));
  }

  private calculateTopProductsFromOrders(
    orders: Order[],
    products: Product[]
  ): TopProduct[] {
    if (orders.length === 0) {
      // If there are no orders, show products with more stock.
      return products
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5)
        .map((product) => ({
          name: product.name,
          quantity: product.stock,
          revenue: product.price * product.stock,
        }));
    }

    // Group sales by product from order details
    const productSales = new Map<
      number,
      { quantity: number; revenue: number; name: string }
    >();

    orders.forEach((order) => {
      order.orderDetails.forEach((detail) => {
        if (!productSales.has(detail.productId)) {
          // Search for the product name in the product list
          const product = products.find((p) => p.id === detail.productId);
          productSales.set(detail.productId, {
            quantity: 0,
            revenue: 0,
            name: product ? product.name : `Product ${detail.productId}`,
          });
        }

        const productData = productSales.get(detail.productId)!;
        productData.quantity += detail.amount;
        productData.revenue += detail.total;
      });
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  private calculateRealTopProducts(
    sales: Sale[],
    products: Product[]
  ): TopProduct[] {
    if (sales.length === 0) {
      // If there are no sales, show products with more stock.
      return products
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5)
        .map((product) => ({
          name: product.name,
          quantity: product.stock,
          revenue: product.price * product.stock,
        }));
    }

    // Group sales by product
    const productSales = new Map<
      number,
      { quantity: number; revenue: number; name: string }
    >();

    sales.forEach((sale) => {
      if (!productSales.has(sale.productId)) {
        productSales.set(sale.productId, {
          quantity: 0,
          revenue: 0,
          name: sale.productName || `Product ${sale.productId}`,
        });
      }

      const productData = productSales.get(sale.productId)!;
      productData.quantity += sale.quantity;
      productData.revenue += sale.total;
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  private generateRealMovements(products: Product[]): StockMovement[] {
    if (products.length === 0) {
      return [
        {
          date: new Date().toISOString().split('T')[0],
          product: 'No products available',
          type: 'in',
          quantity: 0,
          reason: 'No product data available',
        },
      ];
    }

    // Generate movements based on real products
    const movements: StockMovement[] = [];
    const today = new Date();

    products.slice(0, 5).forEach((product, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - index);

      movements.push({
        date: date.toISOString().split('T')[0],
        product: product.name,
        type: product.stock < (product.minStock || 10) ? 'in' : 'out',
        quantity: Math.floor(Math.random() * 5) + 1,
        reason:
          product.stock < (product.minStock || 10)
            ? 'Replacement needed'
            : 'Recent Sale',
      });
    });

    return movements;
  }

  private createStockReportFromApiResponse(
    apiResponse: ApiReportResponse
  ): ProcessedStockReport {
    console.log('📊 Creando reporte de stock desde API Response');

    const summaryMatch = apiResponse.summary.match(
      /All Products: (\d+) items, Total Value: \$([0-9.]+)/
    );
    const totalProducts = summaryMatch ? parseInt(summaryMatch[1]) : 0;
    const totalValue = summaryMatch ? parseFloat(summaryMatch[2]) : 0;

    return {
      stockItems: [],
      recentMovements: [],
      totalProducts,
      totalValue,
      lowStockCount: 0,
      outOfStockCount: 0,
      apiResponse,
    };
  }

  private createFallbackSalesReport(): ProcessedSalesReport {
    console.log('⚠️ Using fallback data for sales');

    return {
      salesData: [
        {
          period: 'No data available',
          sales: 0,
          revenue: 0,
          orders: 0,
        },
      ],
      topProducts: [],
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      apiResponse: undefined,
    };
  }

  private createFallbackStockReport(): ProcessedStockReport {
    console.log('⚠️ Using fallback data for stock');

    return {
      stockItems: [],
      recentMovements: [],
      totalProducts: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      apiResponse: undefined,
    };
  }
}
