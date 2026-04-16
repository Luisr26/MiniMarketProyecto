import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterModule, 
    RouterLink,
    RouterLinkActive,
    FormsModule,
    NzIconModule, 
    NzMenuModule, 
    NzInputModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  providers: [NzMessageService]
})
export class MainLayoutComponent implements OnInit {
  isCollapsed = false;
  role: 'admin' | 'bodeguero' | 'cajero' = 'admin';
  userName = 'User';
  searchQuery = '';
  isDashboard = true;

  constructor(
    private authService: AuthService,
    private message: NzMessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.role = user.role.toLowerCase() as any;
        this.userName = user.name;
      }
    });

    // Initial check
    this.checkDashboard(this.router.url);

    // Track navigation changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkDashboard(event.urlAfterRedirects);
    });
  }

  private checkDashboard(url: string) {
    // Exact dashboard paths for admin and bodeguero
    const cleanUrl = url.split('?')[0]; // Remove query params
    this.isDashboard = cleanUrl === '/admin' || cleanUrl === '/admin/' || 
                      cleanUrl === '/bodeguero' || cleanUrl === '/bodeguero/';
  }

  logout() {
    this.authService.logout();
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.message.loading(`Buscando "${this.searchQuery}" en todo el sistema...`, { nzDuration: 1500 });
      this.searchQuery = '';
    }
  }

  showNotifications() {
    this.message.info('Sincronización de inventario completada correctamente.');
  }
}

