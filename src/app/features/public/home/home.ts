import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { InventoryService } from '../../inventory/services/inventory';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { AuthService } from '../../../core/services/auth';
import { ShoppingCartService } from '../../../core/services/shopping-cart';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  selectedCategory: number | null = null;
  loading = true;
  hasError = false;
  errorMessage = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }
  
  get paginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private cartService: ShoppingCartService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Load products and categories in parallel
    Promise.all([
      this.inventoryService.getProducts().toPromise(),
      this.inventoryService.getCategories().toPromise(),
    ])
      .then(([products, categories]) => {
        this.products = products || [];
        this.categories = categories || [];

        this.loading = false;
        this.hasError = false;
      })
      .catch((error) => {
        console.error('Error loading data:', error);
        this.loading = false;
        this.hasError = true;
        this.errorMessage =
          'Error loading products. Please verify that the server is functioning.';
      });
  }

  filterByCategory(categoryId: number | null): void {
    this.selectedCategory = categoryId;
    this.currentPage = 1; // Reset to first page when changing category
  }

  get filteredProducts(): Product[] {
    if (!this.selectedCategory) {
      return this.products;
    }
    return this.products.filter((product) => {
      const productWithCategory = product as any;
      return productWithCategory.categoryId === this.selectedCategory;
    });
  }
  
  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      window.scrollTo(0, 0);
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo(0, 0);
    }
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo(0, 0);
    }
  }

  private getCategoryName(categoryId: number): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category ? category.name : '';
  }

  retryLoad(): void {
    this.loading = true;
    this.hasError = false;
    this.loadData();
  }

  // Helper method to obtain the product image URL
  getProductImage(product: Product): string {
    return (product as any).urlImage || '';
  }

  // Method to validate if an image URL is valid
  isValidImageUrl(url: string): boolean {
    if (!url) {
      console.log('❌ Empty URL');
      return false;
    }

    // Verify that it is a valid URL
    try {
      new URL(url);
      return true;
    } catch {
      console.log('❌ Invalid URL');
      return false;
    }
  }

  // Method to obtain the correct image URL
  getImageUrl(url: string): string {
    // Correct Imgur URLs if necessary
    if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
      return url.replace('imgur.com', 'i.imgur.com');
    }

    return url;
  }

  // Method for handling image loading errors
  onImageError(event: any): void {
    console.warn('Error loading image:', event.target.src);
    // Replace with image placeholder
    const img = event.target;
    const productName = img.alt || 'Product';
    img.src = this.getPlaceholderImage(productName, 'General');
  }

  // Method for generating an attractive placeholder image
  getPlaceholderImage(productName: string, category: string): string {
    const encodedName = encodeURIComponent(productName);
    const colors = ['4CAF50', '2196F3', 'FF9800', '9C27B0', 'F44336', '00BCD4'];
    const colorIndex = productName.length % colors.length;
    const bgColor = colors[colorIndex];

    const placeholderUrl = `https://via.placeholder.com/300x200/${bgColor}/FFFFFF?text=${encodedName}`;

    return placeholderUrl;
  }

  // Helper method to get the product category name
  getProductCategory(product: Product): string {
    const productWithCategory = product as any;
    return (
      productWithCategory.categoryName ||
      productWithCategory.category ||
      'Uncategorized'
    );
  }

  // Shopping cart methods
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get isAdmin(): boolean {
    const user = this.currentUser;
    return user ? user.role.toLowerCase() === 'admin' : false;
  }

  get isUser(): boolean {
    const user = this.currentUser;
    return user ? user.role.toLowerCase() === 'user' : false;
  }

  addToCart(product: Product): void {
    if (!this.isAuthenticated) {
      alert('You must be logged in to add products to your cart');
      return;
    }

    // Check stock before adding
    const productStock = (product as any).stock;
    if (productStock <= 0) {
      alert('This product is currently out of stock.');
      return;
    }

    // Use the appropriate shopping cart service
    this.cartService.addToCart(product.id.toString(), 1).subscribe({
      next: (cart) => {
        // Update the product stock locally
        this.updateProductStockLocally(Number(product.id), -1);
      },
      error: (error) => {
        console.error('❌ ERROR adding to cart:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error,
        });
        alert('Error adding product to cart');
      },
    });
  }

  // Method to update stock locally without reloading the entire page
  private updateProductStockLocally(
    productId: number,
    stockChange: number
  ): void {
    const productIndex = this.products.findIndex(
      (p) => Number(p.id) === productId
    );
    if (productIndex !== -1) {
      const product = this.products[productIndex] as any;
      if (product.stock !== undefined && product.stock !== null) {
        const oldStock = product.stock;
        product.stock = Math.max(0, product.stock + stockChange);

        // Create a new array reference to force change detection
        this.products = [...this.products];
      } else {
        console.warn(
          `⚠️ Product ${productId} It does not have a defined stock property.`
        );
        // Try reloading the products to get the updated stock.
        this.loadData();
      }
    } else {
      console.warn(`⚠️ Product with ID ${productId} not found in the list`);
    }
  }

  isProductInCart(productId: string | number): boolean {
    return this.cartService.isProductInCart(productId.toString());
  }

  getCartItemCount(): number {
    return this.cartService.getTotalItems();
  }

  getProductQuantityInCart(productId: string | number): number {
    return this.cartService.getProductQuantityInCart(productId.toString());
  }

  logout(): void {
    this.authService.logout();
  }
}
