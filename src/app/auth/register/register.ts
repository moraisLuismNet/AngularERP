import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth';
import { HttpErrorResponse } from '@angular/common/http';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  credentials: RegisterRequest = {
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  };
  confirmPassword = '';
  loading = false;
  error = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    if (this.credentials.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    if (!this.credentials.email || !this.credentials.password || !this.credentials.name) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register(this.credentials).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;
        // Redirect to login page with success message
        this.router.navigate(['/login'], { 
          queryParams: { registered: 'true' } 
        });
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.error = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
