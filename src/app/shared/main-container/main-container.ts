import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerticalSlider } from '../sliders/vertical-slider/vertical-slider';

@Component({
  selector: 'app-main-container',
  standalone: true,
  imports: [CommonModule, VerticalSlider],
  templateUrl: './main-container.html',
  styleUrl: './main-container.scss'
})
export class MainContainer {
  mainValue: number = 0;

  onValueChange(value: number): void {
    this.mainValue = value;
    console.log('Main value:', value);
  }
}
