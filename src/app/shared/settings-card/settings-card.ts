import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-card.html',
  styleUrl: './settings-card.scss'
})
export class SettingsCardComponent {
  @Input() title: string = '';
  @Input() icon: string = '';
}
