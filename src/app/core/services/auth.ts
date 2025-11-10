import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private returnUrl: string = '/';

  constructor(private apiService: ApiService, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        // Verify that the token is valid before loading the user
        if (this.isTokenValid()) {
          this.currentUserSubject.next(JSON.parse(user));
        } else {
          // Invalid token, clear storage
          this.clearInvalidToken();
        }
      } catch (error) {
        console.error('Error Loading user from storage:', error);
        this.clearInvalidToken();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Call the user microservice directly
    return new Observable((observer) => {
      this.apiService.users
        .post<AuthResponse>('api/auth/login', credentials)
        .subscribe({
          next: (response: any) => {
            // Handle different backend response formats
            let user: User;
            let token: string;

            if (response.user) {
              // Expected format: { token, user: {...} }
              user = response.user;
              token = response.token;
            } else {
              // Current backend format: { token, email, role, expiresAt }
              user = {
                id: response.id || '1',
                username: response.email,
                email: response.email,
                name: response.email.split('@')[0], // Use part before the @ like name
                role: response.role,
              };
              token = response.token;
            }

            // Save JWT token and user data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            this.currentUserSubject.next(user);

            // Create standardized response
            const normalizedResponse: AuthResponse = { token, user };
            observer.next(normalizedResponse);
            observer.complete();
          },
          error: (error) => {
            console.error('Authentication error:', error);
            observer.error(error);
          },
        });
    });
  }

  // Method to obtain the current token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Method to verify if the token is valid (not expired)
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Verify that the token is in JWT format (3 parts separated by periods)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Token does not have a valid JWT format');
        return false;
      }

      // Attempt to decode the payload (second part of the JWT)
      const payload = JSON.parse(atob(parts[1]));

      // Check if it has an expiration field
      if (!payload.exp) {
        console.warn('Token does not have an expiration field');
        // If it doesn't have an expiration date, consider it valid for now
        return true;
      }

      // Check expiration
      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = payload.exp > currentTime;

      if (!isValid) {
        console.warn('Expired token');
      }

      return isValid;
    } catch (error) {
      console.error('Error decoding token:', error);
      // If there is an error decoding, clear the invalid token
      this.clearInvalidToken();
      return false;
    }
  }

  // Method for clearing invalid tokens
  private clearInvalidToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  // Method to refresh the token if necessary
  refreshTokenIfNeeded(): Observable<boolean> {
    return new Observable((observer) => {
      if (this.isTokenValid()) {
        observer.next(true);
        observer.complete();
      } else {
        // Token expired, clear and redirect to login
        this.logout();
        observer.next(false);
        observer.complete();
      }
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // If the token is invalid, clear and return false
    if (!this.isTokenValid()) {
      return false;
    }

    return true;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Methods for handling return URLs
  setReturnUrl(url: string): void {
    this.returnUrl = url;
  }

  getReturnUrl(): string {
    return this.returnUrl;
  }

  clearReturnUrl(): void {
    this.returnUrl = '/';
  }
}
