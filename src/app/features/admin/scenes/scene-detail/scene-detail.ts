import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminScene } from '../../../../core/models/admin.scene.model';
import { AdminUser } from '../../../../core/models/admin.user.model';
import { IAuxs } from '../../../../core/models/auxs.model';
import { UserRole } from '../../../../core/models/user.model';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/custom-select/custom-select';
import { CanComponentDeactivate } from '../../../../core/auth/can-deactivate.guard';

@Component({
    selector: 'app-admin-scene-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CustomSelectComponent],
    templateUrl: './scene-detail.html',
    styleUrl: './scene-detail.scss'
})
export class AdminSceneDetailComponent implements OnInit, CanComponentDeactivate {
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

    // Add-participant modal state — pendingUserIndex maps to availableUsers[index].
    // CustomSelectOption.value is numeric, so we use the index as a stable handle.
    private availableUsers: AdminUser[] = [];
    pendingUserIndex: number | null = null;
    pendingAuxId: number | null = null;
    userOptions: CustomSelectOption[] = [];

    saving = false;
    saved = false;

    private originalSnapshot: string | null = null;

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
                this.scene = scene;
                this.nameDraft = scene.name;
                this.descriptionDraft = scene.description ?? '';
                this.originalSnapshot = this.snapshotScene(scene);
            },
            error: () => {
                this.notFound = true;
            }
        });
    }

    private snapshotScene(scene: AdminScene): string {
        return JSON.stringify({
            name: scene.name,
            description: scene.description ?? '',
            participants: [...scene.participants]
                .sort((a, b) => a.username.localeCompare(b.username))
                .map(p => ({ username: p.username, auxId: p.auxId }))
        });
    }

    isDirty(): boolean {
        if (!this.scene || this.originalSnapshot === null) return false;
        return this.snapshotScene(this.scene) !== this.originalSnapshot;
    }

    canDeactivate(): boolean {
        if (!this.isDirty()) return true;
        return window.confirm('Hai modifiche non salvate. Vuoi davvero uscire? Le modifiche andranno perse.');
    }

    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: BeforeUnloadEvent): void {
        if (this.isDirty()) {
            event.preventDefault();
            event.returnValue = '';
        }
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
        const used = new Set(this.scene.participants.map(p => p.username));
        return this.allUsers.filter(u => !used.has(u.username));
    }

    openAddParticipant(): void {
        this.availableUsers = this.getAvailableUsers();
        if (this.availableUsers.length === 0) return;
        this.userOptions = this.availableUsers.map((u, idx) => ({
            value: idx,
            label: u.name ? `${u.name} (${u.username})` : u.username
        }));
        this.pendingUserIndex = 0;
        this.pendingAuxId = this.auxs[0]?.id ?? null;
        this.showAddModal = true;
    }

    closeAddParticipant(): void {
        this.showAddModal = false;
        this.pendingUserIndex = null;
        this.pendingAuxId = null;
    }

    onPendingUserChange(value: number): void {
        this.pendingUserIndex = value;
    }

    onPendingAuxChange(value: number): void {
        this.pendingAuxId = value;
    }

    confirmAddParticipant(): void {
        if (!this.scene || this.pendingUserIndex === null) return;
        const user = this.availableUsers[this.pendingUserIndex];
        if (!user) return;
        this.scene.participants = [
            ...this.scene.participants,
            { username: user.username, auxId: this.pendingAuxId }
        ];

        this.availableUsers = this.getAvailableUsers();
        if (this.availableUsers.length === 0) {
            this.closeAddParticipant();
            return;
        }
        this.userOptions = this.availableUsers.map((u, idx) => ({
            value: idx,
            label: u.name ? `${u.name} (${u.username})` : u.username
        }));
        this.pendingUserIndex = 0;
        this.pendingAuxId = this.auxs[0]?.id ?? null;
    }

    removeParticipant(username: string): void {
        if (!this.scene) return;
        this.scene.participants = this.scene.participants.filter(p => p.username !== username);
    }

    onAuxChange(username: string, auxId: number): void {
        if (!this.scene) return;
        const participant = this.scene.participants.find(p => p.username === username);
        if (participant) participant.auxId = auxId;
    }

    getParticipantName(username: string): string {
        return this.allUsers.find(u => u.username === username)?.name ?? username;
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
                this.descriptionDraft = saved.description ?? '';
                this.originalSnapshot = this.snapshotScene(saved);
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
