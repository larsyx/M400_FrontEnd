import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/login/login';
import { LayoutComponent } from './core/layout/layout';
import { UserRole } from './core/models/user.model';
import { roleGuard } from './core/auth/role.guard';
import path from 'path';

const loadHomePage = () => import('./features/home/pages/home-page/home-page')
                .then(m => m.HomePageComponent)

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: 'app',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'admin',
                canActivate: [roleGuard],
                data : { roles: [UserRole.ADMIN] },
                children: [
                    {
                        'path' : 'dashboard',
                        loadComponent: loadHomePage
                    }
                ]
            },
            {
                path: 'mixer',
                canActivate: [roleGuard],
                data : { roles: [UserRole.ADMIN, UserRole.MIXER] },
                children: [
                    {
                        'path' : 'home',
                        loadComponent: loadHomePage
                    }
                ]
            },
            {
                path: 'video',
                canActivate: [roleGuard],
                data : { roles: [UserRole.ADMIN, UserRole.MIXER, UserRole.VIDEO] },
                children: [
                    {
                        'path' : 'home',
                        loadComponent: loadHomePage
                    }
                ]
            },
            {
                path: 'user',
                loadComponent: loadHomePage,
                canActivate: [roleGuard],
                data : { roles: [UserRole.ADMIN, UserRole.USER] },
                children: [
                    {
                        'path' : 'home',
                        loadComponent: loadHomePage
                    }
                ]
            }
        ]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
