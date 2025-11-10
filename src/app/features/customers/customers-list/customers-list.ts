import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CustomersService,
  CustomerSummary,
  Customer,
} from '../services/customers';

// Interface for the creation form
interface CreateCustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  customerType: string;
  defaultPaymentMethod: string;
}

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers-list.html',
  styleUrl: './customers-list.css',
})
export class CustomersListComponent implements OnInit {
  customers: CustomerSummary[] = [];
  loading = true;
  hasError = false;
  errorMessage = '';

  // Modal state
  showCreateModal = false;
  creatingCustomer = false;
  createError = '';

  // Edit modal state
  showEditModal = false;
  editingCustomer = false;
  editError = '';
  editingCustomerId: number | null = null;

  // View detail modal state
  showDetailModal = false;
  loadingDetail = false;
  detailError = '';
  customerDetail: Customer | null = null;

  // Delete modal state
  showDeleteModal = false;
  deletingCustomer = false;
  deleteError = '';
  customerToDelete: CustomerSummary | null = null;

  // Form data
  newCustomer: CreateCustomerForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
    customerType: 'regular',
    defaultPaymentMethod: 'card',
  };

  // Edit form data
  editCustomer: CreateCustomerForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
    customerType: 'regular',
    defaultPaymentMethod: 'card',
  };

  constructor(private customersService: CustomersService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.customersService.getCustomers().subscribe({
      next: (customers) => {
        // Filter only active customers (IsActive = true)
        this.customers = customers.filter(
          (customer) => customer.isActive === true
        );
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.loading = false;
        this.hasError = true;

        // Specific message depending on the type of error
        if (error.status === 500) {
          this.errorMessage = `Internal server error (500). The customers microservice at http://localhost:5003 is responding but has an internal error. Check server logs.`;
        } else if (error.status === 0) {
          this.errorMessage =
            'Cannot connect to customers service. Verify it is running at http://localhost:5003';
        } else if (error.status === 401) {
          this.errorMessage =
            'Invalid or expired authentication token. Try logging in again.';
        } else if (error.status === 404) {
          this.errorMessage =
            'Endpoint not found. Verify that /api/customers route is available in the microservice.';
        } else {
          this.errorMessage = `Error ${error.status}: ${
            error.message || 'Unknown error'
          }`;
        }
      },
    });
  }

  // Helper method to obtain the full name
  getFullName(customer: CustomerSummary): string {
    return `${customer.firstName} ${customer.lastName}`.trim();
  }

  retryLoad(): void {
    this.loading = true;
    this.hasError = false;
    this.loadCustomers();
  }

  // Métodos para creación de customers
  createNewCustomer(): void {
    this.showCreateModal = true;
    this.resetForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.newCustomer = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      country: '',
      customerType: 'regular',
      defaultPaymentMethod: 'card',
    };
    this.createError = '';
  }

  onSubmitCreate(): void {
    if (!this.isFormValid()) {
      this.createError = 'Please fill in all required fields';
      return;
    }

    this.creatingCustomer = true;
    this.createError = '';

    this.customersService.createCustomer(this.newCustomer).subscribe({
      next: (createdCustomer) => {
        this.creatingCustomer = false;
        this.closeCreateModal();
        this.loadCustomers(); // Reload the customers list
      },
      error: (error) => {
        console.error('Error creating customer:', error);
        this.creatingCustomer = false;
        this.createError =
          error.error?.message || 'Error creating customer. Please try again.';
      },
    });
  }

  private isFormValid(): boolean {
    return !!(
      this.newCustomer.firstName.trim() &&
      this.newCustomer.lastName.trim() &&
      this.newCustomer.email.trim() &&
      this.isValidEmail(this.newCustomer.email)
    );
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Methods for editing customers
  editCustomerModal(customer: CustomerSummary): void {
    this.editingCustomerId = customer.id;
    this.showEditModal = true;

    // Upload the complete customer data
    this.customersService.getCustomer(customer.id).subscribe({
      next: (fullCustomer) => {
        this.editCustomer = {
          firstName: fullCustomer.firstName,
          lastName: fullCustomer.lastName,
          email: fullCustomer.email,
          phone: fullCustomer.phone || '',
          address: fullCustomer.address || '',
          city: fullCustomer.city || '',
          stateProvince: fullCustomer.stateProvince || '',
          postalCode: fullCustomer.postalCode || '',
          country: fullCustomer.country || '',
          customerType: fullCustomer.customerType || 'regular',
          defaultPaymentMethod: fullCustomer.defaultPaymentMethod || 'card',
        };
        this.editError = '';
      },
      error: (error) => {
        console.error('Error loading customer details:', error);
        this.editError = 'Error loading customer details. Please try again.';
      },
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.resetEditForm();
  }

  private resetEditForm(): void {
    this.editCustomer = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      country: '',
      customerType: 'regular',
      defaultPaymentMethod: 'card',
    };
    this.editError = '';
    this.editingCustomerId = null;
  }

  onSubmitEdit(): void {
    if (!this.isEditFormValid()) {
      this.editError = 'Please fill in all required fields';
      return;
    }

    if (!this.editingCustomerId) {
      this.editError = 'No customer selected for editing';
      return;
    }

    this.editingCustomer = true;
    this.editError = '';

    // Prepare the data for sending, converting empty strings to undefined for optional fields
    const updateData = {
      ...this.editCustomer,
      phone: this.editCustomer.phone || undefined,
      address: this.editCustomer.address || undefined,
      city: this.editCustomer.city || undefined,
      stateProvince: this.editCustomer.stateProvince || undefined,
      postalCode: this.editCustomer.postalCode || undefined,
      country: this.editCustomer.country || undefined,
    };

    this.customersService
      .updateCustomer(this.editingCustomerId, updateData)
      .subscribe({
        next: () => {
          this.editingCustomer = false;
          this.closeEditModal();
          this.loadCustomers(); // Reload the customers list
        },
        error: (error) => {
          console.error('Error updating customer:', error);
          this.editingCustomer = false;
          this.editError =
            error.error?.message ||
            'Error updating customer. Please try again.';
        },
      });
  }

  private isEditFormValid(): boolean {
    return !!(
      this.editCustomer.firstName.trim() &&
      this.editCustomer.lastName.trim() &&
      this.editCustomer.email.trim() &&
      this.isValidEmail(this.editCustomer.email)
    );
  }

  // Methods for viewing customer details
  viewCustomerDetail(customer: CustomerSummary): void {
    this.showDetailModal = true;
    this.loadingDetail = true;
    this.detailError = '';
    this.customerDetail = null;

    // Upload the complete customer data
    this.customersService.getCustomer(customer.id).subscribe({
      next: (fullCustomer) => {
        this.customerDetail = fullCustomer;
        this.loadingDetail = false;
      },
      error: (error) => {
        console.error('Error loading customer details:', error);
        this.detailError = 'Error loading customer details. Please try again.';
        this.loadingDetail = false;
      },
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.customerDetail = null;
    this.detailError = '';
    this.loadingDetail = false;
  }

  // Methods to delete customers
  confirmDeleteCustomer(customer: CustomerSummary): void {
    this.customerToDelete = customer;
    this.showDeleteModal = true;
    this.deleteError = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.customerToDelete = null;
    this.deleteError = '';
    this.deletingCustomer = false;
  }

  deleteCustomer(): void {
    if (!this.customerToDelete) {
      this.deleteError = 'No customer selected for deletion';
      return;
    }

    this.deletingCustomer = true;
    this.deleteError = '';

    this.customersService.deleteCustomer(this.customerToDelete.id).subscribe({
      next: () => {
        this.deletingCustomer = false;
        this.closeDeleteModal();
        this.loadCustomers(); // Reload the customers list
      },
      error: (error) => {
        console.error('Error deleting customer:', error);
        this.deletingCustomer = false;
        this.deleteError =
          error.error?.message || 'Error deleting customer. Please try again.';
      },
    });
  }

  getFullNameForDelete(): string {
    if (!this.customerToDelete) return '';
    return `${this.customerToDelete.firstName} ${this.customerToDelete.lastName}`.trim();
  }
}
