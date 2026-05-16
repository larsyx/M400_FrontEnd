import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Scene {
  id: number;
  name: string;
}

@Component({
  selector: 'app-scene-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scene-card.html',
  styleUrl: './scene-card.scss'
})
export class SceneCardComponent {
  @Input() scene!: Scene;
  @Output() recallScene = new EventEmitter<Scene>();

  onRecallClick(): void {
    this.recallScene.emit(this.scene);
  }
}