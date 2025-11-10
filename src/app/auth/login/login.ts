import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService, LoginRequest } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  credentials: LoginRequest = {
    email: '',
    password: '',
  };

  loading = false;
  error = '';
  returnUrl = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  successMessage: string = '';

  ngOnInit(): void {
    // Get the return URL from the query parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.authService.setReturnUrl(this.returnUrl);

    // Check for registration success message
    if (this.route.snapshot.queryParams['registered'] === 'true') {
      this.successMessage = 'Registration successful! Please log in with your credentials.';
    }

    // If already authenticated, redirect to the return URL
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.error = 'Please enter your email and password';
      return;
    }

    this.loading = true;
    this.error = '';

    // Attempt real login with the microservice
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.loading = false;

        // Redirect based on user role
        const user = response.user;
        const returnUrl = this.authService.getReturnUrl();
        let redirectUrl = '/';

        if (user.role.toLowerCase() === 'admin') {
          // Admin goes to dashboard by default, unless there is a specific URL
          if (returnUrl && returnUrl !== '/' && returnUrl !== '/login') {
            redirectUrl = returnUrl;
          } else {
            redirectUrl = '/dashboard';
          }
        } else if (user.role.toLowerCase() === 'user') {
          // User stays on the home page
          redirectUrl = '/';
        } else {
          // Unknown role, redirect to home for security
          redirectUrl = '/';
        }

        this.authService.clearReturnUrl();

        // For admin, use window.location.replace to force navigation
        if (user.role.toLowerCase() === 'admin') {
          window.location.replace(redirectUrl);
        } else {
          // For user, use normal navigation
          this.router.navigate([redirectUrl]).then((success) => {
            if (!success) {
              window.location.href = redirectUrl;
            }
          });
        }
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.error = 'Incorrect credentials';
        } else if (error.status === 0) {
          this.error =
            'Unable to connect to the server. Verify that the user microservice is running.';
        } else {
          this.error = 'Connection error. Please try again.';
        }
        console.error('Login error:', error);
      },
    });
  }
}
