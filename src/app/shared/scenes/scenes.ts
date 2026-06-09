import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SceneCardComponent, Scene } from '../scene-card/scene-card';
import { ISceneService, SCENE_SERVICE } from '../../core/services/scene.service.interface';
import { UserService } from '../../core/services/user.service';

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

  constructor(
    @Inject(SCENE_SERVICE) private sceneService: ISceneService,
    private router: Router,
    private userService: UserService
  ) {}

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
    // mode mixer or user
    const currentPath = this.router.url;
    const isUserMode = currentPath.includes('/user/');
    
    if (isUserMode) {
      this.userService.setCurrentScene(scene.id, scene.name);
      this.router.navigate(['/app/user/home']).then(
        success => console.log('Navigazione riuscita:', success),
        error => console.error('Errore navigazione:', error)
      );
    } else {
      console.log('Modalità MIXER: chiamata API recall');
      this.sceneService.recallScene(scene.id).subscribe({
        next: () => {
          console.log('Scena richiamata con successo:', scene.name);
        },
        error: (err) => {
          console.error('Errore nel richiamare la scena:', err);
        }
      });
    }
  }
}
