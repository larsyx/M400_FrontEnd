import { Component, Input, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vertical-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vertical-slider.html',
  styleUrls: ['./vertical-slider.scss']
})
export class VerticalSlider implements OnDestroy {
  @Input() value: number = 0;
  @Input() min: number = -60;
  @Input() max: number = 12;
  @Input() step: number = 0.5;
  @Input() label: string = 'CH';
  @Input() sublabel?: string;
  @Input() muted: boolean = false;
  @Input() showMuteButton: boolean = true;
  
  @Output() valueChange = new EventEmitter<number>();
  @Output() muteChange = new EventEmitter<boolean>();
  
  private isDragging = false;
  private trackElement: HTMLElement | null = null;
  private autoRepeatInterval: any = null;
  private autoRepeatTimeout: any = null;
  
  onThumbMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.trackElement = (event.target as HTMLElement).parentElement;
  }
  
  onThumbTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.trackElement = (event.target as HTMLElement).parentElement;
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
    if (this.isDragging && this.trackElement && event.touches.length === 1) {
      event.preventDefault();
      this.updateValueFromPosition(event.touches[0].clientY, this.trackElement);
    }
  }
  
  @HostListener('document:touchend')
  onTouchEnd(): void {
    this.isDragging = false;
    this.trackElement = null;
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
      
      // Shift per movimenti più fini (1/10 dello step)
      const modifier = event.shiftKey ? 0.1 : 1;
      
      this.updateValue(this.value + (delta * modifier));
    }
  }
  
  private updateValueFromPosition(clientY: number, track: HTMLElement): void {
    const rect = track.getBoundingClientRect();
    const y = clientY - rect.top;
    const percentage = 1 - (y / rect.height);
    const rawValue = this.min + (percentage * (this.max - this.min));
    this.updateValue(rawValue);
  }
  
  private updateValue(newValue: number): void {
    newValue = Math.max(this.min, Math.min(this.max, newValue));
    newValue = Math.round(newValue / this.step) * this.step;
    
    if (this.value !== newValue) {
      this.value = newValue;
      this.valueChange.emit(this.value);
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
  }
  
  toggleMute(): void {
    this.muted = !this.muted;
    this.muteChange.emit(this.muted);
  }
  
  getThumbPosition(): number {
    const percentage = (this.value - this.min) / (this.max - this.min);
    return percentage * 100;
  }
  
  getFormattedValue(): string {
    if (this.value <= this.min) return '-∞';
    return this.value.toFixed(1);
  }
}