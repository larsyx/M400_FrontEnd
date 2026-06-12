import { Injectable, signal } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { HttpClient, HttpContext } from "@angular/common/http";
import { Observable } from "rxjs";
import { IUserHome } from "../models/user.home.model";
import { Fader } from "../models/fader.model";
import { SHOW_LOADER } from "../interceptors/loader.interceptor";
import { ChannelLayout } from "../models/channel.layout.model";
import { IProfile } from "../models/profile.model";

const SCENE_ID_STORAGE_KEY = "user.currentSceneId";
const SCENE_NAME_STORAGE_KEY = "user.currentSceneName";

@Injectable({
    providedIn: "root"
})
export class UserService{
    private API_URL = environment.apiUrl + "/user";
    private SCENE_PATH = "/scene"

    private _currentSceneId = signal<number | null>(this.readStoredSceneId());
    readonly currentSceneId = this._currentSceneId.asReadonly();
    private _currentSceneName = signal<string>(this.readStoredSceneName());
    readonly currentSceneName = this._currentSceneName.asReadonly();

    constructor(private http: HttpClient) {}

    setCurrentScene(sceneId: number | null, sceneName: string | null): void {
        this._currentSceneId.set(sceneId);
        this._currentSceneName.set(sceneName ?? '');

        try {
            if (sceneId === null) {
                localStorage.removeItem(SCENE_ID_STORAGE_KEY);
            } else {
                localStorage.setItem(SCENE_ID_STORAGE_KEY, String(sceneId));
            }

            if (!sceneName) {
                localStorage.removeItem(SCENE_NAME_STORAGE_KEY);
            } else {
                localStorage.setItem(SCENE_NAME_STORAGE_KEY, sceneName);
            }
        } catch {
        }
    }

    setCurrentSceneId(sceneId: number | null): void {
        this.setCurrentScene(sceneId, sceneId === null ? null : this._currentSceneName());
    }

    private readStoredSceneId(): number | null {
        try {
            const raw = localStorage.getItem(SCENE_ID_STORAGE_KEY);
            if (!raw) return null;
            const n = Number(raw);
            return Number.isFinite(n) ? n : null;
        } catch {
            return null;
        }
    }

    private readStoredSceneName(): string {
        try {
            return localStorage.getItem(SCENE_NAME_STORAGE_KEY) ?? '';
        } catch {
            return '';
        }
    }

    loadHomeScene(id: number): Observable<IUserHome>{
        const url = this.API_URL + this.SCENE_PATH + `/${id}`;
        return this.http.get<IUserHome>(url, { context: new HttpContext().set(SHOW_LOADER, true)});
    }

    loadHome(sceneId: number): Observable<IUserHome>{
        const url = this.API_URL + this.SCENE_PATH + `/${sceneId}`;
        return this.http.get<IUserHome>(url, { context: new HttpContext().set(SHOW_LOADER, true)});

    }

    loadFader(aux_id : number): Observable<Fader[]>{
        const url = this.API_URL + `/${aux_id}`;
        return this.http.get<Fader[]>(url, { context: new HttpContext().set(SHOW_LOADER, true)});
    }

    loadFaderScene(aux_id : number, scene_id : number): Observable<Fader[]>{
        const url = this.API_URL + this.SCENE_PATH + `/${scene_id}/${aux_id}`;
        return this.http.get<Fader[]>(url, { context: new HttpContext().set(SHOW_LOADER, true)});
    }

    loadChannelLayout(sceneID: number): Observable<ChannelLayout[]>{
        const url = this.API_URL + this.SCENE_PATH + `/${sceneID}/layout`;
        return this.http.get<ChannelLayout[]>(url, { context: new HttpContext().set(SHOW_LOADER, true)});
    }

    storeChannelLayout(sceneID: number, layout: ChannelLayout[]): Observable<ChannelLayout[]>{
        const url = this.API_URL + this.SCENE_PATH + `/${sceneID}/layout`;
        return this.http.post<ChannelLayout[]>(url, layout, { context: new HttpContext().set(SHOW_LOADER, true)});
    }

    //TODO: remove /user from api url
    loadValues(auxId: number){
        const url = this.API_URL + `/aux/${auxId}`;
        return this.http.get<Fader[]>(url, { context: new HttpContext().set(SHOW_LOADER, true)});
    }

    // profiles
    createProfile(sceneId: number, profile: IProfile, faders: Fader[]): Observable<IProfile> {
        const url = `${this.API_URL}${this.SCENE_PATH}/${sceneId}/profile`;
        return this.http.post<IProfile>(url, {profile, faders}, { context: new HttpContext().set(SHOW_LOADER, true)});
    }

    updateProfile(sceneId: number, profile: IProfile, faders: Fader[]): Observable<void> {
        const url = `${this.API_URL}${this.SCENE_PATH}/${sceneId}/profile`;
        return this.http.put<void>(url, {profile, faders}, { context: new HttpContext().set(SHOW_LOADER, true)});
    }

    deleteProfile(sceneId: number, profile_id: number): Observable<void> {
        const url = `${this.API_URL}${this.SCENE_PATH}/${sceneId}/profile/${profile_id}`;
        return this.http.delete<void>(url, { context: new HttpContext().set(SHOW_LOADER, true)});
    }

    deleteAllProfiles(sceneId: number): Observable<void> {
        const url = `${this.API_URL}${this.SCENE_PATH}/${sceneId}/profile`;
        return this.http.delete<void>(url, { context: new HttpContext().set(SHOW_LOADER, true)});
    }

    loadProfile(sceneId: number, profile_id: number, aux_id: number): Observable<Fader[]> {
        const url = `${this.API_URL}${this.SCENE_PATH}/${sceneId}/profile/${profile_id}/${aux_id}`;
        
        return this.http.get<Fader[]>(url, { context: new HttpContext().set(SHOW_LOADER, true)});
    }
}