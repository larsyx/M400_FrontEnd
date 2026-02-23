import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { UserRole } from "../models/user.model";

export const roleGuard: CanActivateFn = (routes: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const requiredRoles = routes.data['roles'] as UserRole[];

    if (!requiredRoles || requiredRoles.length === 0) {
        return true;
    }

    if (authService.hasRole(requiredRoles)) {
        return true;
    }

    console.warn('Accesso negato: ruolo insufficiente');
    router.navigate(['/login']); 
    return false;
}