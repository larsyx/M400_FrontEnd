import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/login/login';
import { LayoutComponent } from './core/layout/layout';
import { UserRole } from './core/models/user.model';
import { roleGuard } from './core/auth/role.guard';
import { canDeactivateGuard } from './core/auth/can-deactivate.guard';
import { SCENE_SERVICE } from './core/services/scene.service.interface';
import { MixerSceneService } from './core/services/mixer-scene.service';
import { UserSceneService } from './core/services/user-scene.service';

const loadHomePage = () => import('./features/mixer/home-page/home-page')
                .then(m => m.HomePageComponent);

const loadDcaPage = () => import('./features/mixer/pages/dca/dca')
                .then(m => m.Dca);

const loadMixerChannels = () => import('./features/mixer/channels/channels-mixer')
                .then(m => m.MixerChannelsComponent);

const loadScenesPage = () => import('./shared/scenes/scenes')
                .then(m => m.ScenesComponent);

const loadProfilePage = () => import('./features/profile/profile')
                .then(m => m.ProfileComponent);

const loadUserHomePage = () => import('./features/user/home-user/home-user')
                .then(m => m.HomeUserComponent);

const loadUserLayoutPage = () => import('./features/user/layout-user/layout-user')
                .then(m => m.LayoutUserComponent);

const loadAdminDashboard = () => import('./features/admin/dashboard/dashboard')
                .then(m => m.AdminDashboardComponent);

const loadAdminChannels = () => import('./features/admin/channels/channels-admin')
                .then(m => m.AdminChannelsComponent);

const loadAdminScenesList = () => import('./features/admin/scenes/scenes-admin')
                .then(m => m.AdminScenesComponent);

const loadAdminSceneDetail = () => import('./features/admin/scenes/scene-detail/scene-detail')
                .then(m => m.AdminSceneDetailComponent);

const loadAdminLayout = () => import('./features/admin/layout/layout-admin')
                .then(m => m.AdminLayoutComponent);

const loadAdminUsers = () => import('./features/admin/users/users-admin')
                .then(m => m.AdminUsersComponent);

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
                    { path: 'dashboard',  loadComponent: loadAdminDashboard },
                    { path: 'channels',   loadComponent: loadAdminChannels },
                    { path: 'scenes',     loadComponent: loadAdminScenesList },
                    { path: 'scenes/:id', loadComponent: loadAdminSceneDetail, canDeactivate: [canDeactivateGuard] },
                    { path: 'layout',     loadComponent: loadAdminLayout },
                    { path: 'users',      loadComponent: loadAdminUsers }
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
                        'path' : 'channels',
                        loadComponent : loadMixerChannels
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
