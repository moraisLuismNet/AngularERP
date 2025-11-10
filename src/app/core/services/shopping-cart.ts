import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api';
import { AuthService } from './auth';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  stock: number;
}

export interface Cart {
  id?: number;
  userId: string;
  items: CartItem[];
  totalAmount: number;
}

export interface CartResponse {
  id: number;
  email: string;
  items: CartItemResponse[];
  totalAmount: number;
}

export interface CartItemResponse {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  stock: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class ShoppingCartService {
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    // Load cart when user authenticates
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.loadCart();
      } else {
        this.clearCart();
      }
    });
  }

  // Load user cart from the backend
  loadCart(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Only users with the 'user' role can add items to their cart, not admins.
    if (user.role.toLowerCase() !== 'user') {
      console.log(
        '🛒 User is not "user", not loading cart for:',
        user.role
      );
      return;
    }

    const userEmail = user.email || user.username;
    this.apiService.shopping
      .get<CartResponse>(`api/carts/email/${userEmail}`)
      .subscribe({
        next: (response) => {
          // Convert the API response to our Cart interface
          const cart: Cart = {
            id: response.id,
            userId: response.email,
            items: response.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              price: item.price,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
              stock: item.stock,
            })),
            totalAmount: response.totalAmount,
          };
          this.cartSubject.next(cart);
        },
        error: (error) => {
          console.error('❌ Error loading cart:', error);
          // If no cart exists, create an empty one.
          this.createEmptyCart();
        },
      });
  }

  // Create empty cart
  private createEmptyCart(): void {
    const user = this.authService.getCurrentUser();
    if (!user || user.role.toLowerCase() !== 'user') return;

    const emptyCart: Cart = {
      userId: user.id,
      items: [],
      totalAmount: 0,
    };

    this.cartSubject.next(emptyCart);
  }

  // Add product to cart
  addToCart(productId: string, quantity: number = 1): Observable<Cart> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Unauthenticated user');
    }

    const userEmail = user.email || user.username;
    const request: AddToCartRequest = {
      productId,
      quantity,
    };

    return new Observable((observer) => {
      this.apiService.shopping
        .post<CartResponse>(
          `api/cartdetails/addToCartDetailAndCart/${userEmail}`,
          request
        )
        .subscribe({
          next: (response) => {
            // Convert the API response to our Cart interface
            const cart: Cart = {
              id: response.id,
              userId: response.email,
              items: response.items.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl,
                stock: item.stock,
              })),
              totalAmount: response.totalAmount,
            };
            this.cartSubject.next(cart);
            observer.next(cart);
            observer.complete();
          },
          error: (error) => {
            console.error('Error adding to cart:', error);
            observer.error(error);
          },
        });
    });
  }

  // Update quantity of an item in the cart
  updateCartItem(productId: string, quantity: number): Observable<Cart> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Unauthenticated user');
    }

    const userEmail = user.email || user.username;
    const currentCart = this.getCurrentCart();
    if (!currentCart) {
      throw new Error('No cart available');
    }

    const currentItem = currentCart.items.find(
      (item) => item.productId === productId
    );
    if (!currentItem) {
      throw new Error('Product not found in cart');
    }

    return new Observable((observer) => {
      if (quantity === 0) {
        // If quantity is 0, remove the item completely
        this.removeFromCart(productId).subscribe({
          next: (cart) => {
            observer.next(cart);
            observer.complete();
          },
          error: (error) => observer.error(error),
        });
      } else if (quantity > currentItem.quantity) {
        // Add the difference
        const difference = quantity - currentItem.quantity;
        this.addToCart(productId, difference).subscribe({
          next: (cart) => {
            observer.next(cart);
            observer.complete();
          },
          error: (error) => observer.error(error),
        });
      } else if (quantity < currentItem.quantity) {
        // Remove the difference
        const difference = currentItem.quantity - quantity;
        this.apiService.shopping
          .post<any>(
            `api/cartdetails/removeFromCartDetailAndCart/${userEmail}?productId=${productId}&amount=${difference}`,
            {}
          )
          .subscribe({
            next: () => {
              // Reload the cart after removal
              this.loadCart();
              const updatedCart = this.getCurrentCart();
              if (updatedCart) {
                observer.next(updatedCart);
              }
              observer.complete();
            },
            error: (error) => {
              console.error('Error updating cart item:', error);
              observer.error(error);
            },
          });
      } else {
        // Quantity is the same, no change needed
        observer.next(currentCart);
        observer.complete();
      }
    });
  }

  // Remover item del carrito
  removeFromCart(productId: string): Observable<Cart> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Unauthenticated user');
    }

    const userEmail = user.email || user.username;
    const currentCart = this.getCurrentCart();
    if (!currentCart) {
      throw new Error('No cart available');
    }

    const currentItem = currentCart.items.find(
      (item) => item.productId === productId
    );
    if (!currentItem) {
      throw new Error('Product not found in cart');
    }

    return new Observable((observer) => {
      this.apiService.shopping
        .post<any>(
          `api/cartdetails/removeFromCartDetailAndCart/${userEmail}?productId=${productId}&amount=${currentItem.quantity}`,
          {}
        )
        .subscribe({
          next: () => {
            // Reload the cart after removal
            this.loadCart();
            const updatedCart = this.getCurrentCart();
            if (updatedCart) {
              observer.next(updatedCart);
            }
            observer.complete();
          },
          error: (error) => {
            console.error('Error removing from cart:', error);
            observer.error(error);
          },
        });
    });
  }

  // Clear cart
  clearCart(): void {
    this.cartSubject.next(null);
  }

  // Get current cart
  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  // Get total number of items in cart
  getTotalItems(): number {
    const cart = this.getCurrentCart();
    if (!cart || !cart.items) return 0;

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Check if a product is in the cart
  isProductInCart(productId: string): boolean {
    const cart = this.getCurrentCart();
    if (!cart || !cart.items) return false;

    return cart.items.some((item) => item.productId === productId);
  }

  // Get quantity of a specific product in the cart
  getProductQuantityInCart(productId: string): number {
    const cart = this.getCurrentCart();
    if (!cart || !cart.items) return 0;

    const item = cart.items.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
  }
}
