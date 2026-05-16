import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/login/login';
import { LayoutComponent } from './core/layout/layout';
import { UserRole } from './core/models/user.model';
import { roleGuard } from './core/auth/role.guard';
import path from 'path';

const loadHomePage = () => import('./features/mixer/home-page/home-page')
                .then(m => m.HomePageComponent);

const loadDcaPage = () => import('./features/mixer/pages/dca/dca')
                .then(m => m.Dca);

const loadProfilePage = () => import('./features/profile/profile')
                .then(m => m.ProfileComponent);

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: 'app',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'profile',
                loadComponent: loadProfilePage
            },
            {
                path: 'admin',
                canActivate: [roleGuard],
                data : { roles: [UserRole.ADMIN] },
                children: [
                    {
                        'path' : 'dashboard',
                        loadComponent: loadHomePage
                    },
                    {
                        'path' : 'users',
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
                    },
                    {
                        'path' : 'dca',
                        loadComponent : loadDcaPage
                    },
                    {
                        'path' : 'scene',
                        loadComponent : loadHomePage
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
