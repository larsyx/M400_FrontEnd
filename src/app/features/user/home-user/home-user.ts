import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainContainer } from '../../../shared/main-container/main-container';
import { VerticalSlider } from '../../../shared/sliders/vertical-slider/vertical-slider';
import { HorizontalSlider } from '../../../shared/sliders/horizontal-slider/horizontal-slider';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/custom-select/custom-select';
import { SliderSettingsService, SliderOrientation } from '../../../core/services/slider-settings.service';

@Component({
  selector: 'app-home-user',
  standalone: true,
  imports: [CommonModule, MainContainer, VerticalSlider, HorizontalSlider, CustomSelectComponent],
  templateUrl: './home-user.html',
  styleUrls: ['./home-user.scss']
})
export class HomeUserComponent {
  sliderOrientation = signal<SliderOrientation>('vertical');
  
  // Channel data
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
  // Tab filters
  tabs = [
    { id: 'all', label: 'Tutti', icon: '🎵' },
    { id: 'instruments', label: 'Strumenti', icon: '🎸' },
    { id: 'vocals', label: 'Voci', icon: '🎤' },
    { id: 'drums', label: 'Batteria', icon: '🥁' }
  ];
  
  activeTab: string = 'all';
  
  // Main container visibility toggle
  showMainContainer: boolean = false;
  
  // AUX selection
  auxOptions: CustomSelectOption[] = [
    { value: 'main', label: 'Main' },
    { value: 'aux1', label: 'AUX 1' },
    { value: 'aux2', label: 'AUX 2' },
    { value: 'aux3', label: 'AUX 3' },
    { value: 'aux4', label: 'AUX 4' }
  ];
  
  selectedAux: string = 'main';
  
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
  
  // Switch to selected tab
  selectTab(tabId: string): void {
    this.activeTab = tabId;
    console.log(`Active tab: ${tabId}`);
  }
  
  // Toggle main container visibility
  toggleMainContainer(): void {
    this.showMainContainer = !this.showMainContainer;
    console.log(`Main container visibility: ${this.showMainContainer}`);
  }
  
  // Handle AUX selection change
  onAuxChange(value: string): void {
    this.selectedAux = value;
    console.log(`Selected AUX: ${this.selectedAux}`);
  }
  
  // Slider event handlers
  onValueChange(index: number, newValue: number): void {
    this.channels[index].value = newValue;
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
