import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  constructor() {}

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: '🏠',
      route: '/dashboard',
    },
    {
      label: 'Manage Inventory',
      icon: '📦',
      route: '/inventory',
      children: [
        { label: 'Products', icon: '🏷️', route: '/inventory/products' },
        { label: 'Categories', icon: '📂', route: '/inventory/categories' },
      ],
    },

    {
      label: 'Customers/Suppliers',
      icon: '👥',
      route: '',
      children: [
        { label: 'Customers', icon: '👤', route: '/customers' },
        { label: 'Suppliers', icon: '🏢', route: '/suppliers' },
      ],
    },
    {
      label: 'View Reports',
      icon: '📊',
      route: '/reports',
      children: [
        { label: 'Sales', icon: '💰', route: '/reports/sales' },
        { label: 'Stock', icon: '📦', route: '/reports/stock' },
      ],
    },
  ];

  expandedItems: Set<string> = new Set();

  toggleExpand(item: MenuItem): void {
    if (item.children) {
      if (this.expandedItems.has(item.label)) {
        this.expandedItems.delete(item.label);
      } else {
        this.expandedItems.add(item.label);
      }
    }
  }

  isExpanded(item: MenuItem): boolean {
    return this.expandedItems.has(item.label);
  }
}
