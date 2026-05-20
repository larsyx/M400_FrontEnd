import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type SliderOrientation = 'vertical' | 'horizontal';

@Injectable({
  providedIn: 'root'
})
export class SliderSettingsService {
  private platformId = inject(PLATFORM_ID);
  private readonly WIDTH_KEY = 'slider-width';
  private readonly ORIENTATION_KEY = 'slider-orientation';
  
  // Signal for reactive slider width state
  sliderWidth = signal<number>(60);
  
  // Signal for reactive slider orientation state
  sliderOrientation = signal<SliderOrientation>('vertical');

  constructor() {
    this.initializeSettings();
  }

  private initializeSettings(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize width
      const savedWidth = localStorage.getItem(this.WIDTH_KEY);
      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (width >= 60 && width <= 130) {
          this.sliderWidth.set(width);
        }
      }
      
      // Initialize orientation
      const savedOrientation = localStorage.getItem(this.ORIENTATION_KEY) as SliderOrientation;
      if (savedOrientation === 'vertical' || savedOrientation === 'horizontal') {
        this.sliderOrientation.set(savedOrientation);
      }
    }
  }

  setWidth(width: number): void {
    if (width >= 60 && width <= 130) {
      this.sliderWidth.set(width);
      
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.WIDTH_KEY, width.toString());
      }
    }
  }

  getWidth(): number {
    return this.sliderWidth();
  }
  
  setOrientation(orientation: SliderOrientation): void {
    this.sliderOrientation.set(orientation);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.ORIENTATION_KEY, orientation);
    }
  }
  
  getOrientation(): SliderOrientation {
    return this.sliderOrientation();
  }
}
