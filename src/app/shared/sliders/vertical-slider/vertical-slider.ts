import { Component, Input, Output, EventEmitter, HostListener, OnDestroy, AfterViewInit, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnobComponent } from '../../knob/knob';
import { SliderSettingsService } from '../../../core/services/slider-settings.service';

@Component({
  selector: 'app-vertical-slider',
  standalone: true,
  imports: [CommonModule, KnobComponent],
  templateUrl: './vertical-slider.html',
  styleUrls: ['./vertical-slider.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerticalSlider implements OnDestroy, AfterViewInit {
  @Input() value: number = 0;
  @Input() min: number = -90; // -∞ rappresentato come -90
  @Input() max: number = 10;
  @Input() step: number = 0.5;
  @Input() label: string = 'CH';
  @Input() sublabel?: string;
  @Input() muted: boolean = false;
  @Input() showMuteButton: boolean = true;
  @Input() isSelected: boolean = false;
  
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
  private isVerticalDrag: boolean = false;
  private dragStartedOnContainer: boolean = false;
  private lastClientY: number = 0;
  
  // Modalità compatta (knob invece di fader)
  useCompactMode: boolean = false;
  hideSublabel: boolean = false; // Nasconde sublabel sotto i 400px
  hideLabel: boolean = false; // Nasconde anche il label sotto i 100px
  private resizeObserver?: ResizeObserver;
  
  // Dynamic width from settings
  currentWidth: number = 60;
  
  constructor(
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef,
    private sliderSettings: SliderSettingsService
  ) {
    // React to width changes
    effect(() => {
      this.currentWidth = this.sliderSettings.sliderWidth();
      this.cdr.markForCheck();
    });
  }
  
  ngAfterViewInit() {
    this.checkHeight();
    
    // Osserva i cambiamenti di dimensione
    this.resizeObserver = new ResizeObserver(() => {
      this.checkHeight();
    });
    
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }
  
  private checkHeight() {
    const height = this.elementRef.nativeElement.offsetHeight;
    const shouldUseCompact = height < 320;
    const shouldHideSublabel = height < 150;
    const shouldHideLabel = height < 100;
    
    if (this.useCompactMode !== shouldUseCompact ||
        this.hideSublabel !== shouldHideSublabel ||
        this.hideLabel !== shouldHideLabel) {
      this.useCompactMode = shouldUseCompact;
      this.hideSublabel = shouldHideSublabel;
      this.hideLabel = shouldHideLabel;
      this.cdr.markForCheck();
    }
  }
  
  /**
   * Converte il valore in dB alla percentuale dello slider (0-100%)
   * Scala logaritmica audio professionale:
   * +10dB → 100%
   * +5dB → 87.5%
   * 0dB → 75%
   * -10dB → 50%
   * -20dB → 40%
   * -30dB → 30%
   * -40dB → 20%
   * -50dB → 15%
   * -60dB → 7.5%
   * -89dB → ~0.1%
   * -∞ → 0%
   */
  private dbToPercentage(db: number): number {
    // Punti di riferimento della curva
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
    
    // Gestione -∞
    if (db <= -90) return 0;
    
    // Trova i due punti tra cui interpolare
    for (let i = 0; i < points.length - 1; i++) {
      if (db >= points[i + 1].db && db <= points[i].db) {
        const p1 = points[i + 1];
        const p2 = points[i];
        
        // Interpolazione lineare tra i punti
        const ratio = (db - p1.db) / (p2.db - p1.db);
        return p1.percent + ratio * (p2.percent - p1.percent);
      }
    }
    
    // Valori fuori range
    if (db > 10) return 100;
    if (db < -89) {
      // Zona molto bassa, scala logaritmica verso 0
      const ratio = (db + 90) / (-89 + 90);
      return ratio * 0.9375; // 0.9375 è la percentuale a -89dB
    }
    
    return 0;
  }
  
  /**
   * Converte la percentuale dello slider (0-100%) al valore in dB
   */
  private percentageToDb(percent: number): number {
    // Punti di riferimento della curva (gli stessi di sopra)
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
    
    // Gestione 0% → -∞
    if (percent <= 0) return -90;
    
    // Trova i due punti tra cui interpolare
    for (let i = 0; i < points.length - 1; i++) {
      if (percent >= points[i + 1].percent && percent <= points[i].percent) {
        const p1 = points[i + 1];
        const p2 = points[i];
        
        // Interpolazione lineare tra i punti
        const ratio = (percent - p1.percent) / (p2.percent - p1.percent);
        return p1.db + ratio * (p2.db - p1.db);
      }
    }
    
    // Valori fuori range
    if (percent > 100) return 10;
    if (percent < 0.9375) {
      // Zona molto bassa
      const ratio = percent / 0.9375;
      return -90 + ratio * 1; // da -90 a -89
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
    this.updateValueFromPosition(event.clientY, this.trackElement);
  }
  
  onTrackTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.dragStartedOnContainer = false;
    this.trackElement = event.currentTarget as HTMLElement;
    const touch = event.touches[0];
    this.updateValueFromPosition(touch.clientY, this.trackElement);
  }
  
  onContainerTouchStart(event: TouchEvent): void {
    // Non chiamare preventDefault qui per permettere la detection della direzione
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchMoved = false;
    this.isVerticalDrag = false;
    this.dragStartedOnContainer = true;
    this.lastClientY = touch.clientY;
  }
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.trackElement) {
      event.preventDefault();
      this.updateValueFromPosition(event.clientY, this.trackElement);
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
        this.updateValueFromPosition(touch.clientY, this.trackElement);
        return;
      }
      
      // Altrimenti gestisci il drag sul container con detection della direzione
      if (this.dragStartedOnContainer && !this.touchMoved) {
        const deltaX = Math.abs(touch.clientX - this.touchStartX);
        const deltaY = Math.abs(touch.clientY - this.touchStartY);
        
        // Soglia minima di movimento per determinare la direzione (5px)
        if (deltaX > 5 || deltaY > 5) {
          this.touchMoved = true;
          
          // Se il movimento verticale è maggiore di quello orizzontale, è un drag verticale
          if (deltaY > deltaX) {
            this.isVerticalDrag = true;
            event.preventDefault(); // Previeni lo scroll solo se è un drag verticale
          } else {
            // Movimento orizzontale - permetti lo scroll della pagina
            this.dragStartedOnContainer = false;
            return;
          }
        } else {
          return;
        }
      }
      
      if (this.dragStartedOnContainer && this.isVerticalDrag) {
        event.preventDefault();
        this.updateValueFromRelativeMovement(touch.clientY);
      }
    }
  }
  
  @HostListener('document:touchend')
  @HostListener('document:touchcancel')
  onTouchEnd(): void {
    this.isDragging = false;
    this.trackElement = null;
    this.touchMoved = false;
    this.isVerticalDrag = false;
    this.dragStartedOnContainer = false;
  }
  
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    // Solo scroll verticale (deltaY), ignora scroll orizzontale (deltaX)
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      event.stopPropagation();
      
      // deltaY positivo = scroll down = decrementa valore
      // deltaY negativo = scroll up = incrementa valore
      const delta = event.deltaY > 0 ? -this.step : this.step;
      
      this.updateValue(this.value + delta);
    }
  }
  
  private updateValueFromPosition(clientY: number, track: HTMLElement): void {
    const rect = track.getBoundingClientRect();
    const y = clientY - rect.top;
    const sliderPercent = (1 - (y / rect.height)) * 100; // 0-100%
    const dbValue = this.percentageToDb(sliderPercent);
    this.updateValue(dbValue);
  }
  
  private updateValueFromRelativeMovement(clientY: number): void {
    // Calcola il delta in pixel rispetto all'ultima posizione
    const deltaY = this.lastClientY - clientY; // Invertito perché Y cresce verso il basso
    this.lastClientY = clientY;
    
    // Sensibilità molto ridotta per movimento più lineare e controllabile
    // Aumentato il divisore da 3 a 5 per rendere il movimento più fluido
    const sensitivity = 5;
    const pixelToValueRatio = (this.max - this.min) / (300 * sensitivity);
    const deltaValue = deltaY * pixelToValueRatio;
    
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
      this.cdr.markForCheck(); // Trigger change detection only when value changes
    }
  }
  
  increment(): void {
    this.updateValue(this.value + this.step);
  }
  
  decrement(): void {
    this.updateValue(this.value - this.step);
  }
  
  startAutoRepeat(direction: 'increment' | 'decrement'): void {
    // Prima esecuzione immediata
    if (direction === 'increment') {
      this.increment();
    } else {
      this.decrement();
    }
    
    // Ritardo iniziale prima di iniziare l'auto-repeat
    this.autoRepeatTimeout = setTimeout(() => {
      this.autoRepeatInterval = setInterval(() => {
        if (direction === 'increment') {
          this.increment();
        } else {
          this.decrement();
        }
      }, 100); // Ripeti ogni 100ms
    }, 500); // Attendi 500ms prima di iniziare l'auto-repeat
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
    
    // Cleanup ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
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