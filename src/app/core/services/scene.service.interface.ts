import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Scene } from '../../shared/scene-card/scene-card';

export interface ISceneService {
  getScenes(): Observable<Scene[]>;
  recallScene(sceneId: number): Observable<void>;
}

export const SCENE_SERVICE = new InjectionToken<ISceneService>('SCENE_SERVICE');