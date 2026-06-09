import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/login/login';
import { LayoutComponent } from './core/layout/layout';
import { UserRole } from './core/models/user.model';
import { roleGuard } from './core/auth/role.guard';
import path from 'path';
import { SCENE_SERVICE } from './core/services/scene.service.interface';
import { MixerSceneService } from './core/services/mixer-scene.service';
import { UserSceneService } from './core/services/user-scene.service';

const loadHomePage = () => import('./features/mixer/home-page/home-page')
                .then(m => m.HomePageComponent);

const loadDcaPage = () => import('./features/mixer/pages/dca/dca')
                .then(m => m.Dca);

const loadScenesPage = () => import('./shared/scenes/scenes')
                .then(m => m.ScenesComponent);

const loadProfilePage = () => import('./features/profile/profile')
                .then(m => m.ProfileComponent);

const loadUserHomePage = () => import('./features/user/home-user/home-user')
                .then(m => m.HomeUserComponent);

const loadUserLayoutPage = () => import('./features/user/layout-user/layout-user')
                .then(m => m.LayoutUserComponent);

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
                        loadComponent : loadScenesPage,
                        providers: [
                            { provide: SCENE_SERVICE, useClass: MixerSceneService }
                        ]
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
                        loadComponent: loadUserHomePage
                    },
                    {
                        'path' : 'scene',
                        loadComponent : loadScenesPage,
                        providers: [
                            { provide: SCENE_SERVICE, useClass: UserSceneService }
                        ]
                    },
                    {
                        'path' : 'layout',
                        loadComponent: loadUserLayoutPage
                    }
                ]
            }
        ]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
