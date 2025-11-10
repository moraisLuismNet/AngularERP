export interface Category {
  id: number;
  name: string;
  description: string;
  urlImage: string;
  isActive: boolean;
  productCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  urlImage: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string;
  urlImage: string;
}
