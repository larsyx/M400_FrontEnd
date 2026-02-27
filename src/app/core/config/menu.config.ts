import { UserRole } from "../models/user.model";

export interface MenuItem{
    label: string;
    route: string;
    icon?: string;
    roles: UserRole[];
}

export const MENU_ITEMS: MenuItem[] = [
    {
        label: 'Fader',
        route: '/app/mixer/home',
        icon: 'home',
        roles: [UserRole.MIXER]
    },
    {
        label: 'DCA',
        route: '/app/mixer/dca',
        icon: 'dca',
        roles: [UserRole.MIXER]
    },
    {
        label: 'Home',
        route: '/app/video/home',
        icon: 'home',
        roles: [UserRole.VIDEO]
    },
    {
        label: 'Home',
        route: '/app/user/home',
        icon: 'home',
        roles: [UserRole.USER]
    },
    {
        label: 'Dashboard',
        route: '/app/admin/dashboard',
        icon: 'dashboard',
        roles: [UserRole.ADMIN]
    },
    {
        label: 'Utenti',
        route: '/app/admin/users',
        icon: 'people',
        roles: [UserRole.ADMIN]
    },
    {
        label: 'Scene',
        route: '/app/mixer/scene',
        icon: 'people',
        roles: [UserRole.ADMIN, UserRole.MIXER]
    },
    {
        label: 'Profili',
        route: '/app/user/profile',
        icon: 'assessment',
        roles: [UserRole.USER]
    }
];