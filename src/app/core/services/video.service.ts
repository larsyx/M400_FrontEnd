import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { HttpClient, HttpContext } from "@angular/common/http";
import { Observable } from "rxjs";
import { Fader } from "../models/fader.model";
import { SHOW_LOADER } from "../interceptors/loader.interceptor";
import { IVideoHome } from "../models/video.home.model";

@Injectable({
    providedIn: "root"
})
export class VideoService {
    private API_URL = environment.apiUrl + "/video";

    constructor(private http: HttpClient) {}

    loadHome(): Observable<IVideoHome> {
        const url = this.API_URL + "/home";
        return this.http.get<IVideoHome>(url, { context: new HttpContext().set(SHOW_LOADER, true) });
    }

    loadValues(auxId: number): Observable<Fader[]> {
        const url = this.API_URL + `/aux/${auxId}`;
        return this.http.get<Fader[]>(url, { context: new HttpContext().set(SHOW_LOADER, true) });
    }
}
