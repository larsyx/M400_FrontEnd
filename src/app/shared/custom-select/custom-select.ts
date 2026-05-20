import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';

export interface CustomSelectOption {
  value: string;
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
  @Input() options: CustomSelectOption[] = [];
  @Input() value: string | null = null;
  @Input() placeholder: string = 'Select option';
  @Input() ariaLabel: string = 'Custom select';
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<CustomSelectOption>();

  isOpen = signal(false);

  get selectedOption(): CustomSelectOption | undefined {
    return this.options.find(option => option.value === this.value);
  }

  toggleDropdown(): void {
    if (this.disabled) {
      return;
    }

    this.isOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  selectOption(option: CustomSelectOption): void {
    if (this.disabled) {
      return;
    }

    this.valueChange.emit(option.value);
    this.selectionChange.emit(option);
    this.closeDropdown();
  }

  trackByValue(index: number, option: CustomSelectOption): string {
    return option.value;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeDropdown();
  }
}
