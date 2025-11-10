import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verify if you are authenticated
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    authService.setReturnUrl(state.url);
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Check if it's admin
  const currentUser = authService.getCurrentUser();

  if (currentUser && currentUser.role.toLowerCase() === 'admin') {
    return true;
  } else {
    // If not admin, redirect to the homepage
    router.navigate(['/']);
    return false;
  }
};
