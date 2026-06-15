import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { delay, map } from "rxjs/operators";
import { AdminChannel } from "../models/admin.channel.model";
import { AdminScene } from "../models/admin.scene.model";
import { SceneParticipant } from "../models/scene.participant.model";
import { AdminUser } from "../models/admin.user.model";
import { IAuxs } from "../models/auxs.model";
import { TypeChannel } from "../models/fader.model";
import { UserRole } from "../models/user.model";
import { ChannelLayout } from "../models/channel.layout.model";
import { environment } from "../../../environments/environment.development";
import { HttpClient, HttpContext } from "@angular/common/http";
import { SHOW_LOADER } from "../interceptors/loader.interceptor";

const SIMULATED_LATENCY_MS = 150;

@Injectable({ providedIn: 'root' })
export class AdminService {
    private API_URL = environment.apiUrl + "/admin";
    private USER_PATH = "/user"
    private LAYOUT_PATH = "/layout"

    constructor(private http: HttpClient) {}

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

    private users: AdminUser[] = [
        { name: 'Amministratore Sistema', username: 'admin',     role: UserRole.ADMIN },
        { name: 'Marco Bianchi',          username: 'mixerista', role: UserRole.MIXER },
        { name: 'Luca Verdi',             username: 'video',     role: UserRole.VIDEO },
        { name: 'Mario Rossi',            username: 'mario',     role: UserRole.USER },
        { name: 'Luigi Neri',             username: 'luigi',     role: UserRole.USER },
        { name: 'Anna Galli',             username: 'anna',      role: UserRole.USER }
    ];

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
        const url = environment.apiUrl + "/user/aux";
        return this.http.get<IAuxs[]>(url, { context: new HttpContext().set(SHOW_LOADER, true) });
    }

    // ===== Scenes =====
    listScenes(): Observable<AdminScene[]> {
        const url = this.API_URL + "/scene";
        return this.http
            .get<Array<Omit<AdminScene, 'participants'> & { ScenePartecipant: SceneParticipant[] }>>(url, {
                context: new HttpContext().set(SHOW_LOADER, true)
            })
            .pipe(map(scenes => scenes.map(s => this.fromBackendScene(s))));
    }

    getScene(id: number): Observable<AdminScene> {
        const url = this.API_URL + `/scene/${id}`;
        return this.http
            .get<Omit<AdminScene, 'participants'> & { ScenePartecipant: SceneParticipant[] }>(url, {
                context: new HttpContext().set(SHOW_LOADER, true)
            })
            .pipe(map(s => this.fromBackendScene(s)));
    }

    createScene(name: string, description: string = ''): Observable<AdminScene> {
        const url = this.API_URL + "/scene";
        const trimmedDescription = description.trim();
        const body = {
            id: 0,
            name: name.trim(),
            description: trimmedDescription === '' ? null : trimmedDescription
        };
        return this.http
            .post<Omit<AdminScene, 'participants'> & { ScenePartecipant?: SceneParticipant[] }>(url, body, {
                context: new HttpContext().set(SHOW_LOADER, true)
            })
            .pipe(map(s => this.fromBackendScene(s)));
    }

    updateScene(scene: AdminScene): Observable<AdminScene> {
        const url = this.API_URL + `/scene/${scene.id}`;
        const body = {
            id: scene.id,
            name: scene.name,
            description: scene.description ?? '',
            ScenePartecipant: scene.participants.map(p => ({ ...p }))
        };
        return this.http
            .put<Omit<AdminScene, 'participants'> & { ScenePartecipant: SceneParticipant[] }>(url, body, {
                context: new HttpContext().set(SHOW_LOADER, true)
            })
            .pipe(map(s => this.fromBackendScene(s)));
    }

    deleteScene(id: number): Observable<void> {
        const url = this.API_URL + `/scene/${id}`;
        return this.http.delete<void>(url, { context: new HttpContext().set(SHOW_LOADER, true) });
    }

    private fromBackendScene(
        s: Omit<AdminScene, 'participants'> & { ScenePartecipant?: SceneParticipant[] }
    ): AdminScene {
        return {
            id: s.id,
            name: s.name,
            description: s.description ?? '',
            participants: (s.ScenePartecipant ?? []).map(p => ({ ...p }))
        };
    }

    // ===== Users =====
    listUsers(): Observable<AdminUser[]> {
        const url = this.API_URL + this.USER_PATH
        return this.http.get<AdminUser[]>(url);
    }

    listUsersByRole(role: UserRole): Observable<AdminUser[]> {
        return this.listUsers().pipe(map(users => users.filter(u => u.role === role)));
    }

    createUser(user: AdminUser): Observable<AdminUser> {
        const url = this.API_URL + this.USER_PATH
        return this.http.post<AdminUser>(url, user)
    }

    updateUser(user: AdminUser, originalUsername: string): Observable<AdminUser> {
        const url = this.API_URL + this.USER_PATH + `/${originalUsername}`;
        return this.http.put<AdminUser>(url, user);
    }

    deleteUser(username: string): Observable<void> {
        const url = this.API_URL + this.USER_PATH + `/${username}`;
        return this.http.delete<void>(url);
    }

    isUsernameTaken(username: string, excludeUsername?: string): boolean {
        const target = username.trim().toLowerCase();
        const exclude = excludeUsername?.toLowerCase();
        return this.users.some(u =>
            u.username.toLowerCase() === target && u.username.toLowerCase() !== exclude
        );
    }

    // ===== Default layout (global) =====
    loadDefaultLayout(): Observable<ChannelLayout[]> {
        const url = this.API_URL + this.LAYOUT_PATH;
        return this.http.get<ChannelLayout[]>(url, { context: new HttpContext().set(SHOW_LOADER, true) });
    }

    saveDefaultLayout(layout: ChannelLayout[]): Observable<ChannelLayout[]> {
        const url = this.API_URL + this.LAYOUT_PATH;
        return this.http.post<ChannelLayout[]>(url, layout, { context: new HttpContext().set(SHOW_LOADER, true) });
    }
}
