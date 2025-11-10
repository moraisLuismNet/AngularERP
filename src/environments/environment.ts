export const environment = {
  production: false,
  apiUrl: 'http://localhost:5002', // ProductsAPI by default
  microservices: {
    users: 'http://localhost:5001',
    products: 'http://localhost:5002',
    customers: 'http://localhost:5003',
    suppliers: 'http://localhost:5004',
    shopping: 'http://localhost:5007',
    reports: 'http://localhost:5009',
  },
};
