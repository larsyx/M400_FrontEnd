// core/auth/auth.service.ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { JwtPayload, User, UserRole } from '../models/user.model';
import { routes } from '../../app.routes';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenName = 'access_token';
  private API_URL = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private routes: Router
  ) {
    this.initializeUser();
  }

  private initializeUser(): void {
    const token = this.getToken();
    if(token && token.length > 0){
      const user = this.decodeToken(token);
      this.currentUserSubject.next(user);
    }
  }

  login(username: string) {
    const formData = new FormData();
    formData.append('username', username);

    return this.http.post<any>(`${this.API_URL}/login`, formData).pipe(
      tap((res) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.tokenName, res);
        }

        const user = this.decodeToken(res);
        if(user){
          this.currentUserSubject.next(user);
        }
        else{
          console.error("impossibile decodicare il token");
        }
      })
    );
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenName) || null;
    }
    return null; // Lato server, nessun token disponibile
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenName);
    }
    this.currentUserSubject.next(null);
    this.routes.navigate(['/login'])
  }

  isAuthenticated(): boolean {
    return !! this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserRole() : UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  hasRole(roles : UserRole[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  isAdmin(): boolean {
    return this.hasRole([UserRole.ADMIN]);
  }


  /**
   * Decodifica il JWT e estrae i dati utente
  */
  private decodeToken(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
      return {
        username: payload.sub,
        role: payload.role
      };
    } catch (error) {
      console.error('Errore nella decodifica del token:', error);
      return null;
    }
  }
}