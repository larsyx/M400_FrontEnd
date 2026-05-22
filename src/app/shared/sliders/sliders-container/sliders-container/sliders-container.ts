import { Component, signal, effect, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerticalSlider } from '../../vertical-slider/vertical-slider';
import { HorizontalSlider } from '../../horizontal-slider/horizontal-slider';
import { SliderSettingsService, SliderOrientation } from '../../../../core/services/slider-settings.service';
import { Fader } from '../../../../core/models/fader.model';
import { TypeRequest } from '../../../../core/services/websocket.service';

@Component({
  selector: 'app-sliders-container',
  imports: [CommonModule, VerticalSlider, HorizontalSlider],
  templateUrl: './sliders-container.html',
  styleUrl: './sliders-container.scss',
})
export class SlidersContainer {
  sliderOrientation = signal<SliderOrientation>('vertical');

  @Input() channels: Fader[] = [];

  @Output() faderChange = new EventEmitter<{fader: Fader, type: TypeRequest}>();
  

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
    this.faderChange.emit({fader: this.channels[index], type: TypeRequest.SLIDER_VALUE})
  
  }

  onMuteChange(index: number, muted: boolean): void {
    this.channels[index].switch = muted;
    this.faderChange.emit({fader: this.channels[index], type: TypeRequest.SLIDER_SWITCH})
  }

  selectSlider(id: number): void {
    this.selectedSliderId = id;
    console.log(`Selected slider ID: ${id}`);
  }

  isSelected(id: number): boolean {
    return this.selectedSliderId === id;
  }
}
