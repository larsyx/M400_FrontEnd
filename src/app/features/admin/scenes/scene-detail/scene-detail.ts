import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminScene } from '../../../../core/models/admin.scene.model';
import { AdminUser } from '../../../../core/models/admin.user.model';
import { IAuxs } from '../../../../core/models/auxs.model';
import { UserRole } from '../../../../core/models/user.model';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/custom-select/custom-select';

@Component({
    selector: 'app-admin-scene-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent],
    templateUrl: './scene-detail.html',
    styleUrl: './scene-detail.scss'
})
export class AdminSceneDetailComponent implements OnInit {
    scene: AdminScene | null = null;
    sceneId: number | null = null;
    notFound = false;

    editingName = false;
    nameDraft = '';

    editingDescription = false;
    descriptionDraft = '';

    auxs: IAuxs[] = [];
    auxOptions: CustomSelectOption[] = [];

    allUsers: AdminUser[] = [];
    showAddModal = false;
    pendingUserId: number | null = null;
    pendingAuxId: number | null = null;
    userOptions: CustomSelectOption[] = [];

    saving = false;
    saved = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private adminService: AdminService
    ) {}

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (Number.isNaN(id)) {
            this.notFound = true;
            return;
        }
        this.sceneId = id;
        this.loadAll();
    }

    private loadAll(): void {
        this.adminService.listAuxs().subscribe(auxs => {
            this.auxs = auxs;
            this.auxOptions = auxs.map(a => ({ value: a.id, label: a.name }));
        });

        this.adminService.listUsersByRole(UserRole.USER).subscribe(users => {
            this.allUsers = users;
        });

        this.adminService.getScene(this.sceneId!).subscribe({
            next: (scene) => {
                if (!scene) {
                    this.notFound = true;
                    return;
                }
                this.scene = scene;
                this.nameDraft = scene.name;
                this.descriptionDraft = scene.description ?? '';
            }
        });
    }

    // ===== Name editing =====
    startEditName(): void {
        if (!this.scene) return;
        this.editingName = true;
        this.nameDraft = this.scene.name;
    }

    saveName(): void {
        if (!this.scene) return;
        const trimmed = this.nameDraft.trim();
        if (!trimmed) {
            this.cancelEditName();
            return;
        }
        this.scene.name = trimmed;
        this.editingName = false;
    }

    cancelEditName(): void {
        if (!this.scene) return;
        this.nameDraft = this.scene.name;
        this.editingName = false;
    }

    startEditDescription(): void {
        if (!this.scene) return;
        this.editingDescription = true;
        this.descriptionDraft = this.scene.description ?? '';
    }

    saveDescription(): void {
        if (!this.scene) return;
        this.scene.description = this.descriptionDraft.trim();
        this.editingDescription = false;
    }

    cancelEditDescription(): void {
        if (!this.scene) return;
        this.descriptionDraft = this.scene.description ?? '';
        this.editingDescription = false;
    }

    // ===== Participants =====
    getAvailableUsers(): AdminUser[] {
        if (!this.scene) return [];
        const used = new Set(this.scene.participants.map(p => p.userId));
        return this.allUsers.filter(u => !used.has(u.id));
    }

    openAddParticipant(): void {
        const available = this.getAvailableUsers();
        if (available.length === 0) return;
        this.userOptions = available.map(u => ({ value: u.id, label: u.username }));
        this.pendingUserId = available[0].id;
        this.pendingAuxId = this.auxs[0]?.id ?? null;
        this.showAddModal = true;
    }

    closeAddParticipant(): void {
        this.showAddModal = false;
        this.pendingUserId = null;
        this.pendingAuxId = null;
    }

    onPendingUserChange(value: number): void {
        this.pendingUserId = value;
    }

    onPendingAuxChange(value: number): void {
        this.pendingAuxId = value;
    }

    confirmAddParticipant(): void {
        if (!this.scene || this.pendingUserId === null) return;
        const user = this.allUsers.find(u => u.id === this.pendingUserId);
        if (!user) return;
        this.scene.participants = [
            ...this.scene.participants,
            { userId: user.id, username: user.username, auxId: this.pendingAuxId }
        ];
        this.closeAddParticipant();
    }

    removeParticipant(userId: number): void {
        if (!this.scene) return;
        this.scene.participants = this.scene.participants.filter(p => p.userId !== userId);
    }

    onAuxChange(userId: number, auxId: number): void {
        if (!this.scene) return;
        const participant = this.scene.participants.find(p => p.userId === userId);
        if (participant) participant.auxId = auxId;
    }

    getAuxName(auxId: number | null): string {
        if (auxId === null) return 'Nessun AUX';
        return this.auxs.find(a => a.id === auxId)?.name ?? '—';
    }

    // ===== Save / cancel =====
    save(): void {
        if (!this.scene) return;
        this.saving = true;
        this.adminService.updateScene(this.scene).subscribe({
            next: (saved) => {
                this.scene = saved;
                this.nameDraft = saved.name;
                this.saving = false;
                this.saved = true;
                setTimeout(() => this.saved = false, 2000);
            },
            error: () => this.saving = false
        });
    }

    backToList(): void {
        this.router.navigate(['/app/admin/scenes']);
    }
}
