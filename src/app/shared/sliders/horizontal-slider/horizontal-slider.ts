import { Component, Input, Output, EventEmitter, HostListener, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SliderSettingsService } from '../../../core/services/slider-settings.service';

@Component({
  selector: 'app-horizontal-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horizontal-slider.html',
  styleUrls: ['./horizontal-slider.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorizontalSlider implements OnDestroy {
  @Input() value: number = 0;
  @Input() min: number = -90; // -∞ rappresentato come -90
  @Input() max: number = 10;
  @Input() step: number = 0.5;
  @Input() label: string = 'CH';
  @Input() sublabel?: string;
  @Input() muted: boolean = false;
  @Input() showMuteButton: boolean = false;
  
  @Output() valueChange = new EventEmitter<number>();
  @Output() muteChange = new EventEmitter<boolean>();
  
  private isDragging = false;
  private trackElement: HTMLElement | null = null;
  private autoRepeatInterval: any = null;
  private autoRepeatTimeout: any = null;
  
  // Touch gesture detection
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchMoved: boolean = false;
  private isHorizontalDrag: boolean = false;
  private dragStartedOnContainer: boolean = false;
  private lastClientX: number = 0;
  
  // Dynamic height from settings (same value as width for vertical sliders)
  currentHeight: number = 60;
  
  constructor(
    private cdr: ChangeDetectorRef,
    private sliderSettings: SliderSettingsService
  ) {
    // React to width changes (applied as height for horizontal sliders)
    effect(() => {
      this.currentHeight = this.sliderSettings.sliderWidth();
      this.cdr.markForCheck();
    });
  }
  
  /**
   * Converte il valore in dB alla percentuale dello slider (0-100%)
   */
  private dbToPercentage(db: number): number {
    const points = [
      { db: 10, percent: 100 },
      { db: 5, percent: 87.5 },
      { db: 0, percent: 75 },
      { db: -10, percent: 50 },
      { db: -20, percent: 40 },
      { db: -30, percent: 30 },
      { db: -40, percent: 20 },
      { db: -50, percent: 15 },
      { db: -60, percent: 7.5 },
      { db: -70, percent: 3.75 },
      { db: -80, percent: 1.875 },
      { db: -89, percent: 0.9375 }
    ];
    
    if (db <= -90) return 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      if (db >= points[i + 1].db && db <= points[i].db) {
        const p1 = points[i + 1];
        const p2 = points[i];
        const ratio = (db - p1.db) / (p2.db - p1.db);
        return p1.percent + ratio * (p2.percent - p1.percent);
      }
    }
    
    if (db > 10) return 100;
    if (db < -89) {
      const ratio = (db + 90) / (-89 + 90);
      return ratio * 0.9375;
    }
    
    return 0;
  }
  
  /**
   * Converte la percentuale dello slider (0-100%) al valore in dB
   */
  private percentageToDb(percent: number): number {
    const points = [
      { db: 10, percent: 100 },
      { db: 5, percent: 87.5 },
      { db: 0, percent: 75 },
      { db: -10, percent: 50 },
      { db: -20, percent: 40 },
      { db: -30, percent: 30 },
      { db: -40, percent: 20 },
      { db: -50, percent: 15 },
      { db: -60, percent: 7.5 },
      { db: -70, percent: 3.75 },
      { db: -80, percent: 1.875 },
      { db: -89, percent: 0.9375 }
    ];
    
    if (percent <= 0) return -90;
    
    for (let i = 0; i < points.length - 1; i++) {
      if (percent >= points[i + 1].percent && percent <= points[i].percent) {
        const p1 = points[i + 1];
        const p2 = points[i];
        const ratio = (percent - p1.percent) / (p2.percent - p1.percent);
        return p1.db + ratio * (p2.db - p1.db);
      }
    }
    
    if (percent > 100) return 10;
    if (percent < 0.9375) {
      const ratio = percent / 0.9375;
      return -90 + ratio * 1;
    }
    
    return -90;
  }
  
  onThumbMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.dragStartedOnContainer = false;
    this.trackElement = (event.target as HTMLElement).parentElement;
  }
  
  onThumbTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.dragStartedOnContainer = false;
    this.trackElement = (event.target as HTMLElement).parentElement;
  }
  
  onTrackMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.dragStartedOnContainer = false;
    this.trackElement = event.currentTarget as HTMLElement;
    this.updateValueFromPosition(event.clientX, this.trackElement);
  }
  
  onTrackTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.dragStartedOnContainer = false;
    this.trackElement = event.currentTarget as HTMLElement;
    const touch = event.touches[0];
    this.updateValueFromPosition(touch.clientX, this.trackElement);
  }
  
  onContainerTouchStart(event: TouchEvent): void {
    // Non chiamare preventDefault qui per permettere la detection della direzione
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchMoved = false;
    this.isHorizontalDrag = false;
    this.dragStartedOnContainer = true;
    this.lastClientX = touch.clientX;
  }
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.trackElement) {
      event.preventDefault();
      this.updateValueFromPosition(event.clientX, this.trackElement);
    }
  }
  
  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
    this.trackElement = null;
  }
  
  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      
      // Se il drag è già iniziato su traccia/thumb, continua normalmente
      if (this.isDragging && this.trackElement) {
        event.preventDefault();
        this.updateValueFromPosition(touch.clientX, this.trackElement);
        return;
      }
      
      // Altrimenti gestisci il drag sul container con detection della direzione
      if (this.dragStartedOnContainer && !this.touchMoved) {
        const deltaX = Math.abs(touch.clientX - this.touchStartX);
        const deltaY = Math.abs(touch.clientY - this.touchStartY);
        
        // Soglia minima di movimento per determinare la direzione (5px)
        if (deltaX > 5 || deltaY > 5) {
          this.touchMoved = true;
          
          // Se il movimento orizzontale è maggiore di quello verticale, è un drag orizzontale
          if (deltaX > deltaY) {
            this.isHorizontalDrag = true;
            event.preventDefault(); // Previeni lo scroll solo se è un drag orizzontale
          } else {
            // Movimento verticale - permetti lo scroll della pagina
            this.dragStartedOnContainer = false;
            return;
          }
        } else {
          return;
        }
      }
      
      if (this.dragStartedOnContainer && this.isHorizontalDrag) {
        event.preventDefault();
        this.updateValueFromRelativeMovement(touch.clientX);
      }
    }
  }
  
  @HostListener('document:touchend')
  @HostListener('document:touchcancel')
  onTouchEnd(): void {
    this.isDragging = false;
    this.trackElement = null;
    this.touchMoved = false;
    this.isHorizontalDrag = false;
    this.dragStartedOnContainer = false;
  }
  
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      event.stopPropagation();
      
      const delta = event.deltaY > 0 ? -this.step : this.step;
      this.updateValue(this.value + delta);
    }
  }
  
  private updateValueFromPosition(clientX: number, track: HTMLElement): void {
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left;
    const sliderPercent = (x / rect.width) * 100; // 0-100%
    const dbValue = this.percentageToDb(sliderPercent);
    this.updateValue(dbValue);
  }
  private updateValueFromRelativeMovement(clientX: number): void {
    // Calcola il delta in pixel rispetto all'ultima posizione
    const deltaX = clientX - this.lastClientX;
    this.lastClientX = clientX;
    
    // Sensibilità molto ridotta per movimento più lineare e controllabile
    // Aumentato il divisore da 3 a 5 per rendere il movimento più fluido
    const sensitivity = 5;
    const pixelToValueRatio = (this.max - this.min) / (300 * sensitivity);
    const deltaValue = deltaX * pixelToValueRatio;
    
    // Aggiorna il valore relativamente
    const newValue = this.value + deltaValue;
    this.updateValue(newValue);
  }
  
  
  updateValue(newValue: number): void {
    newValue = Math.max(this.min, Math.min(this.max, newValue));
    newValue = Math.round(newValue / this.step) * this.step;
    
    if (this.value !== newValue) {
      this.value = newValue;
      this.valueChange.emit(this.value);
      this.cdr.markForCheck();
    }
  }
  
  increment(): void {
    this.updateValue(this.value + this.step);
  }
  
  decrement(): void {
    this.updateValue(this.value - this.step);
  }
  
  startAutoRepeat(direction: 'increment' | 'decrement'): void {
    if (direction === 'increment') {
      this.increment();
    } else {
      this.decrement();
    }
    
    this.autoRepeatTimeout = setTimeout(() => {
      this.autoRepeatInterval = setInterval(() => {
        if (direction === 'increment') {
          this.increment();
        } else {
          this.decrement();
        }
      }, 100);
    }, 500);
  }
  
  stopAutoRepeat(): void {
    if (this.autoRepeatTimeout) {
      clearTimeout(this.autoRepeatTimeout);
      this.autoRepeatTimeout = null;
    }
    if (this.autoRepeatInterval) {
      clearInterval(this.autoRepeatInterval);
      this.autoRepeatInterval = null;
    }
  }
  
  ngOnDestroy(): void {
    this.stopAutoRepeat();
  }
  
  toggleMute(): void {
    this.muted = !this.muted;
    this.muteChange.emit(this.muted);
  }
  
  getThumbPosition(): number {
    return this.dbToPercentage(this.value);
  }
  
  getFormattedValue(): string {
    if (this.value <= -89.5) return '-∞';
    return this.value.toFixed(1);
  }
}
