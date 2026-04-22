import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, debounceTime, distinctUntilChanged, switchMap, of, Observable, Subject, Subscription } from 'rxjs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';
import { GlobalSearchService, SearchResult } from '../../core/services/global-search.service';

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
    NzInputModule,
    NzDropDownModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  providers: [NzMessageService]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  role: 'admin' | 'bodeguero' | 'cajero' | 'qa' = 'admin';
  simulatedRole: 'admin' | 'bodeguero' | 'cajero' = 'admin';
  userName = 'User';
  searchQuery = '';
  isDashboard = true;
  isSearchLoading = false;
  
  searchResults$: Observable<SearchResult[]> = of([]);
  isSearchVisible = false;

  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private storageService: StorageService,
    private searchService: GlobalSearchService,
    private message: NzMessageService,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to user data
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.role = user.role.toLowerCase() as any;
          this.userName = user.name;
          if (this.role !== 'qa') {
            this.simulatedRole = this.role as any;
          }
        }
      })
    );

    // Check routing for aesthetic states
    this.checkDashboard(this.router.url);
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        this.checkDashboard(event.urlAfterRedirects);
        this.isSearchVisible = false;
      })
    );

    // Setup search stream with debounce and distinctUntilChanged
    this.subscriptions.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (!query.trim()) {
            return of([]);
          }
          this.isSearchLoading = true;
          return this.searchService.search(query);
        })
      ).subscribe(results => {
        this.searchResults$ = of(results);
        this.isSearchLoading = false;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.searchSubject.complete();
  }

  onGlobalSearchChange(query: string) {
    if (!query.trim()) {
      this.searchResults$ = of([]);
      this.isSearchVisible = false;
      return;
    }
    this.isSearchVisible = true;
    this.searchSubject.next(query);
  }

  goToResult(result: SearchResult) {
    this.router.navigate([result.route]);
    this.searchQuery = '';
    this.isSearchVisible = false;
    this.searchResults$ = of([]);
  }

  private checkDashboard(url: string) {
    const cleanUrl = url.split('?')[0];
    this.isDashboard = cleanUrl === '/admin' || cleanUrl === '/admin/' || 
                      cleanUrl === '/bodeguero' || cleanUrl === '/bodeguero/';
  }

  logout() {
    this.authService.logout();
  }

  showNotifications() {
    this.message.info('No hay notificaciones pendientes.');
  }

  switchSimulatedRole(newRole: 'admin' | 'bodeguero' | 'cajero') {
    this.simulatedRole = newRole;
    this.message.success(`Cambiado a vista de ${newRole.toUpperCase()}`);
  }
}

