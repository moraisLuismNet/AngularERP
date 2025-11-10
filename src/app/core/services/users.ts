import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';

export interface UserDTO {
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private apiService: ApiService) {}

  // Get all users (administrators only)
  getUsers(): Observable<UserDTO[]> {
    return this.apiService.users.get<UserDTO[]>('api/users');
  }

  // Get administrator users
  getAdminUsers(): Observable<UserDTO[]> {
    return new Observable((observer) => {
      this.getUsers().subscribe({
        next: (users) => {
          const adminUsers = users.filter(
            (user) => user.role.toLowerCase() === 'admin'
          );
          observer.next(adminUsers);
          observer.complete();
        },
        error: (error) => observer.error(error),
      });
    });
  }
}
