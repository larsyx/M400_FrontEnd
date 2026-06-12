import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminScene } from '../../../core/models/admin.scene.model';

@Component({
    selector: 'app-admin-scenes',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './scenes-admin.html',
    styleUrl: './scenes-admin.scss'
})
export class AdminScenesComponent implements OnInit {
    scenes: AdminScene[] = [];
    creating = false;
    newSceneName = '';
    newSceneDescription = '';

    renameSceneId: number | null = null;
    renameSceneName = '';

    confirmDeleteId: number | null = null;

    constructor(
        private adminService: AdminService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadScenes();
    }

    private loadScenes(): void {
        this.adminService.listScenes().subscribe({
            next: (res) => this.scenes = res
        });
    }

    startCreate(): void {
        this.creating = true;
        this.newSceneName = '';
        this.newSceneDescription = '';
        this.cancelRename();
        this.cancelDelete();
    }

    cancelCreate(): void {
        this.creating = false;
        this.newSceneName = '';
        this.newSceneDescription = '';
    }

    confirmCreate(): void {
        const name = this.newSceneName.trim();
        if (!name) return;
        this.adminService.createScene(name, this.newSceneDescription).subscribe({
            next: (scene) => {
                this.scenes = [...this.scenes, scene];
                this.creating = false;
                this.newSceneName = '';
                this.newSceneDescription = '';
                this.router.navigate(['/app/admin/scenes', scene.id]);
            }
        });
    }

    openDetail(scene: AdminScene): void {
        if (this.renameSceneId === scene.id || this.confirmDeleteId === scene.id) return;
        this.router.navigate(['/app/admin/scenes', scene.id]);
    }

    startRename(scene: AdminScene, event: Event): void {
        event.stopPropagation();
        this.renameSceneId = scene.id;
        this.renameSceneName = scene.name;
        this.confirmDeleteId = null;
    }

    cancelRename(): void {
        this.renameSceneId = null;
        this.renameSceneName = '';
    }

    saveRename(scene: AdminScene): void {
        const name = this.renameSceneName.trim();
        if (!name) {
            this.cancelRename();
            return;
        }
        const updated: AdminScene = { ...scene, name };
        this.adminService.updateScene(updated).subscribe({
            next: (saved) => {
                const idx = this.scenes.findIndex(s => s.id === saved.id);
                if (idx >= 0) this.scenes[idx] = saved;
                this.cancelRename();
            }
        });
    }

    requestDelete(scene: AdminScene, event: Event): void {
        event.stopPropagation();
        this.confirmDeleteId = scene.id;
        this.cancelRename();
    }

    cancelDelete(): void {
        this.confirmDeleteId = null;
    }

    confirmDelete(scene: AdminScene, event: Event): void {
        event.stopPropagation();
        this.adminService.deleteScene(scene.id).subscribe({
            next: () => {
                this.scenes = this.scenes.filter(s => s.id !== scene.id);
                this.confirmDeleteId = null;
            }
        });
    }
}
