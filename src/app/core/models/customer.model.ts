export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address: Address;
}
