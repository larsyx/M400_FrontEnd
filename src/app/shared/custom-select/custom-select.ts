import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';

export interface CustomSelectOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.scss'
})
export class CustomSelectComponent {
  private highlightedIndex = signal(-1);
  @Input() options: CustomSelectOption[] = [];
  @Input() value: number | null = null;
  @Input() placeholder: string = 'Select option';
  @Input() ariaLabel: string = 'Custom select';
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<number>();
  @Output() selectionChange = new EventEmitter<CustomSelectOption>();

  isOpen = signal(false);

  get selectedOption(): CustomSelectOption | undefined {
    return this.options.find(option => option.value === this.value);
  }

  get highlightedOptionIndex(): number {
    return this.highlightedIndex();
  }

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  toggleDropdown(): void {
    if (this.disabled) {
      return;
    }

    const nextOpen = !this.isOpen();
    this.isOpen.set(nextOpen);

    if (nextOpen) {
      this.setInitialHighlight();
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
  }

  selectOption(option: CustomSelectOption): void {
    if (this.disabled) {
      return;
    }

    this.valueChange.emit(option.value);
    this.selectionChange.emit(option);
    this.closeDropdown();
  }

  trackByValue(index: number, option: CustomSelectOption): number {
    return option.value;
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'Down':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
          this.setInitialHighlight();
          return;
        }
        this.moveHighlight(1);
        break;
      case 'ArrowUp':
      case 'Up':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
          this.setInitialHighlight();
          return;
        }
        this.moveHighlight(-1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isOpen()) {
          this.isOpen.set(true);
          this.setInitialHighlight();
          return;
        }
        this.selectHighlightedOption();
        break;
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.closeDropdown();
        }
        break;
    }
  }

  private setInitialHighlight(): void {
    const selectedIndex = this.options.findIndex(option => option.value === this.value);
    this.highlightedIndex.set(selectedIndex >= 0 ? selectedIndex : 0);
  }

  private moveHighlight(step: number): void {
    if (!this.options.length) {
      this.highlightedIndex.set(-1);
      return;
    }

    const currentIndex = this.highlightedIndex();
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (startIndex + step + this.options.length) % this.options.length;
    this.highlightedIndex.set(nextIndex);
  }

  private selectHighlightedOption(): void {
    const index = this.highlightedIndex();
    if (index < 0 || index >= this.options.length) {
      return;
    }

    this.selectOption(this.options[index]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && this.elementRef.nativeElement.contains(target)) {
      return;
    }

    this.closeDropdown();
  }
}
