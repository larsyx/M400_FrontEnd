import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Scene } from '../../shared/scene-card/scene-card';
import { ISceneService } from './scene.service.interface';
import { SHOW_LOADER } from '../interceptors/loader.interceptor';

@Injectable()
export class MixerSceneService implements ISceneService {
  private API_URL = environment.apiUrl + '/mixer/scene';

  constructor(private http: HttpClient) {}

  getScenes(): Observable<Scene[]> {
    return this.http.get<Scene[]>(this.API_URL, { context: new HttpContext().set(SHOW_LOADER, true) });
  }

  recallScene(sceneId: number): Observable<void> {
    const url = `${this.API_URL}/${sceneId}`;
    return this.http.post<void>(url, {});
  }
}