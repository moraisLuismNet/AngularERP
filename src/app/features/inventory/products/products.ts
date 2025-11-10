import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../services/inventory';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  loading = true;
  hasError = false;
  errorMessage = '';

  // Modal state
  showCreateModal = false;
  creatingProduct = false;
  createError = '';

  // Edit modal state
  showEditModal = false;
  editingProduct = false;
  editError = '';
  editingProductId = '';

  // Delete modal state
  showDeleteModal = false;
  deletingProduct = false;
  deleteError = '';
  productToDelete: Product | null = null;

  // Form data
  newProduct: CreateProductRequest = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: 0,
    urlImage: '',
  };

  // Edit form data
  editProduct: UpdateProductRequest = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: 0,
    urlImage: '',
  };

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  private loadProducts(): void {
    this.inventoryService.getProducts().subscribe({
      next: (products) => {
        // Filter only active products
        this.products = products.filter((product) => {
          const productWithStatus = product as any;
          return productWithStatus.isActive !== false;
        });
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading = false;
        this.hasError = true;

        // Specific message depending on the type of error
        if (error.status === 500) {
          this.errorMessage = `Error interno del servidor (500). El microservicio de productos en http://localhost:5002 está respondiendo pero tiene un error interno. Verifica los logs del servidor.`;
        } else if (error.status === 0) {
          this.errorMessage =
            'Unable to connect to the product service. Verify that it is running in http://localhost:5002';
        } else if (error.status === 401) {
          this.errorMessage =
            'Invalid or expired authentication token. Please try logging in again.';
        } else if (error.status === 404) {
          this.errorMessage =
            'Endpoint not found. Verify that the /api/products route is available in the microservice.';
        } else {
          this.errorMessage = `Error ${error.status}: ${
            error.message || 'Error desconocido'
          }`;
        }
      },
    });
  }

  retryLoad(): void {
    this.loading = true;
    this.hasError = false;
    this.loadProducts();
  }

  // Helper method to obtain the product image URL
  getProductImage(product: Product): string {
    const productWithImage = product as any;
    const imageUrl = productWithImage.urlImage || '';

    // Correct Imgur URLs if necessary
    if (
      imageUrl &&
      imageUrl.includes('imgur.com') &&
      !imageUrl.includes('i.imgur.com')
    ) {
      return imageUrl.replace('imgur.com', 'i.imgur.com');
    }

    return imageUrl;
  }

  // Helper method to get the category name
  getCategoryName(product: Product): string {
    const productWithCategory = product as any;
    return (
      productWithCategory.categoryName ||
      productWithCategory.category ||
      'Uncategorized'
    );
  }

  private loadCategories(): void {
    this.inventoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter((cat) => cat.isActive !== false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      },
    });
  }

  // Method to open the create product modal
  createNewProduct(): void {
    this.showCreateModal = true;
    this.resetForm();
  }

  // Method to close the modal
  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  // Method to reset the form
  private resetForm(): void {
    this.newProduct = {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      categoryId: 0,
      urlImage: '',
    };
    this.createError = '';
  }

  // Method for submitting the form
  onSubmitCreate(): void {
    if (!this.isFormValid()) {
      this.createError = 'Please fill in all required fields';
      return;
    }

    this.creatingProduct = true;
    this.createError = '';

    this.inventoryService.createProduct(this.newProduct).subscribe({
      next: (createdProduct) => {
        this.creatingProduct = false;
        this.closeCreateModal();
        this.loadProducts(); // Reload the products list
      },
      error: (error) => {
        console.error('Error creating product:', error);
        this.creatingProduct = false;
        this.createError =
          error.error?.message || 'Error creating product. Please try again.';
      },
    });
  }

  // Method for validating the form
  private isFormValid(): boolean {
    return !!(
      this.newProduct.name.trim() &&
      this.newProduct.description.trim() &&
      this.newProduct.price > 0 &&
      this.newProduct.stock >= 0 &&
      this.newProduct.categoryId > 0
    );
  }

  // Methods for product editing
  editProductModal(product: Product): void {
    this.editingProductId = product.id;
    this.editProduct = {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId || 0,
      urlImage: product.urlImage || '',
    };
    this.showEditModal = true;
    this.editError = '';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.resetEditForm();
  }

  private resetEditForm(): void {
    this.editProduct = {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      categoryId: 0,
      urlImage: '',
    };
    this.editError = '';
    this.editingProductId = '';
  }

  onSubmitEdit(): void {
    if (!this.isEditFormValid()) {
      this.editError = 'Please fill in all required fields';
      return;
    }

    this.editingProduct = true;
    this.editError = '';

    this.inventoryService
      .updateProduct(this.editingProductId, this.editProduct)
      .subscribe({
        next: (updatedProduct) => {
          this.editingProduct = false;
          this.closeEditModal();
          this.loadProducts(); // Reload the products list
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.editingProduct = false;
          this.editError =
            error.error?.message || 'Error updating product. Please try again.';
        },
      });
  }

  private isEditFormValid(): boolean {
    return !!(
      this.editProduct.name?.trim() &&
      this.editProduct.description?.trim() &&
      this.editProduct.price &&
      this.editProduct.price > 0 &&
      this.editProduct.stock !== undefined &&
      this.editProduct.stock >= 0 &&
      this.editProduct.categoryId &&
      this.editProduct.categoryId > 0
    );
  }

  // Methods for product disposal
  confirmDeleteProduct(product: Product): void {
    this.productToDelete = product;
    this.showDeleteModal = true;
    this.deleteError = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.productToDelete = null;
    this.deleteError = '';
  }

  onConfirmDelete(): void {
    if (!this.productToDelete) return;

    this.deletingProduct = true;
    this.deleteError = '';

    this.inventoryService.deleteProduct(this.productToDelete.id).subscribe({
      next: () => {
        this.deletingProduct = false;
        this.closeDeleteModal();
        this.loadProducts(); // Reload the products list
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.deletingProduct = false;
        this.deleteError =
          error.error?.message || 'Error deleting product. Please try again.';
      },
    });
  }
}
