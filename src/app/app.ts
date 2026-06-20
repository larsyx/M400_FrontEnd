import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from './core/services/theme.service';
import { LoaderService } from './core/services/loader.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('M400_FrontEnd');

  private router = inject(Router);
  private loader = inject(LoaderService);
  private platformId = inject(PLATFORM_ID);

  constructor(private themeService: ThemeService) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationStart))
      .subscribe(() => this.loader.reset());

    if (isPlatformBrowser(this.platformId)) {
      this.blockZoom();
    }
  }

  private blockZoom(): void {
    const preventGesture = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', preventGesture);
    document.addEventListener('gesturechange', preventGesture);
    document.addEventListener('gestureend', preventGesture);

    document.addEventListener('wheel', (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    }, { passive: false });

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) {
        e.preventDefault();
      }
    });
  }
}
