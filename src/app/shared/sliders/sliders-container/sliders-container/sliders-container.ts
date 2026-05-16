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
    { id: 0, label: 'CH 1', sublabel: 'Bass', value: -12, muted: false },
    { id: 1, label: 'CH 2', sublabel: 'Guitar', value: -6, muted: false },
    { id: 2, label: 'CH 3', sublabel: 'Vocals', value: 0, muted: false },
    { id: 3, label: 'CH 4', sublabel: 'Drums', value: -18, muted: true },
    
    { id: 4, label: 'CH 5', sublabel: 'Bass', value: -12, muted: false },
    { id: 5, label: 'CH 6', sublabel: 'Guitar', value: -6, muted: false },
    { id: 6, label: 'CH 7', sublabel: 'Vocals', value: 0, muted: false },
    { id: 7, label: 'CH 8', sublabel: 'Drums', value: -18, muted: true },
    
    { id: 8, label: 'CH 9', sublabel: 'Bass', value: -12, muted: false },
    { id: 9, label: 'CH 10', sublabel: 'Guitar', value: -6, muted: false },
    { id: 10, label: 'CH 11', sublabel: 'Vocals', value: 0, muted: false },
    { id: 11, label: 'CH 12', sublabel: 'Drums', value: -18, muted: true },
    
    { id: 12, label: 'MAIN', sublabel: 'Master', value: -3, muted: false }
  ];

  selectedSliderId: number | null = null;

  onValueChange(index: number, newValue: number): void {
    this.channels[index].value = newValue;
    // Select slider when value changes
    this.selectSlider(this.channels[index].id);
    console.log(`${this.channels[index].label}: ${newValue.toFixed(1)} dB`);
  }

  onMuteChange(index: number, muted: boolean): void {
    this.channels[index].muted = muted;
    console.log(`${this.channels[index].label}: ${muted ? 'Muted' : 'Unmuted'}`);
  }

  selectSlider(id: number): void {
    this.selectedSliderId = id;
    console.log(`Selected slider ID: ${id}`);
  }

  isSelected(id: number): boolean {
    return this.selectedSliderId === id;
  }
}
