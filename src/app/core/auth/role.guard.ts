import { inject, PLATFORM_ID } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { UserRole } from "../models/user.model";
import { isPlatformBrowser } from "@angular/common";

export const roleGuard: CanActivateFn = (routes: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);


    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    const requiredRoles = routes.data['roles'] as UserRole[];

    if (!requiredRoles || requiredRoles.length === 0) {
        return true;
    }

    if (authService.hasRole(requiredRoles)) {
        return true;
    }

    router.navigate(['/login']); 
    return false;
}