import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Do not add tokens to login requests
  if (req.url.includes("/auth/login")) {
    return next(req);
  }

  // Add JWT token to all other requests
  if (token && authService.isTokenValid()) {
    const authReq = req.clone({
      headers: req.headers.set("Authorization", `Bearer ${token}`),
    });
    return next(authReq);
  }

  return next(req);
};
