import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shopping-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="shopping-layout">
      <h2>Compras</h2>
      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .shopping-layout {
      padding: 1rem;
    }
    h2 {
      margin-bottom: 1.5rem;
      color: #333;
    }
  `]
})
export class ShoppingLayoutComponent {}
