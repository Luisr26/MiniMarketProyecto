import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

export interface UserSession {
  id?: number;
  email: string;
  role: 'admin' | 'bodeguero' | 'cajero' | 'qa';
  name: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private SESSION_KEY = 'mm_session';
  private TOKEN_KEY = 'mm_token';
  private currentUserSubject: BehaviorSubject<UserSession | null>;
  public currentUser$: Observable<UserSession | null>;

  constructor(
    private router: Router, 
    private apiService: ApiService,
    private storageService: StorageService
  ) {
    const savedSession = localStorage.getItem(this.SESSION_KEY);
    this.currentUserSubject = new BehaviorSubject<UserSession | null>(
      savedSession ? JSON.parse(savedSession) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserSession | null {
    return this.currentUserSubject.value;
  }

  /**
   * Login via API backend
   * Falls back to local credentials if API is unavailable
   */
  login(email: string, pass: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.apiService.login(email, pass).subscribe(
        (response) => {
          if (response.success && response.data) {
            const userData = response.data.user || response.data;
            const token = response.data.token;

            // Map API role to local role format
            let role: 'admin' | 'bodeguero' | 'cajero' | 'qa' = 'cajero';
            const apiRole = (userData.role || userData.rol || '').toUpperCase();
            if (apiRole === 'ADMIN' || apiRole === 'ADMINISTRADOR') role = 'admin';
            else if (apiRole === 'BODEGUERO') role = 'bodeguero';
            else if (apiRole === 'CAJERO') role = 'cajero';
            else if (apiRole === 'QA') role = 'qa';

            const session: UserSession = {
              id: userData.id,
              email: userData.correo || email,
              role,
              name: userData.nombre_completo || userData.nombre || email.split('@')[0],
              token
            };

            // Store token and session
            if (token) localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            this.currentUserSubject.next(session);

            // Navigate based on role
            if (session.role === 'admin' || session.role === 'qa') {
              this.router.navigate(['/admin']);
            } else if (session.role === 'bodeguero') {
              this.router.navigate(['/bodeguero']);
            } else {
              this.router.navigate(['/admin/pos']);
            }
            
            // Sync with API on login
            this.storageService.reloadFromApi();

            resolve(true);
          } else {
            // API returned error — try local fallback
            const localResult = this.localLogin(email, pass);
            resolve(localResult);
          }
        },
        () => {
          // Network error — try local fallback
          const localResult = this.localLogin(email, pass);
          resolve(localResult);
        }
      );
    });
  }

  /**
   * Fallback local login for development/offline mode
   */
  public localLogin(email: string, pass: string): boolean {
    let session: UserSession | null = null;

    if (email === 'admin@medialuna.com' && (pass === 'admin123' || pass === 'admin1234')) {
      session = { email, role: 'admin', name: 'Ricardo Mendoza' };
    } else if (email === 'bodega@medialuna.com' && (pass === 'bodega123' || pass === 'bodega1234')) {
      session = { email, role: 'bodeguero', name: 'Elena Garcés' };
    } else if (email === 'cajero@medialuna.com' && (pass === 'cajero123' || pass === 'cajero1234')) {
      session = { email, role: 'cajero', name: 'Roberto Méndez' };
    } else if (email === 'qa@medialuna.com' && (pass === 'qa123' || pass === 'qa1234')) {
      session = { email, role: 'qa', name: 'QA Tester' };
    }

    if (session) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      this.currentUserSubject.next(session);

      if (session.role === 'admin' || session.role === 'qa') {
        this.router.navigate(['/admin']);
      } else if (session.role === 'bodeguero') {
        this.router.navigate(['/bodeguero']);
      } else {
        this.router.navigate(['/admin/pos']);
      }

      // Sync with API on local login
      this.storageService.reloadFromApi();
      return true;
    }

    return false;
  }

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
