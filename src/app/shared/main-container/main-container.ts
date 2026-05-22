import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerticalSlider } from '../sliders/vertical-slider/vertical-slider';
import { Fader } from '../../core/models/fader.model';
import { TypeRequest } from '../../core/services/websocket.service';

@Component({
  selector: 'app-main-container',
  standalone: true,
  imports: [CommonModule, VerticalSlider],
  templateUrl: './main-container.html',
  styleUrl: './main-container.scss'
})
export class MainContainer {
  @Input() fader!: Fader;
  @Output() faderChange = new EventEmitter<{fader: Fader, type: TypeRequest}>();

  onValueChange(value: number): void {
    this.fader.value = value;
    this.faderChange.emit({fader: this.fader!, type: TypeRequest.SLIDER_VALUE});
  }

  onSwitchChange(value: boolean): void {
    this.fader.switch = value;
    this.faderChange.emit({fader: this.fader!, type: TypeRequest.SLIDER_VALUE});
  }
}
