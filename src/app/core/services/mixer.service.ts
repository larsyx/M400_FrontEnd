import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Fader } from "../models/fader.model";
import { IAuxs } from "../models/auxs.model";
import { IMixerHome } from "../models/mixer.home.model";

@Injectable({
  providedIn: 'root'
})
export class MixerService{
  private API_URL = environment.apiUrl + "/mixer";
  
  constructor(
    private http: HttpClient
  ) {}

  laodHome(): Observable<IMixerHome>{
    const url = this.API_URL + "/home"
    return this.http.get<IMixerHome>(url)
  }

  loadFader(): Observable<Fader[]>{
    const url = this.API_URL + "/fader"
    return this.http.get<Fader[]>(url)
  }

  loadDca(): Observable<Fader[]>{
    const url = this.API_URL + "/dca"
    return this.http.get<Fader[]>(url)
  }

  loadAux(): Observable<IAuxs[]>{
    const url = this.API_URL + "/aux"
    return this.http.get<IAuxs[]>(url)
  }

  loadValues(auxId: number){
    const url = this.API_URL + `/aux/${auxId}`;
    return this.http.get<Fader[]>(url);
  }
}