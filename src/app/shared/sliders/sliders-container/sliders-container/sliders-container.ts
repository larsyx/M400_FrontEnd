import { Component } from '@angular/core';
import { VerticalSlider } from '../../vertical-slider/vertical-slider';

@Component({
  selector: 'app-sliders-container',
  imports: [VerticalSlider],
  templateUrl: './sliders-container.html',
  styleUrl: './sliders-container.scss',
})
export class SlidersContainer {
    channels = [
    { label: 'CH 1', sublabel: 'Bass', value: -12, muted: false },
    { label: 'CH 2', sublabel: 'Guitar', value: -6, muted: false },
    { label: 'CH 3', sublabel: 'Vocals', value: 0, muted: false },
    { label: 'CH 4', sublabel: 'Drums', value: -18, muted: true },
    
    { label: 'CH 1', sublabel: 'Bass', value: -12, muted: false },
    { label: 'CH 2', sublabel: 'Guitar', value: -6, muted: false },
    { label: 'CH 3', sublabel: 'Vocals', value: 0, muted: false },
    { label: 'CH 4', sublabel: 'Drums', value: -18, muted: true },
    
    { label: 'CH 1', sublabel: 'Bass', value: -12, muted: false },
    { label: 'CH 2', sublabel: 'Guitar', value: -6, muted: false },
    { label: 'CH 3', sublabel: 'Vocals', value: 0, muted: false },
    { label: 'CH 4', sublabel: 'Drums', value: -18, muted: true },
    
    { label: 'MAIN', sublabel: 'Master', value: -3, muted: false }
  ];


  onValueChange(index: number, newValue: number): void {
    this.channels[index].value = newValue;
    console.log(`${this.channels[index].label}: ${newValue.toFixed(1)} dB`);
  }

  onMuteChange(index: number, muted: boolean): void {
    this.channels[index].muted = muted;
    console.log(`${this.channels[index].label}: ${muted ? 'Muted' : 'Unmuted'}`);
  }
}
