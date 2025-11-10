export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  idProduct: number;
  isActive: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  idProduct: number;
}

export interface UpdateSupplierRequest {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  idProduct: number;
}
