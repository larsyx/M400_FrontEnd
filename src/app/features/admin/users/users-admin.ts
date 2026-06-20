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
    UserRole.USER,
    UserRole.MIXER,
    UserRole.VIDEO,
    UserRole.ADMIN
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
    newName = '';
    newUsername = '';
    newRole: UserRole = UserRole.USER;

    editingUserId: string | null = null;
    editName = '';
    editUsername = '';
    editRole: UserRole = UserRole.USER;

    confirmDeleteId: string | null = null;
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
                a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
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

    
    startCreate(): void {
        this.creating = true;
        this.newName = '';
        this.newUsername = '';
        this.newRole = UserRole.USER;
        this.cancelEdit();
        this.cancelDelete();
        this.error = null;
    }

    cancelCreate(): void {
        this.creating = false;
        this.newName = '';
        this.newUsername = '';
        this.error = null;
    }

    onNewRoleChange(value: number): void {
        this.newRole = this.resolveRole(value);
    }

    canCreate(): boolean {
        return this.newName.trim().length > 0 && this.newUsername.trim().length > 0;
    }

    confirmCreate(): void {
        const name = this.newName.trim();
        const username = this.newUsername.trim();
        if (!name || !username) return;
        if (this.isUsernameTaken(username)) {
            this.error = 'Username già in uso';
            return;
        }

        this.adminService.createUser({ name, username, role: this.newRole }).subscribe({
            next: (created) => {
                this.users = [...this.users, created].sort((a, b) =>
                    a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
                );
                this.cancelCreate();
            }
        });
    }

    // ===== Edit =====
    startEdit(user: AdminUser): void {
        this.editingUserId = user.username;
        this.editName = user.name;
        this.editUsername = user.username;
        this.editRole = user.role;
        this.confirmDeleteId = null;
        this.creating = false;
        this.error = null;
    }

    cancelEdit(): void {
        this.editingUserId = null;
        this.editName = '';
        this.editUsername = '';
        this.editRole = UserRole.USER;
        this.error = null;
    }

    onEditRoleChange(value: number): void {
        this.editRole = this.resolveRole(value);
    }

    canSaveEdit(): boolean {
        return this.editName.trim().length > 0 && this.editUsername.trim().length > 0;
    }

    saveEdit(user: AdminUser): void {
        const name = this.editName.trim();
        const username = this.editUsername.trim();
        if (!name || !username) {
            this.cancelEdit();
            return;
        }
        if (this.isUsernameTaken(username, user.username)) {
            this.error = 'Username già in uso';
            return;
        }

        const updated: AdminUser = { ...user, name, username, role: this.editRole };
        this.adminService.updateUser(updated, user.username).subscribe({
            next: (saved) => {
                const finalUser: AdminUser = saved && saved.name && saved.username
                    ? saved
                    : updated;
                const idx = this.users.findIndex(u => u.username === user.username);
                if (idx >= 0) this.users[idx] = finalUser;
                this.users = [...this.users].sort((a, b) =>
                    a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
                );
                this.cancelEdit();
            }
        });
    }

    isUsernameTaken(username: string, excludeUsername?: string): boolean {
        const target = username.trim().toLowerCase();
        const exclude = excludeUsername?.toLowerCase();
        return this.users.some(u =>
            u.username.toLowerCase() === target && u.username.toLowerCase() !== exclude
        );
    }

    // ===== Delete =====
    requestDelete(user: AdminUser): void {
        this.confirmDeleteId = user.username;
        this.cancelEdit();
    }

    cancelDelete(): void {
        this.confirmDeleteId = null;
    }

    confirmDelete(user: AdminUser): void {
        this.adminService.deleteUser(user.username).subscribe({
            next: () => {
                this.users = this.users.filter(u => u.username !== user.username);
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
