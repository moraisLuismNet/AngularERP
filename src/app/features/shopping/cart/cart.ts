import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ShoppingCartService,
  Cart,
  CartItem,
} from '../../../core/services/shopping-cart';
import { AuthService } from '../../../core/services/auth';
import { OrdersService } from '../../../core/services/orders';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = false;
  error = '';
  processingCheckout = false;
  checkoutSuccess = false;
  checkoutMessage = '';

  constructor(
    private cartService: ShoppingCartService,
    private authService: AuthService,
    private ordersService: OrdersService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.cartService.cart$.subscribe({
      next: (cart) => {
        this.cart = cart;
        this.loading = false;
        this.error = '';
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.loading = false;
        this.error = 'Error loading cart';
      },
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.loading = true;
    this.cartService.updateCartItem(productId, quantity).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
        this.loading = false;
        this.error = 'Error updating the quantity';
      },
    });
  }

  removeItem(productId: string): void {
    this.loading = true;
    this.cartService.removeFromCart(productId).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error removing item:', error);
        this.loading = false;
        this.error = 'Error removing the product';
      },
    });
  }

  increaseQuantity(item: CartItem): void {
    if (item.quantity < item.stock) {
      this.updateQuantity(item.productId, item.quantity + 1);
    }
  }

  decreaseQuantity(item: CartItem): void {
    this.updateQuantity(item.productId, item.quantity - 1);
  }

  getTotalItems(): number {
    return this.cartService.getTotalItems();
  }

  continueShopping(): void {
    // Redirect to the main page
    window.location.href = '/';
  }

  proceedToCheckout(): void {
    if (!this.isAuthenticated) {
      this.error = 'You must log in to proceed with payment';
      return;
    }

    const userEmail = this.authService.getCurrentUser()?.email;
    if (!userEmail) {
      this.error = "The user's email address could not be obtained";
      return;
    }

    this.processingCheckout = true;
    this.error = '';
    this.checkoutSuccess = false;

    this.ordersService.createOrderFromCart(userEmail).subscribe({
      next: (response) => {
        this.processingCheckout = false;
        this.checkoutSuccess = true;
        this.checkoutMessage = `Order created successfully! Total: ${response.total.toFixed(
          2
        )} €`;

        // Clear the cart after creating the order
        this.cartService.clearCart();
      },
      error: (error) => {
        console.error('Error creating order:', error);
        this.processingCheckout = false;
        this.checkoutSuccess = false;

        // Specific message depending on the type of error
        if (error.status === 401) {
          this.error = 'Unauthorized. Please log in again.';
        } else if (error.status === 400) {
          this.error =
            error.error?.message ||
            'Order details error. Please check your cart.';
        } else if (error.status === 404) {
          this.error =
            'Cart not found. Please add items before proceeding to checkout.';
        } else if (error.status === 500) {
          this.error = 'Internal server error. Please try again later.';
        } else {
          this.error =
            error.error?.message ||
            'Error processing order. Please try again.';
        }
      },
    });
  }

  get isEmpty(): boolean {
    return !this.cart || !this.cart.items || this.cart.items.length === 0;
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
