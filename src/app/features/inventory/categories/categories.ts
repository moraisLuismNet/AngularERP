import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../services/inventory';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../../core/models/category.model';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  loading = true;
  hasError = false;
  errorMessage = '';

  // Modal state
  showCreateModal = false;
  creatingCategory = false;
  createError = '';

  // Edit modal state
  showEditModal = false;
  editingCategory = false;
  editError = '';
  editingCategoryId = 0;

  // Delete modal state
  showDeleteModal = false;
  deletingCategory = false;
  deleteError = '';
  categoryToDelete: Category | null = null;

  // View Products modal state
  showProductsModal = false;
  loadingProducts = false;
  productsError = '';
  selectedCategory: Category | null = null;
  categoryProducts: Product[] = [];

  // Form data
  newCategory: CreateCategoryRequest = {
    name: '',
    description: '',
    urlImage: '',
  };

  // Edit form data
  editCategory: UpdateCategoryRequest = {
    name: '',
    description: '',
    urlImage: '',
  };

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.inventoryService.getCategories().subscribe({
      next: (categories) => {
        // Filter only active categories
        this.categories = categories.filter(
          (category) => category.isActive !== false
        );
        this.loading = false;
        this.hasError = false;
      },
      error: (error) => {
        console.error('❌ Error loading categories:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Full error object:', error);
        this.loading = false;
        this.hasError = true;

        // Specific message depending on the type of error
        if (error.status === 500) {
          this.errorMessage = `Internal server error (500). The product microservice in http://localhost:5002 está respondiendo pero tiene un error interno. Verifica los logs del servidor.`;
        } else if (error.status === 0) {
          this.errorMessage =
            'Unable to connect to the product service. Verify that it is running in http://localhost:5002';
        } else if (error.status === 401) {
          this.errorMessage =
            'Invalid or expired authentication token. Please try logging in again.';
        } else if (error.status === 404) {
          this.errorMessage =
            'Endpoint not found. Verify that the /api/categories route is available in the microservice.';
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
    this.loadCategories();
  }

  // Method to validate if an image URL is valid
  isValidImageUrl(url: string): boolean {
    if (!url) {
      console.log('❌ Empty or null URL');
      return false;
    }
    return true;
  }

  // Method to obtain the correct image URL
  getImageUrl(url: string): string {
    let processedUrl = url;

    // Fix Imgur URLs
    if (url.includes('imgur.com')) {
      // Make sure you use i.imgur.com
      if (!url.includes('i.imgur.com')) {
        processedUrl = url.replace('imgur.com', 'i.imgur.com');
      }

      // Ensure it has an image extension
      if (!processedUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        // If it doesn't have an extension, add .png by default.
        processedUrl += '.png';
      }
    }
    return processedUrl;
  }

  // Method for handling image loading errors
  onImageError(category: Category): void {
    console.error(
      '❌ Error loading image for category:',
      category.name,
      'URL:',
      category.urlImage
    );
  }

  // Method for handling successful image loading
  onImageLoad(category: Category): void {
    console.log(
      '✅ Image loaded successfully for category:',
      category.name,
      'URL:',
      category.urlImage
    );
  }

  // Methods for creating categories
  createNewCategory(): void {
    this.showCreateModal = true;
    this.resetForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.newCategory = {
      name: '',
      description: '',
      urlImage: '',
    };
    this.createError = '';
  }

  onSubmitCreate(): void {
    if (!this.isFormValid()) {
      this.createError = 'Please fill in all required fields';
      return;
    }

    this.creatingCategory = true;
    this.createError = '';

    this.inventoryService.createCategory(this.newCategory).subscribe({
      next: (createdCategory) => {
        console.log('Category created successfully:', createdCategory);
        this.creatingCategory = false;
        this.closeCreateModal();
        this.loadCategories(); // Reload the categories list
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this.creatingCategory = false;
        this.createError =
          error.error?.message || 'Error creating category. Please try again.';
      },
    });
  }

  private isFormValid(): boolean {
    return !!(
      this.newCategory.name.trim() && this.newCategory.description.trim()
    );
  }

  // Methods for editing categories
  editCategoryModal(category: Category): void {
    this.editingCategoryId = category.id;
    this.editCategory = {
      name: category.name,
      description: category.description,
      urlImage: category.urlImage || '',
    };
    this.showEditModal = true;
    this.editError = '';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.resetEditForm();
  }

  private resetEditForm(): void {
    this.editCategory = {
      name: '',
      description: '',
      urlImage: '',
    };
    this.editError = '';
    this.editingCategoryId = 0;
  }

  onSubmitEdit(): void {
    if (!this.isEditFormValid()) {
      this.editError = 'Please fill in all required fields';
      return;
    }

    this.editingCategory = true;
    this.editError = '';

    this.inventoryService
      .updateCategory(this.editingCategoryId, this.editCategory)
      .subscribe({
        next: () => {
          console.log('Category updated successfully');
          this.editingCategory = false;
          this.closeEditModal();
          this.loadCategories(); // Reload the categories list
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.editingCategory = false;
          this.editError =
            error.error?.message ||
            'Error updating category. Please try again.';
        },
      });
  }

  private isEditFormValid(): boolean {
    return !!(
      this.editCategory.name.trim() && this.editCategory.description.trim()
    );
  }

  // Methods for category elimination
  canDeleteCategory(category: Category): boolean {
    return category.productCount === 0;
  }

  confirmDeleteCategory(category: Category): void {
    if (!this.canDeleteCategory(category)) {
      alert(
        'Cannot delete category with associated products. Please remove all products from this category first.'
      );
      return;
    }

    this.categoryToDelete = category;
    this.showDeleteModal = true;
    this.deleteError = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.categoryToDelete = null;
    this.deleteError = '';
  }

  onConfirmDelete(): void {
    if (!this.categoryToDelete) return;

    this.deletingCategory = true;
    this.deleteError = '';

    this.inventoryService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        console.log(
          'Category deleted successfully:',
          this.categoryToDelete?.name
        );
        this.deletingCategory = false;
        this.closeDeleteModal();
        this.loadCategories(); // Reload the categories list
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.deletingCategory = false;
        this.deleteError =
          error.error?.message || 'Error deleting category. Please try again.';
      },
    });
  }

  // Métodos para visualización de productos por categoría
  canViewProducts(category: Category): boolean {
    return category.productCount > 0;
  }

  viewCategoryProducts(category: Category): void {
    if (!this.canViewProducts(category)) {
      return;
    }

    this.selectedCategory = category;
    this.showProductsModal = true;
    this.loadCategoryProducts(category);
  }

  private loadCategoryProducts(category: Category): void {
    this.loadingProducts = true;
    this.productsError = '';
    this.categoryProducts = [];

    this.inventoryService.getProducts().subscribe({
      next: (products) => {
        // Filter products by category
        this.categoryProducts = products.filter((product) => {
          const productWithCategory = product as any;
          return (
            productWithCategory.categoryName === category.name ||
            productWithCategory.category === category.name ||
            productWithCategory.categoryId === category.id
          );
        });

        this.loadingProducts = false;
      },
      error: (error) => {
        console.error('Error loading category products:', error);
        this.loadingProducts = false;
        this.productsError = 'Error loading products. Please try again.';
      },
    });
  }

  closeProductsModal(): void {
    this.showProductsModal = false;
    this.selectedCategory = null;
    this.categoryProducts = [];
    this.productsError = '';
  }

  // Helper method para obtener imagen del producto
  getProductImage(product: Product): string {
    const productWithImage = product as any;
    const imageUrl = productWithImage.urlImage || '';

    if (
      imageUrl &&
      imageUrl.includes('imgur.com') &&
      !imageUrl.includes('i.imgur.com')
    ) {
      return imageUrl.replace('imgur.com', 'i.imgur.com');
    }

    if (imageUrl && imageUrl.includes('example.com')) {
      return '';
    }

    return imageUrl;
  }

  // Helper method to obtain the product category name
  getCategoryName(product: Product): string {
    const productWithCategory = product as any;
    return (
      productWithCategory.categoryName ||
      productWithCategory.category ||
      'Uncategorized'
    );
  }
}
