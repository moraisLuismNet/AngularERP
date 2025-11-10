import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersService } from '../services/suppliers';
import { InventoryService } from '../../inventory/services/inventory';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from '../../../core/models/supplier.model';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers-list.html',
  styleUrl: './suppliers-list.css',
})
export class SuppliersListComponent implements OnInit {
  suppliers: Supplier[] = [];
  products: Product[] = [];
  loading = true;
  hasError = false;
  errorMessage = '';

  // Modal state
  showCreateModal = false;
  creatingSupplier = false;
  createError = '';

  // Edit modal state
  showEditModal = false;
  editingSupplier = false;
  editError = '';
  editingSupplierId: number | null = null;

  // View detail modal state
  showDetailModal = false;
  loadingDetail = false;
  detailError = '';
  supplierDetail: Supplier | null = null;

  // Delete modal state
  showDeleteModal = false;
  deletingSupplier = false;
  deleteError = '';
  supplierToDelete: Supplier | null = null;

  // Form data
  newSupplier: CreateSupplierRequest = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    idProduct: 0,
  };

  // Edit form data
  editSupplier: CreateSupplierRequest = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    idProduct: 0,
  };

  constructor(
    private suppliersService: SuppliersService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Load products and suppliers in parallel
    this.inventoryService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.warn('Could not load products for name mapping:', error);
        this.products = [];
      },
    });

    this.loadSuppliers();
  }

  private loadSuppliers(): void {
    this.suppliersService.getSuppliers().subscribe({
      next: (suppliers) => {
        // Filter only active suppliers
        this.suppliers = suppliers.filter(
          (supplier) => supplier.isActive === true
        );
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('❌ Error loading suppliers:', error);
        this.loading = false;
        this.hasError = true;

        if (error.status === 500) {
          this.errorMessage = `Internal server error (500). The microservice is responding but has an internal error.`;
        } else if (error.status === 0) {
          this.errorMessage =
            'Cannot connect to the suppliers service. Verify that it is running.';
        } else if (error.status === 401) {
          this.errorMessage =
            'Invalid or expired authentication token. Try logging in again.';
        } else if (error.status === 404) {
          this.errorMessage =
            'Endpoint not found. Verify that the /api/suppliers route is available.';
        } else {
          this.errorMessage = `Error ${error.status}: ${
            error.message || 'Unknown error'
          }`;
        }
      },
    });
  }

  retryLoad(): void {
    this.loading = true;
    this.hasError = false;
    this.loadSuppliers();
  }

  // Methods for creating suppliers
  createNewSupplier(): void {
    this.showCreateModal = true;
    this.resetForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.newSupplier = {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      idProduct: 0,
    };
    this.createError = '';
  }

  onSubmitCreate(): void {
    if (!this.isFormValid()) {
      this.createError = 'Please fill in all required fields';
      return;
    }

    this.creatingSupplier = true;
    this.createError = '';

    this.suppliersService.createSupplier(this.newSupplier).subscribe({
      next: (createdSupplier) => {
        this.creatingSupplier = false;
        this.closeCreateModal();
        this.loadSuppliers(); // Reload the suppliers list
      },
      error: (error) => {
        console.error('Error creating supplier:', error);
        this.creatingSupplier = false;
        this.createError =
          error.error?.message || 'Error creating supplier. Please try again.';
      },
    });
  }

  private isFormValid(): boolean {
    return !!(
      this.newSupplier.name.trim() &&
      this.newSupplier.contactPerson.trim() &&
      this.newSupplier.email.trim() &&
      this.isValidEmail(this.newSupplier.email) &&
      this.newSupplier.idProduct > 0
    );
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Methods for editing suppliers
  editSupplierModal(supplier: Supplier): void {
    this.editingSupplierId = supplier.id;
    this.showEditModal = true;

    // Upload the complete supplier details
    this.suppliersService.getSupplier(supplier.id).subscribe({
      next: (fullSupplier) => {
        this.editSupplier = {
          name: fullSupplier.name,
          contactPerson: fullSupplier.contactPerson,
          email: fullSupplier.email,
          phone: fullSupplier.phone || '',
          address: fullSupplier.address || '',
          city: fullSupplier.city || '',
          country: fullSupplier.country || '',
          idProduct: fullSupplier.idProduct,
        };
        this.editError = '';
      },
      error: (error) => {
        console.error('Error loading supplier details:', error);
        this.editError = 'Error loading supplier details. Please try again.';
      },
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.resetEditForm();
  }

  private resetEditForm(): void {
    this.editSupplier = {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      idProduct: 0,
    };
    this.editError = '';
    this.editingSupplierId = null;
  }

  onSubmitEdit(): void {
    if (!this.isEditFormValid()) {
      this.editError = 'Please fill in all required fields';
      return;
    }

    if (!this.editingSupplierId) {
      this.editError = 'No supplier selected for editing';
      return;
    }

    this.editingSupplier = true;
    this.editError = '';

    // Prepare the data for sending, ensuring that all fields are strings.
    const updateData: UpdateSupplierRequest = {
      name: this.editSupplier.name,
      contactPerson: this.editSupplier.contactPerson,
      email: this.editSupplier.email,
      phone: this.editSupplier.phone || '',
      address: this.editSupplier.address || '',
      city: this.editSupplier.city || '',
      country: this.editSupplier.country || '',
      idProduct: this.editSupplier.idProduct,
    };

    this.suppliersService
      .updateSupplier(this.editingSupplierId, updateData)
      .subscribe({
        next: () => {
          this.editingSupplier = false;
          this.closeEditModal();
          this.loadSuppliers(); // Reload the suppliers list
        },
        error: (error) => {
          console.error('Error updating supplier:', error);
          this.editingSupplier = false;
          this.editError =
            error.error?.message ||
            'Error updating supplier. Please try again.';
        },
      });
  }

  private isEditFormValid(): boolean {
    return !!(
      this.editSupplier.name.trim() &&
      this.editSupplier.contactPerson.trim() &&
      this.editSupplier.email.trim() &&
      this.isValidEmail(this.editSupplier.email) &&
      this.editSupplier.idProduct > 0
    );
  }

  // Methods for viewing supplier details
  viewSupplierDetail(supplier: Supplier): void {
    this.showDetailModal = true;
    this.loadingDetail = true;
    this.detailError = '';
    this.supplierDetail = null;

    // Upload the complete supplier details
    this.suppliersService.getSupplier(supplier.id).subscribe({
      next: (fullSupplier) => {
        this.supplierDetail = fullSupplier;
        this.loadingDetail = false;
      },
      error: (error) => {
        console.error('Error loading supplier details:', error);
        this.detailError = 'Error loading supplier details. Please try again.';
        this.loadingDetail = false;
      },
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.supplierDetail = null;
    this.detailError = '';
    this.loadingDetail = false;
  }

  // Helper method to get the product name
  getProductName(productId: number): string {
    if (!this.products || this.products.length === 0) {
      return `Product ID: ${productId}`;
    }

    // Try to find the product by comparing both the string and the number.
    const product = this.products.find(
      (p) =>
        p.id === productId.toString() || parseInt(p.id.toString()) === productId
    );

    if (product) {
      return product.name;
    }

    return `Product ID: ${productId}`;
  }

  // Methods for eliminating suppliers
  confirmDeleteSupplier(supplier: Supplier): void {
    this.supplierToDelete = supplier;
    this.showDeleteModal = true;
    this.deleteError = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.supplierToDelete = null;
    this.deleteError = '';
    this.deletingSupplier = false;
  }

  deleteSupplier(): void {
    if (!this.supplierToDelete) {
      this.deleteError = 'No supplier selected for deletion';
      return;
    }

    this.deletingSupplier = true;
    this.deleteError = '';

    this.suppliersService.deleteSupplier(this.supplierToDelete.id).subscribe({
      next: () => {
        this.deletingSupplier = false;
        this.closeDeleteModal();
        this.loadSuppliers(); // Reload the suppliers list
      },
      error: (error) => {
        console.error('Error deleting supplier:', error);
        this.deletingSupplier = false;

        // Specific message depending on the type of error
        if (error.status === 401) {
          this.deleteError =
            'Unauthorized: You need Admin privileges to delete suppliers. Please check your permissions or login again.';
        } else if (error.status === 404) {
          this.deleteError =
            'Supplier not found. It may have been already deleted.';
        } else if (error.status === 403) {
          this.deleteError =
            'Forbidden: You do not have permission to delete suppliers.';
        } else if (error.status === 500) {
          this.deleteError = 'Internal server error. Please try again later.';
        } else {
          this.deleteError =
            error.error?.message ||
            'Error deleting supplier. Please try again.';
        }
      },
    });
  }
}
