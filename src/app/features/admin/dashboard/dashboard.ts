import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface DashboardCard {
    title: string;
    description: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss'
})
export class AdminDashboardComponent {
    cards: DashboardCard[] = [
        {
            title: 'Gestione Canali',
            description: 'Configura descrizioni, selezione e ordine globale dei canali',
            icon: 'bi-sliders',
            route: '/app/admin/channels'
        },
        {
            title: 'Gestione Scene',
            description: 'Crea, modifica ed elimina le scene e i loro partecipanti',
            icon: 'bi-collection',
            route: '/app/admin/scenes'
        },
        {
            title: 'Layout di Default',
            description: 'Imposta il layout predefinito che viene proposto agli utenti',
            icon: 'bi-layout-text-window',
            route: '/app/admin/layout'
        },
        {
            title: 'Gestione Utenti',
            description: 'Crea, modifica o rimuovi gli utenti del sistema',
            icon: 'bi-people',
            route: '/app/admin/users'
        }
    ];
}
