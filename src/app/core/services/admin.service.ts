import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AdminChannel } from "../models/admin.channel.model";
import { AdminScene } from "../models/admin.scene.model";
import { SceneParticipant } from "../models/scene.participant.model";
import { AdminUser } from "../models/admin.user.model";
import { IAuxs } from "../models/auxs.model";
import { Channel } from "../models/channel.model";
import { UserRole } from "../models/user.model";
import { ChannelLayout } from "../models/channel.layout.model";
import { environment } from "../../../environments/environment.development";
import { HttpClient, HttpContext } from "@angular/common/http";
import { SHOW_LOADER } from "../interceptors/loader.interceptor";

@Injectable({ providedIn: 'root' })
export class AdminService {
    private API_URL = environment.apiUrl + "/admin";
    private USER_PATH = "/user"
    private LAYOUT_PATH = "/layout"
    private CHANNEL_PATH = "/channel"

    constructor(private http: HttpClient) {}

    // ===== Channels =====
    listChannels(): Observable<AdminChannel[]> {
        const url = this.API_URL + this.CHANNEL_PATH;
        return this.http
            .get<Channel[]>(url, { context: new HttpContext().set(SHOW_LOADER, true) })
            .pipe(map(channels => this.toAdminChannels(channels)));
    }

    saveChannels(channels: Channel[]): Observable<void> {
        const url = this.API_URL + this.CHANNEL_PATH;
        return this.http.post<void>(url, channels, { context: new HttpContext().set(SHOW_LOADER, true) });
    }

    private toAdminChannels(channels: Channel[]): AdminChannel[] {
        let unselectedPos = channels.filter(c => c.position !== null).length;
        return channels.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            mixerDescription: '',
            type: c.type,
            selected: c.position !== null,
            position: c.position !== null ? c.position : unselectedPos++
        }));
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
