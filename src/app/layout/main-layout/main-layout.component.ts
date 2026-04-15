import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterModule, 
    FormsModule,
    NzIconModule, 
    NzMenuModule, 
    NzInputModule, 
    NzMessageModule
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

  constructor(
    private authService: AuthService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.role = user.role.toLowerCase() as any;
        this.userName = user.name;
      }
    });
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

