import { Component, signal, effect, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerticalSlider } from '../../vertical-slider/vertical-slider';
import { HorizontalSlider } from '../../horizontal-slider/horizontal-slider';
import { SliderSettingsService, SliderOrientation } from '../../../../core/services/slider-settings.service';
import { Fader } from '../../../../core/models/fader.model';

@Component({
  selector: 'app-sliders-container',
  imports: [CommonModule, VerticalSlider, HorizontalSlider],
  templateUrl: './sliders-container.html',
  styleUrl: './sliders-container.scss',
})
export class SlidersContainer {
  sliderOrientation = signal<SliderOrientation>('vertical');

  @Input() channels: Fader[] = [
    { id: 0, name: 'CH 1', description: 'Bass', value: -12, switch: false,link: false },
    { id: 1, name: 'CH 2', description: 'Guitar', value: -6, switch: false, link: false },
    { id: 2, name: 'CH 3', description: 'Vocals', value: 0, switch: false, link: false },
    { id: 3, name: 'CH 4', description: 'Drums', value: -18, switch: true, link: false }, 
    { id: 4, name: 'CH 5', description: 'Bass', value: -12, switch: false, link: false },
    { id: 5, name: 'CH 6', description: 'Guitar', value: -6, switch: false, link: false },
    { id: 6, name: 'CH 7', description: 'Vocals', value: 0, switch: false, link: false },
    { id: 7, name: 'CH 8', description: 'Drums', value: -18, switch: true, link: false },
    { id: 8, name: 'CH 9', description: 'Bass', value: -12, switch: false, link: false },
    { id: 9, name: 'CH 10', description: 'Guitar', value: -6, switch: false, link: false },
    { id: 10, name: 'CH 11', description: 'Vocals', value: 0, switch: false, link: false },
    { id: 11, name: 'CH 12', description: 'Drums', value: -18, switch: true, link: false }
  ];

  @Output() faderChange = new EventEmitter<Fader>();
  

  selectedSliderId: number | null = null;

  constructor(private sliderSettings: SliderSettingsService) {
    // Sync with slider settings service
    effect(() => {
      this.sliderOrientation.set(this.sliderSettings.sliderOrientation());
    });
  }
  
  ngOnInit(): void {
    // Initialize from service
    this.sliderOrientation.set(this.sliderSettings.getOrientation());
  }

  onValueChange(index: number, newValue: number): void {
    this.channels[index].value = newValue;
    // Select slider when value changes
    this.selectSlider(this.channels[index].id);
    //console.log(`${this.channels[index].description}: ${newValue.toFixed(1)} dB`);
    this.faderChange.emit(this.channels[index])
  
  }

  onMuteChange(index: number, muted: boolean): void {
    this.channels[index].switch = muted;
    console.log(`${this.channels[index].description}: ${muted ? 'Muted' : 'Unmuted'}`);
  }

  selectSlider(id: number): void {
    this.selectedSliderId = id;
    console.log(`Selected slider ID: ${id}`);
  }

  isSelected(id: number): boolean {
    return this.selectedSliderId === id;
  }
}
