import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { delay, map } from "rxjs/operators";
import { AdminChannel } from "../models/admin.channel.model";
import { AdminScene } from "../models/admin.scene.model";
import { AdminUser } from "../models/admin.user.model";
import { IAuxs } from "../models/auxs.model";
import { TypeChannel } from "../models/fader.model";
import { UserRole } from "../models/user.model";
import { ChannelLayout } from "../models/channel.layout.model";

const SIMULATED_LATENCY_MS = 150;

@Injectable({ providedIn: 'root' })
export class AdminService {
    private channels: AdminChannel[] = [
        { id: 1,  name: 'Canale 01', description: 'Voce solista',   type: TypeChannel.VOICE,      selected: true,  position: 0 },
        { id: 2,  name: 'Canale 02', description: 'Cori',           type: TypeChannel.VOICE,      selected: true,  position: 1 },
        { id: 3,  name: 'Canale 03', description: 'Chitarra acustica', type: TypeChannel.INSTRUMENT, selected: true,  position: 2 },
        { id: 4,  name: 'Canale 04', description: 'Chitarra elettrica', type: TypeChannel.INSTRUMENT, selected: true,  position: 3 },
        { id: 5,  name: 'Canale 05', description: 'Basso',          type: TypeChannel.INSTRUMENT, selected: true,  position: 4 },
        { id: 6,  name: 'Canale 06', description: 'Tastiera',       type: TypeChannel.INSTRUMENT, selected: false, position: 5 },
        { id: 7,  name: 'Canale 07', description: 'Cassa',          type: TypeChannel.DRUM,       selected: true,  position: 6 },
        { id: 8,  name: 'Canale 08', description: 'Rullante',       type: TypeChannel.DRUM,       selected: true,  position: 7 },
        { id: 9,  name: 'Canale 09', description: '',               type: TypeChannel.DRUM,       selected: false, position: 8 },
        { id: 10, name: 'Canale 10', description: 'Overhead',       type: TypeChannel.DRUM,       selected: false, position: 9 }
    ];

    private auxs: IAuxs[] = [
        { id: 1, name: 'AUX 1' },
        { id: 2, name: 'AUX 2' },
        { id: 3, name: 'AUX 3' },
        { id: 4, name: 'AUX 4' }
    ];

    private users: AdminUser[] = [
        { id: 1, username: 'admin',     role: UserRole.ADMIN },
        { id: 2, username: 'mixerista', role: UserRole.MIXER },
        { id: 3, username: 'video',     role: UserRole.VIDEO },
        { id: 4, username: 'mario',     role: UserRole.USER },
        { id: 5, username: 'luigi',     role: UserRole.USER },
        { id: 6, username: 'anna',      role: UserRole.USER }
    ];

    private scenes: AdminScene[] = [
        {
            id: 1,
            name: 'Concerto principale',
            description: 'Setlist completa serale',
            participants: [
                { userId: 4, username: 'mario', auxId: 1 },
                { userId: 5, username: 'luigi', auxId: 2 }
            ]
        },
        {
            id: 2,
            name: 'Soundcheck',
            description: '',
            participants: [
                { userId: 4, username: 'mario', auxId: 1 }
            ]
        }
    ];

    private defaultLayout: ChannelLayout[] | null = null;

    // ===== Channels =====
    listChannels(): Observable<AdminChannel[]> {
        return of(this.channels.map(c => ({ ...c }))).pipe(delay(SIMULATED_LATENCY_MS));
    }

    saveChannels(channels: AdminChannel[]): Observable<void> {
        this.channels = channels.map(c => ({ ...c }));
        return of(void 0).pipe(delay(SIMULATED_LATENCY_MS));
    }

    // ===== Auxs =====
    listAuxs(): Observable<IAuxs[]> {
        return of(this.auxs.map(a => ({ ...a }))).pipe(delay(SIMULATED_LATENCY_MS));
    }

    // ===== Scenes =====
    listScenes(): Observable<AdminScene[]> {
        return of(this.scenes.map(s => this.cloneScene(s))).pipe(delay(SIMULATED_LATENCY_MS));
    }

    getScene(id: number): Observable<AdminScene | null> {
        const scene = this.scenes.find(s => s.id === id);
        return of(scene ? this.cloneScene(scene) : null).pipe(delay(SIMULATED_LATENCY_MS));
    }

    createScene(name: string, description: string = ''): Observable<AdminScene> {
        const id = this.nextId(this.scenes.map(s => s.id));
        const scene: AdminScene = {
            id,
            name: name.trim(),
            description: description.trim(),
            participants: []
        };
        this.scenes.push(scene);
        return of(this.cloneScene(scene)).pipe(delay(SIMULATED_LATENCY_MS));
    }

    updateScene(scene: AdminScene): Observable<AdminScene> {
        const idx = this.scenes.findIndex(s => s.id === scene.id);
        if (idx >= 0) {
            this.scenes[idx] = this.cloneScene(scene);
        }
        return of(this.cloneScene(scene)).pipe(delay(SIMULATED_LATENCY_MS));
    }

    deleteScene(id: number): Observable<void> {
        this.scenes = this.scenes.filter(s => s.id !== id);
        return of(void 0).pipe(delay(SIMULATED_LATENCY_MS));
    }

    // ===== Users =====
    listUsers(): Observable<AdminUser[]> {
        return of(this.users.map(u => ({ ...u }))).pipe(delay(SIMULATED_LATENCY_MS));
    }

    listUsersByRole(role: UserRole): Observable<AdminUser[]> {
        return this.listUsers().pipe(map(users => users.filter(u => u.role === role)));
    }

    createUser(user: Omit<AdminUser, 'id'>): Observable<AdminUser> {
        const id = this.nextId(this.users.map(u => u.id));
        const created: AdminUser = { id, username: user.username.trim(), role: user.role };
        this.users.push(created);
        return of({ ...created }).pipe(delay(SIMULATED_LATENCY_MS));
    }

    updateUser(user: AdminUser): Observable<AdminUser> {
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx >= 0) {
            this.users[idx] = { ...user, username: user.username.trim() };
        }
        return of({ ...user }).pipe(delay(SIMULATED_LATENCY_MS));
    }

    deleteUser(id: number): Observable<void> {
        this.users = this.users.filter(u => u.id !== id);
        // remove from any scene's participants list
        this.scenes.forEach(s => {
            s.participants = s.participants.filter(p => p.userId !== id);
        });
        return of(void 0).pipe(delay(SIMULATED_LATENCY_MS));
    }

    isUsernameTaken(username: string, excludeUserId?: number): boolean {
        const target = username.trim().toLowerCase();
        return this.users.some(u =>
            u.username.toLowerCase() === target && u.id !== excludeUserId
        );
    }

    // ===== Default layout (global) =====
    loadDefaultLayout(): Observable<ChannelLayout[]> {
        if (this.defaultLayout) {
            return of(this.defaultLayout.map(c => ({ ...c }))).pipe(delay(SIMULATED_LATENCY_MS));
        }

        const layout: ChannelLayout[] = this.channels.map(c => ({
            channel_id: c.id,
            name: c.name,
            description: c.description,
            position: c.position,
            type: c.type,
            selected: c.selected
        }));

        return of(layout).pipe(delay(SIMULATED_LATENCY_MS));
    }

    saveDefaultLayout(layout: ChannelLayout[]): Observable<void> {
        this.defaultLayout = layout.map(c => ({ ...c }));
        return of(void 0).pipe(delay(SIMULATED_LATENCY_MS));
    }

    applyDefaultPreset(): Observable<ChannelLayout[]> {
        this.defaultLayout = null;
        return this.loadDefaultLayout();
    }

    private cloneScene(scene: AdminScene): AdminScene {
        return {
            id: scene.id,
            name: scene.name,
            description: scene.description ?? '',
            participants: scene.participants.map(p => ({ ...p }))
        };
    }

    private nextId(existing: number[]): number {
        return existing.length === 0 ? 1 : Math.max(...existing) + 1;
    }
}
