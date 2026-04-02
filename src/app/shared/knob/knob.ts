import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-knob',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knob.html',
  styleUrls: ['./knob.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KnobComponent implements AfterViewInit, OnDestroy {
  // Configuration inputs
  @Input() value: number = 0;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() size: number = 100;
  @Input() strokeWidth: number = 14;
  @Input() valueColor: string = '#4CAF50';
  @Input() rangeColor: string = '#e0e0e0';
  @Input() centerColor: string = '#f5f5f5';
  @Input() indicatorColor: string = '#ffffff';
  @Input() textColor: string = '#333';
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() showValue: boolean = true;
  @Input() showIndicator: boolean = false;
  @Input() ariaLabel?: string;
  @Input() valueTemplate: string = '{value}';

  // Event outputs
  @Output() valueChange = new EventEmitter<number>();
  @Output() onChange = new EventEmitter<number>();
  @Output() onDragStart = new EventEmitter<number>();
  @Output() onDragEnd = new EventEmitter<number>();

  @ViewChild('knobCanvas', { static: false }) 
  canvasElement!: ElementRef<HTMLCanvasElement>;

  // Internal state
  private ctx: CanvasRenderingContext2D | null = null;
  isDragging = false;
  private startY = 0;
  private startValue = 0;
  
  // Cached values for performance
  private radius = 0;
  private centerX = 0;
  private centerY = 0;
  
  // Angle configuration (in degrees for clarity)
  private readonly MIN_ANGLE = 135;  // 7 o'clock position (bottom-left)
  private readonly MAX_ANGLE = 405;  // 5 o'clock position (bottom-right) = 45° + 360°
  private readonly ANGLE_RANGE = 270; // Total rotation range in degrees
  
  // Event handlers (bound once to avoid memory leaks)
  private boundMoveHandler?: (e: MouseEvent | TouchEvent) => void;
  private boundUpHandler?: () => void;
  
  // Animation frame ID for cleanup
  private animationFrameId?: number;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.initCanvas();
    this.render();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Initialize canvas context and cache calculations
   */
  private initCanvas(): void {
    const canvas = this.canvasElement?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    // Enable anti-aliasing for smoother rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Cache frequently used calculations
    this.radius = (this.size / 2) - (this.strokeWidth / 2) - 2;
    this.centerX = this.size / 2;
    this.centerY = this.size / 2;
  }

  /**
   * Main rendering method - draws all knob elements
   */
  private render(): void {
    if (!this.ctx || !this.canvasElement) return;

    const canvas = this.canvasElement.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw background arc (full range)
    this.drawArc(
      this.rangeColor,
      this.MIN_ANGLE,
      this.MAX_ANGLE,
      this.strokeWidth
    );

    // 2. Draw value arc (current value)
    const valueAngle = this.valueToAngle(this.value);
    this.drawArc(
      this.valueColor,
      this.MIN_ANGLE,
      valueAngle,
      this.strokeWidth
    );

    // 3. Draw position indicator (if enabled)
    if (this.showIndicator) {
      this.drawIndicator(valueAngle);
    }
  }

  /**
   * Draw an arc on the canvas
   */
  private drawArc(
    color: string,
    startAngle: number,
    endAngle: number,
    lineWidth: number
  ): void {
    if (!this.ctx) return;

    // Convert degrees to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius, startRad, endRad);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
  }

  /**
   * Draw the center circle of the knob
   */
  private drawCenterCircle(): void {
    if (!this.ctx) return;

    const centerRadius = this.radius * 0.3;

    // Add subtle shadow for depth
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetY = 2;

    // Draw circle
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, centerRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.centerColor;
    this.ctx.fill();

    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;
  }

  /**
   * Draw the position indicator (line and dot)
   */
  private drawIndicator(angle: number): void {
    if (!this.ctx) return;

    const angleRad = (angle * Math.PI) / 180;
    const indicatorRadius = this.radius * 0.75;

    // Calculate indicator position
    const x = this.centerX + Math.cos(angleRad) * indicatorRadius;
    const y = this.centerY + Math.sin(angleRad) * indicatorRadius;

    // Draw line from center to indicator
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY);
    this.ctx.lineTo(x, y);
    this.ctx.strokeStyle = this.indicatorColor;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Draw dot at indicator position
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = this.indicatorColor;
    this.ctx.fill();
  }

  /**
   * Convert value to angle in degrees
   */
  private valueToAngle(value: number): number {
    const normalized = (value - this.min) / (this.max - this.min);
    return this.MIN_ANGLE + (normalized * this.ANGLE_RANGE);
  }

  /**
   * Update the knob value with bounds checking and step rounding
   */
  private updateValue(newValue: number): void {
    // Clamp to min/max
    newValue = Math.max(this.min, Math.min(this.max, newValue));
    
    // Round to step
    newValue = this.roundToStep(newValue);

    // Only update if value changed
    if (newValue !== this.value) {
      this.value = newValue;
      this.valueChange.emit(this.value);
      this.render();
      this.cdr.markForCheck();
    }
  }

  /**
   * Round value to nearest step
   */
  private roundToStep(value: number): number {
    return Math.round(value / this.step) * this.step;
  }

  /**
   * Mouse down event handler
   */
  onMouseDown(event: MouseEvent): void {
    if (this.disabled || this.readonly) return;
    event.preventDefault();
    this.startDrag(event.clientY);
  }

  /**
   * Touch start event handler
   */
  onTouchStart(event: TouchEvent): void {
    if (this.disabled || this.readonly) return;
    event.preventDefault();
    if (event.touches.length > 0) {
      this.startDrag(event.touches[0].clientY);
    }
  }

  /**
   * Start drag operation
   */
  private startDrag(clientY: number): void {
    this.isDragging = true;
    this.startY = clientY;
    this.startValue = this.value;
    this.onDragStart.emit(this.value);

    // Bind event handlers (bound once to avoid memory leaks)
    this.boundMoveHandler = this.handleMove.bind(this);
    this.boundUpHandler = this.handleUp.bind(this);

    // Add global listeners
    document.addEventListener('mousemove', this.boundMoveHandler as any);
    document.addEventListener('mouseup', this.boundUpHandler);
    document.addEventListener('touchmove', this.boundMoveHandler as any, { passive: false });
    document.addEventListener('touchend', this.boundUpHandler);
  }

  /**
   * Handle pointer move during drag
   */
  private handleMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;

    event.preventDefault();

    // Get clientY from mouse or touch event
    const clientY = event instanceof MouseEvent 
      ? event.clientY 
      : event.touches[0]?.clientY;

    if (clientY === undefined) return;

    // Calculate value change based on vertical movement
    const deltaY = this.startY - clientY; // Negative Y is up (increase)
    const range = this.max - this.min;
    const sensitivity = 200; // pixels needed to traverse full range
    const valueChange = (deltaY / sensitivity) * range;

    this.updateValue(this.startValue + valueChange);
  }

  /**
   * Handle pointer up (end drag)
   */
  private handleUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.cleanup();
      this.onChange.emit(this.value);
      this.onDragEnd.emit(this.value);
    }
  }

  /**
   * Mouse wheel event handler
   */
  onWheel(event: WheelEvent): void {
    if (this.disabled || this.readonly) return;
    event.preventDefault();

    const direction = event.deltaY > 0 ? -1 : 1; // Scroll down = decrease
    this.updateValue(this.value + (direction * this.step));
    this.onChange.emit(this.value);
  }

  /**
   * Keyboard event handler for accessibility
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled || this.readonly) return;

    let delta = 0;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        delta = this.step;
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        delta = -this.step;
        break;
      case 'Home':
        this.updateValue(this.min);
        this.onChange.emit(this.value);
        event.preventDefault();
        return;
      case 'End':
        this.updateValue(this.max);
        this.onChange.emit(this.value);
        event.preventDefault();
        return;
      case 'PageUp':
        delta = this.step * 10;
        break;
      case 'PageDown':
        delta = -this.step * 10;
        break;
      default:
        return; // Don't prevent default for other keys
    }

    event.preventDefault();
    this.updateValue(this.value + delta);
    this.onChange.emit(this.value);
  }

  /**
   * Clean up event listeners and animations
   */
  private cleanup(): void {
    if (this.boundMoveHandler) {
      document.removeEventListener('mousemove', this.boundMoveHandler as any);
      document.removeEventListener('touchmove', this.boundMoveHandler as any);
    }
    if (this.boundUpHandler) {
      document.removeEventListener('mouseup', this.boundUpHandler);
      document.removeEventListener('touchend', this.boundUpHandler);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Get formatted display value
   */
  get displayValue(): string {
    return this.valueTemplate.replace('{value}', this.value.toFixed(1));
  }
}

