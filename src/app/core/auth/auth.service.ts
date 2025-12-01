// core/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private cookieName = 'access_token';

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) {}

  // LOGIN: chiama il backend, riceve un JWT e lo salva in un cookie
  login(username: string) {
    return this.http.post<any>('https://api.mysite.com/auth/login', {
      username
    }).pipe(
      tap((res) => {
        this.cookieService.set(this.cookieName, res.token, {
          path: '/',
          secure: true,
          sameSite: 'Strict'
        });
      })
    );
  }

  // Restituisce il token
  getToken(): string | null {
    return this.cookieService.get(this.cookieName) || null;
  }

  // Logout: elimina cookie
  logout() {
    this.cookieService.delete(this.cookieName, '/');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}