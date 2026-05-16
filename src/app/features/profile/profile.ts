import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { SliderSettingsService } from '../../core/services/slider-settings.service';
import { SettingsCardComponent } from '../../shared/settings-card/settings-card';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SettingsCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  sliderWidth = signal<number>(60);

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    private sliderSettings: SliderSettingsService,
    private router: Router
  ) {
    // Sync with slider settings service
    effect(() => {
      this.sliderWidth.set(this.sliderSettings.sliderWidth());
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Initialize from service
    this.sliderWidth.set(this.sliderSettings.getWidth());
  }

  onThemeToggle(): void {
    this.themeService.toggleTheme();
  }

  onSliderChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const width = parseInt(value, 10);
    this.sliderWidth.set(width);
    this.sliderSettings.setWidth(width);
  }

  onLogout(): void {
      this.authService.logout();
  }
}
