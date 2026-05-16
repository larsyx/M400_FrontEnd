import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SceneCardComponent, Scene } from '../../../../shared/scene-card/scene-card';

@Component({
  selector: 'app-scenes',
  standalone: true,
  imports: [CommonModule, SceneCardComponent],
  templateUrl: './scenes.html',
  styleUrl: './scenes.scss'
})
export class ScenesComponent implements OnInit {
  scenes: Scene[] = [];

  ngOnInit(): void {

    this.scenes = [
      { id: 1, name: 'Scena Principale' },
      { id: 2, name: 'Scena Worship' },
      { id: 3, name: 'Scena Predicazione' },
      { id: 4, name: 'Scena Musica Soft' },
      { id: 5, name: 'Scena Conferenza' },
      { id: 6, name: 'Scena Live Band' },
      { id: 7, name: 'Scena Acustica' },
      { id: 8, name: 'Scena Teatro' }
    ];
  }

  onRecallScene(scene: Scene): void {
    console.log('Richiamando scena:', scene);
    // Implementare la logica per richiamare la scena
  }
}
