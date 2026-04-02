import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { SlidersContainer } from '../../../shared/sliders/sliders-container/sliders-container/sliders-container';
import { AuxContainer } from '../../../shared/aux-container/aux-container/aux-container';
import { Equalizer } from "../../../shared/equalizer/equalizer";
import { Dca } from "../pages/dca/dca";

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, SlidersContainer, AuxContainer, Equalizer, Dca],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss']
})
export class HomePageComponent {

  HomeViewButtons = HomeViewButtons;
  activeView: HomeViewButtons | null = null;

  isEqActive : boolean = false;
  isDcaActive : boolean = false;

  setView(view : HomeViewButtons){
    this.activeView = view === this.activeView ? null : view;
  }
}

export enum HomeViewButtons {
  EQ = 'eq',
  DCA = 'dca'
}
