export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  categoryId?: number;
  categoryName?: string;
  urlImage?: string;
  isActive?: boolean;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  urlImage?: string; 
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  stock?: number;
  urlImage?: string;
  isActive?: boolean;
}
