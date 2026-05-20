import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SceneCardComponent, Scene } from '../scene-card/scene-card';
import { ISceneService, SCENE_SERVICE } from '../../core/services/scene.service.interface';

@Component({
  selector: 'app-scenes',
  standalone: true,
  imports: [CommonModule, SceneCardComponent],
  templateUrl: './scenes.html',
  styleUrl: './scenes.scss'
})
export class ScenesComponent implements OnInit {
  scenes: Scene[] = [];
  loading = false;
  error: string | null = null;

  constructor(@Inject(SCENE_SERVICE) private sceneService: ISceneService) {}

  ngOnInit(): void {
    this.loadScenes();
  }

  loadScenes(): void {
    this.loading = true;
    this.error = null;
    
    this.sceneService.getScenes().subscribe({
      next: (scenes) => {
        this.scenes = scenes;
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento delle scene:', err);
        this.error = 'Impossibile caricare le scene';
        this.loading = false;
      }
    });
  }

  onRecallScene(scene: Scene): void {
    console.log('Richiamando scena:', scene);
    
    this.sceneService.recallScene(scene.id).subscribe({
      next: () => {
        console.log('Scena richiamata con successo:', scene.name);
        // Opzionale: mostrare un messaggio di successo
      },
      error: (err) => {
        console.error('Errore nel richiamare la scena:', err);
        // Opzionale: mostrare un messaggio di errore
      }
    });
  }
}
