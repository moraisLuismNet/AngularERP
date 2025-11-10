import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/layout/header/header';
import { SidebarComponent } from './shared/layout/sidebar/sidebar';
import { AuthService } from './core/services/auth';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent implements OnInit {
  title = 'AngularERP - Sistema ERP';
  showLayout = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Verify initial authentication status
    this.checkAuthenticationState();

    // Listen for authentication changes
    this.authService.currentUser$.subscribe((user) => {
      const currentUrl = this.router.url;

      // If the user is authenticated and logged in, do not automatically redirect.
      // The login component will handle the redirection.
      if (user && currentUrl === '/login') {
        this.showLayout = false; // Keep without layout until redirection is complete
      }
      // If the user is deauthenticated and is on a protected route, redirect to home.
      else if (!user && this.isProtectedRoute(currentUrl)) {
        this.router.navigate(['/']);
        this.showLayout = false;
      }
      // Update layout visibility
      else {
        this.showLayout = !!user && !this.isPublicRoute(currentUrl);
      }
    });

    // Listen for route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateLayoutVisibility(event.url);
      });
  }

  private checkAuthenticationState(): void {
    const isAuthenticated = this.authService.isAuthenticated();
    const currentUrl = this.router.url;

    if (isAuthenticated && currentUrl === '/login') {
      // Authenticated user login, redirect to return URL
      const returnUrl = this.authService.getReturnUrl();
      this.authService.clearReturnUrl();
      this.router.navigate([returnUrl]);
      this.showLayout = returnUrl !== '/' && !this.isPublicRoute(returnUrl);
    } else if (!isAuthenticated && this.isProtectedRoute(currentUrl)) {
      // Unauthenticated user on protected path, redirect to login
      this.router.navigate(['/login']);
      this.showLayout = false;
    } else {
      // Normal state - allow access to the main page
      this.showLayout = isAuthenticated && !this.isPublicRoute(currentUrl);
    }
  }

  private isProtectedRoute(url: string): boolean {
    const protectedRoutes = [
      '/dashboard',
      '/inventory',
      '/sales',
      '/customers',
      '/reports',
    ];
    return protectedRoutes.some((route) => url.startsWith(route));
  }

  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/', '/login', '/shopping/cart'];
    return publicRoutes.includes(url);
  }

  private updateLayoutVisibility(url: string): void {
    this.showLayout =
      this.authService.isAuthenticated() && !this.isPublicRoute(url);
  }
}
