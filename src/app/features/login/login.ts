// src/app/features/login/login.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { UserRole } from '../../core/models/user.model';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {

  username = '';
  loading = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  onSubmit() {
    this.loading = true;
    this.error = null;

    this.auth.login(this.username)
      .subscribe({
        next: () => {
          this.loading = false;
          const role = this.auth.getUserRole()
          const target = ROLE_TO_ROUTE[role!] ?? '/login';
          this.router.navigateByUrl(target);
        },
        error: () => {
          this.loading = false;
          this.error = 'Credenziali errate';
        }
      });
  }
}


export const ROLE_TO_ROUTE: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/app/admin/dashboard',
  [UserRole.MIXER]: '/app/mixer/home',
  [UserRole.VIDEO]: '/app/video/home',
  [UserRole.USER]:  '/app/user/home',
};
