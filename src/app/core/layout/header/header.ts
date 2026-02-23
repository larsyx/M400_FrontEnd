import { Component, OnInit } from '@angular/core';
import { MENU_ITEMS, MenuItem } from '../../config/menu.config';
import { User } from '../../models/user.model';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit{
  menuItems: MenuItem[] = [];
  currentUser: User | null = null;

  constructor(public authService: AuthService){}


  ngOnInit(): void {
    this.authService.currentUser$.subscribe( user => {
      this.currentUser = user;
      this.filterMenuItems();
    });
  }

  private filterMenuItems(): void {
    if(!this.currentUser){
      this.menuItems = [];
      return;
    }

    console.log(MENU_ITEMS.filter(item => { item.roles.includes(this.currentUser!.role)}));
    this.menuItems = MENU_ITEMS.filter(item => item.roles.includes(this.currentUser!.role));
  }
   
  logout() {
    this.authService.logout();
  }
}
