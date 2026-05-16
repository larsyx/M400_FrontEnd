import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SliderSettingsService {
  private platformId = inject(PLATFORM_ID);
  private readonly WIDTH_KEY = 'slider-width';
  
  // Signal for reactive slider width state
  sliderWidth = signal<number>(60);

  constructor() {
    this.initializeWidth();
  }

  private initializeWidth(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedWidth = localStorage.getItem(this.WIDTH_KEY);
      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (width >= 60 && width <= 130) {
          this.sliderWidth.set(width);
        }
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
}
