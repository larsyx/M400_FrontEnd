import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser } from '../../../core/models/admin.user.model';
import { UserRole } from '../../../core/models/user.model';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/custom-select/custom-select';

const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Amministratore',
    [UserRole.MIXER]: 'Mixerista',
    [UserRole.VIDEO]: 'Video',
    [UserRole.USER]:  'Utente'
};

const ROLE_VALUES: UserRole[] = [
    UserRole.ADMIN,
    UserRole.MIXER,
    UserRole.VIDEO,
    UserRole.USER
];

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent],
    templateUrl: './users-admin.html',
    styleUrl: './users-admin.scss'
})
export class AdminUsersComponent implements OnInit {
    users: AdminUser[] = [];

    creating = false;
    newUsername = '';
    newRole: UserRole = UserRole.USER;

    editingUserId: number | null = null;
    editUsername = '';
    editRole: UserRole = UserRole.USER;

    confirmDeleteId: number | null = null;
    error: string | null = null;

    roleOptions: CustomSelectOption[] = ROLE_VALUES.map((role, idx) => ({
        value: idx,
        label: ROLE_LABELS[role]
    }));

    constructor(private adminService: AdminService) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    private loadUsers(): void {
        this.adminService.listUsers().subscribe(users => {
            this.users = [...users].sort((a, b) =>
                a.username.localeCompare(b.username, 'it', { sensitivity: 'base' })
            );
        });
    }

    roleLabel(role: UserRole): string {
        return ROLE_LABELS[role];
    }

    getRoleValue(role: UserRole): number {
        return ROLE_VALUES.indexOf(role);
    }

    private resolveRole(value: number): UserRole {
        return ROLE_VALUES[value] ?? UserRole.USER;
    }

    // ===== Create =====
    startCreate(): void {
        this.creating = true;
        this.newUsername = '';
        this.newRole = UserRole.USER;
        this.cancelEdit();
        this.cancelDelete();
        this.error = null;
    }

    cancelCreate(): void {
        this.creating = false;
        this.newUsername = '';
        this.error = null;
    }

    onNewRoleChange(value: number): void {
        this.newRole = this.resolveRole(value);
    }

    confirmCreate(): void {
        const username = this.newUsername.trim();
        if (!username) return;
        if (this.adminService.isUsernameTaken(username)) {
            this.error = 'Username già in uso';
            return;
        }

        this.adminService.createUser({ username, role: this.newRole }).subscribe({
            next: (created) => {
                this.users = [...this.users, created].sort((a, b) =>
                    a.username.localeCompare(b.username, 'it', { sensitivity: 'base' })
                );
                this.cancelCreate();
            }
        });
    }

    // ===== Edit =====
    startEdit(user: AdminUser): void {
        this.editingUserId = user.id;
        this.editUsername = user.username;
        this.editRole = user.role;
        this.confirmDeleteId = null;
        this.creating = false;
        this.error = null;
    }

    cancelEdit(): void {
        this.editingUserId = null;
        this.editUsername = '';
        this.editRole = UserRole.USER;
        this.error = null;
    }

    onEditRoleChange(value: number): void {
        this.editRole = this.resolveRole(value);
    }

    saveEdit(user: AdminUser): void {
        const username = this.editUsername.trim();
        if (!username) {
            this.cancelEdit();
            return;
        }
        if (this.adminService.isUsernameTaken(username, user.id)) {
            this.error = 'Username già in uso';
            return;
        }

        const updated: AdminUser = { ...user, username, role: this.editRole };
        this.adminService.updateUser(updated).subscribe({
            next: (saved) => {
                const idx = this.users.findIndex(u => u.id === saved.id);
                if (idx >= 0) this.users[idx] = saved;
                this.users = [...this.users].sort((a, b) =>
                    a.username.localeCompare(b.username, 'it', { sensitivity: 'base' })
                );
                this.cancelEdit();
            }
        });
    }

    // ===== Delete =====
    requestDelete(user: AdminUser): void {
        this.confirmDeleteId = user.id;
        this.cancelEdit();
    }

    cancelDelete(): void {
        this.confirmDeleteId = null;
    }

    confirmDelete(user: AdminUser): void {
        this.adminService.deleteUser(user.id).subscribe({
            next: () => {
                this.users = this.users.filter(u => u.id !== user.id);
                this.confirmDeleteId = null;
            }
        });
    }

    roleBadgeClass(role: UserRole): string {
        switch (role) {
            case UserRole.ADMIN: return 'badge-admin';
            case UserRole.MIXER: return 'badge-mixer';
            case UserRole.VIDEO: return 'badge-video';
            case UserRole.USER:  return 'badge-user';
        }
    }
}
