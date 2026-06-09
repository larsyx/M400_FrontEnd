import { Injectable, signal } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { HttpClient, HttpContext } from "@angular/common/http";
import { Observable } from "rxjs";
import { IUserHome } from "../models/user.home.model";
import { Fader } from "../models/fader.model";
import { SHOW_LOADER } from "../interceptors/loader.interceptor";

const SCENE_ID_STORAGE_KEY = "user.currentSceneId";

@Injectable({
    providedIn: "root"
})
export class UserService{
    private API_URL = environment.apiUrl + "/user";
    private SCENE_PATH = "/scene"

    private _currentSceneId = signal<number | null>(this.readStoredSceneId());
    readonly currentSceneId = this._currentSceneId.asReadonly();

    constructor(private http: HttpClient) {}

    setCurrentSceneId(sceneId: number | null): void {
        this._currentSceneId.set(sceneId);
        try {
            if (sceneId === null) {
                localStorage.removeItem(SCENE_ID_STORAGE_KEY);
            } else {
                localStorage.setItem(SCENE_ID_STORAGE_KEY, String(sceneId));
            }
        } catch {
        }
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
}