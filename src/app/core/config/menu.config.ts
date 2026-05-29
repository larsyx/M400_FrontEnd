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
        icon: 'sliders',
        roles: [UserRole.MIXER]
    },
    {
        label: 'DCA',
        route: '/app/mixer/dca',
        icon: 'grid-3x3',
        roles: [UserRole.MIXER]
    },
    {
        label: 'Home',
        route: '/app/video/home',
        icon: 'house-door',
        roles: [UserRole.VIDEO]
    },
    {
        label: 'Dashboard',
        route: '/app/admin/dashboard',
        icon: 'speedometer2',
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
        icon: 'collection',
        roles: [UserRole.ADMIN, UserRole.MIXER]
    },    
    {
        label: 'Scene',
        route: '/app/user/scene',
        icon: 'collection',
        roles: [UserRole.USER]
    },
    {
        label: 'Mixer',
        route: '/app/user/home',
        icon: 'sliders',
        roles: [UserRole.USER]
    }
];