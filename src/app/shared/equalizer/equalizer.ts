import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KnobComponent } from '../knob/knob';

export interface EQBand {
  type: 'low-shelf' | 'parametric' | 'high-shelf';
  label: string;
  frequency: number;
  gain: number;
  q?: number;
  freqMin: number;
  freqMax: number;
}

type DragParameter = 'frequency' | 'gain' | 'q';

interface DragState {
  bandIndex: number;
  parameter: DragParameter;
  startY: number;
  startX: number;
  startValue: number;
}

@Component({
  selector: 'app-equalizer',
  standalone: true,
  imports: [CommonModule, FormsModule, KnobComponent],
  templateUrl: './equalizer.html',
  styleUrl: './equalizer.scss',
})
export class Equalizer implements AfterViewInit {
  @ViewChild('eqGraph', { static: false }) eqGraphRef!: ElementRef<SVGSVGElement>;
  
  graphWidth = 800;
  graphHeight = 300;
  graphPadding = { top: 20, right: 40, bottom: 40, left: 60 };
  
  minFreq = 20;
  maxFreq = 20000;
  
  minGain = -15;
  maxGain = 15;

  value!: number;
  
  draggedBandIndex: number | null = null;
  private dragState: DragState | null = null;
  
  @Input() bands: EQBand[] = [
    { type: 'low-shelf', label: 'BASSI', frequency: 100, gain: 0, freqMin: 20, freqMax: 500 },
    { type: 'parametric', label: 'BASSI-MEDI', frequency: 500, gain: 0, q: 1.0, freqMin: 200, freqMax: 2000 },
    { type: 'parametric', label: 'MEDIO-ALTI', frequency: 2000, gain: 0, q: 1.0, freqMin: 1000, freqMax: 8000 },
    { type: 'high-shelf', label: 'ALTI', frequency: 8000, gain: 0, freqMin: 4000, freqMax: 20000 }
  ];

  @Output() bandsChange = new EventEmitter<EQBand[]>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.updateGraph();
  }

  startDrag(event: MouseEvent | TouchEvent, bandIndex: number, parameter: DragParameter): void {
    event.preventDefault();
    
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    
    let startValue: number;
    const band = this.bands[bandIndex];
    
    switch (parameter) {
      case 'frequency': startValue = band.frequency; break;
      case 'gain': startValue = band.gain; break;
      case 'q': startValue = band.q || 1.0; break;
    }
    
    this.dragState = { bandIndex, parameter, startY: clientY, startX: clientX, startValue };
    
    if (event.target instanceof HTMLElement) {
      event.target.classList.add('dragging');
    }
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onDocumentMove(event: MouseEvent | TouchEvent): void {
    if (!this.dragState) return;
    
    event.preventDefault();
    
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    
    const deltaY = this.dragState.startY - clientY;
    const deltaX = clientX - this.dragState.startX;
    
    const band = this.bands[this.dragState.bandIndex];
    
    switch (this.dragState.parameter) {
      case 'frequency':
        const logMin = Math.log10(band.freqMin);
        const logMax = Math.log10(band.freqMax);
        const logRange = logMax - logMin;
        const logDelta = (deltaX / 200) * logRange;
        const logCurrent = Math.log10(this.dragState.startValue);
        const newLogFreq = Math.max(logMin, Math.min(logMax, logCurrent + logDelta));
        band.frequency = Math.round(Math.pow(10, newLogFreq));
        break;
        
      case 'gain':
        const gainSensitivity = 0.1;
        const newGain = this.dragState.startValue + (deltaY * gainSensitivity);
        band.gain = Math.max(this.minGain, Math.min(this.maxGain, Math.round(newGain * 10) / 10));
        break;
        
      case 'q':
        const qSensitivity = 0.02;
        const newQ = this.dragState.startValue + (deltaY * qSensitivity);
        if (band.q !== undefined) {
          band.q = Math.max(0.3, Math.min(10, Math.round(newQ * 10) / 10));
        }
        break;
    }
    
    this.updateGraph();
    this.bandsChange.emit(this.bands);
    this.cdr.markForCheck();
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onDocumentUp(event: MouseEvent | TouchEvent): void {
    if (this.dragState) {
      const draggingElements = document.querySelectorAll('.draggable-input.dragging');
      draggingElements.forEach(el => el.classList.remove('dragging'));
      this.dragState = null;
    }
  }

  onFrequencyChange(index: number, value: number): void {
    this.bands[index].frequency = value;
    this.bandsChange.emit(this.bands);
  }

  onGainChange(index: number, value: number): void {
    this.bands[index].gain = value;
    this.bandsChange.emit(this.bands);
  }

  onQChange(index: number, value: number): void {
    if (this.bands[index].q !== undefined) {
      this.bands[index].q = value;
      this.bandsChange.emit(this.bands);
    }
  }

  getFrequencyLabel(freq: number): string {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}k`;
    }
    return `${freq}`;
  }

  getGainLabel(gain: number): string {
    const sign = gain > 0 ? '+' : '';
    return `${sign}${gain.toFixed(1)}`;
  }

  freqToX(freq: number): number {
    const logMin = Math.log10(this.minFreq);
    const logMax = Math.log10(this.maxFreq);
    const logFreq = Math.log10(freq);
    const ratio = (logFreq - logMin) / (logMax - logMin);
    return this.graphPadding.left + ratio * (this.graphWidth - this.graphPadding.left - this.graphPadding.right);
  }

  xToFreq(x: number): number {
    const ratio = (x - this.graphPadding.left) / (this.graphWidth - this.graphPadding.left - this.graphPadding.right);
    const logMin = Math.log10(this.minFreq);
    const logMax = Math.log10(this.maxFreq);
    const logFreq = logMin + ratio * (logMax - logMin);
    return Math.pow(10, logFreq);
  }

  gainToY(gain: number): number {
    const ratio = (gain - this.minGain) / (this.maxGain - this.minGain);
    return this.graphHeight - this.graphPadding.bottom - ratio * (this.graphHeight - this.graphPadding.top - this.graphPadding.bottom);
  }

  yToGain(y: number): number {
    const ratio = (this.graphHeight - this.graphPadding.bottom - y) / (this.graphHeight - this.graphPadding.top - this.graphPadding.bottom);
    return this.minGain + ratio * (this.maxGain - this.minGain);
  }

  getBandColor(index: number): string {
    const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'];
    return colors[index] || '#95a5a6';
  }

  calculateResponse(freq: number): number {
    let totalGain = 0;
    
    for (const band of this.bands) {
      if (band.type === 'low-shelf') {
        const ratio = freq / band.frequency;
        const slope = 2;
        const response = 1 / (1 + Math.pow(ratio, slope));
        totalGain += band.gain * response;
      } else if (band.type === 'high-shelf') {
        const ratio = band.frequency / freq;
        const slope = 2;
        const response = 1 / (1 + Math.pow(ratio, slope));
        totalGain += band.gain * response;
      } else if (band.type === 'parametric' && band.q) {
        const denominator = 1 + Math.pow((freq / band.frequency) - (band.frequency / freq), 2) / (band.q * band.q);
        const response = band.gain / denominator;
        totalGain += response;
      }
    }
    
    return Math.max(this.minGain, Math.min(this.maxGain, totalGain));
  }

  getCurvePath(): string {
    const points: string[] = [];
    const numPoints = 200;
    
    for (let i = 0; i <= numPoints; i++) {
      const ratio = i / numPoints;
      const logMin = Math.log10(this.minFreq);
      const logMax = Math.log10(this.maxFreq);
      const freq = Math.pow(10, logMin + ratio * (logMax - logMin));
      
      const gain = this.calculateResponse(freq);
      const x = this.freqToX(freq);
      const y = this.gainToY(gain);
      
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    
    return points.join(' ');
  }

  getFreqGridLines(): number[] {
    return [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  }

  getGainGridLines(): number[] {
    return [-15, -10, -5, 0, 5, 10, 15];
  }

  onPointMouseDown(event: MouseEvent, index: number): void {
    event.preventDefault();
    this.draggedBandIndex = index;
  }

  onPointTouchStart(event: TouchEvent, index: number): void {
    event.preventDefault();
    this.draggedBandIndex = index;
  }

  onGraphMouseMove(event: MouseEvent): void {
    if (this.draggedBandIndex === null) return;
    
    const svg = this.eqGraphRef.nativeElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.updateBandPosition(x, y);
  }

  onGraphTouchMove(event: TouchEvent): void {
    if (this.draggedBandIndex === null || event.touches.length === 0) return;
    
    event.preventDefault();
    
    const svg = this.eqGraphRef.nativeElement;
    const rect = svg.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.updateBandPosition(x, y);
  }

  private updateBandPosition(x: number, y: number): void {
    if (this.draggedBandIndex === null) return;
    
    const band = this.bands[this.draggedBandIndex];
    
    let newFreq = this.xToFreq(x);
    newFreq = Math.max(band.freqMin, Math.min(band.freqMax, newFreq));
    this.bands[this.draggedBandIndex].frequency = Math.round(newFreq);
    
    let newGain = this.yToGain(y);
    newGain = Math.max(this.minGain, Math.min(this.maxGain, newGain));
    this.bands[this.draggedBandIndex].gain = Math.round(newGain * 10) / 10;
    
    this.updateGraph();
    this.bandsChange.emit(this.bands);
    this.cdr.markForCheck();
  }

  onGraphMouseUp(): void {
    this.draggedBandIndex = null;
  }

  onGraphTouchEnd(): void {
    this.draggedBandIndex = null;
  }

  updateGraph(): void {
    // Create new array and new objects to trigger change detection
    this.bands = this.bands.map(band => ({ ...band }));
  }
}