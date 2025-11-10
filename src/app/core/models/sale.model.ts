export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: SaleStatus;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export enum SaleStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export interface CreateSaleRequest {
  customerId: string;
  items: CreateSaleItemRequest[];
  paymentMethod: string;
}

export interface CreateSaleItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}
