import { Component, inject, signal } from '@angular/core';
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

  constructor(private themeService: ThemeService) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationStart))
      .subscribe(() => this.loader.reset());
  }
}
