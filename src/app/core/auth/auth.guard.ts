// core/auth/auth.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Lato server, permettiamo sempre l'accesso per evitare problemi con SSR
  // Il browser gestirà l'autenticazione dopo l'hydration
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Lato browser, verifichiamo l'autenticazione
  if(authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
