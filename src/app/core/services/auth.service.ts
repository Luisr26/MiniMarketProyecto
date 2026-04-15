import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserSession {
  email: string;
  role: 'admin' | 'bodeguero' | 'cajero';
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private SESSION_KEY = 'mm_session';
  private currentUserSubject: BehaviorSubject<UserSession | null>;
  public currentUser$: Observable<UserSession | null>;

  constructor(private router: Router) {
    const savedSession = localStorage.getItem(this.SESSION_KEY);
    this.currentUserSubject = new BehaviorSubject<UserSession | null>(
      savedSession ? JSON.parse(savedSession) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserSession | null {
    return this.currentUserSubject.value;
  }

  login(email: string, pass: string): boolean {
    let session: UserSession | null = null;

    if (email === 'admin@medialuna.com' && pass === 'admin123') {
      session = { email, role: 'admin', name: 'Ricardo Mendoza' };
    } else if (email === 'bodega@medialuna.com' && pass === 'bodega123') {
      session = { email, role: 'bodeguero', name: 'Elena Garcés' };
    } else if (email === 'cajero@medialuna.com' && pass === 'cajero123') {
      session = { email, role: 'cajero', name: 'Roberto Méndez' };
    }

    if (session) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      this.currentUserSubject.next(session);
      
      // Initial redirect
      if (session.role === 'admin') this.router.navigate(['/admin']);
      else if (session.role === 'bodeguero') this.router.navigate(['/bodeguero']);
      else this.router.navigate(['/admin/pos']); // Default for cajero

      return true;
    }

    return false;
  }

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }
}
