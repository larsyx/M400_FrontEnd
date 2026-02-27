import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { SlidersContainer } from '../../../shared/sliders/sliders-container/sliders-container/sliders-container';
import { AuxContainer } from '../../../shared/aux-container/aux-container/aux-container';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, SlidersContainer, AuxContainer],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss']
})
export class HomePageComponent {
}
