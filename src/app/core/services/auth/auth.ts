import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

import { environment } from '../../../../environments/environment';

// Use the users microservice URL from environment
const AUTH_API = `${environment.microservices.users}/api/auth/`;

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  withCredentials: true
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private returnUrl: string = '/';

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<any>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${AUTH_API}login`,
      credentials,
      httpOptions
    ).pipe(
      map(response => {
        if (response && response.accessToken) {
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }
        return response;
      })
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${AUTH_API}register`,
      userData,
      httpOptions
    );
  }

  logout() {
    // Remove user from local storage and set current user to null
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    return user && user.accessToken ? true : false;
  }

  getToken(): string {
    const user = this.currentUserValue;
    return user ? user.accessToken : '';
  }

  getUserRole(): string {
    const user = this.currentUserValue;
    return user && user.user ? user.user.role : '';
  }

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
