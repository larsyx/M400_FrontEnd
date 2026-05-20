import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { SlidersContainer } from '../../../shared/sliders/sliders-container/sliders-container/sliders-container';
import { AuxContainer } from '../../../shared/aux-container/aux-container/aux-container';
import { MainContainer } from '../../../shared/main-container/main-container';
import { Equalizer } from "../../../shared/equalizer/equalizer";
import { Dca } from "../pages/dca/dca";
import { MixerService } from '../../../core/services/mixer.service';
import { Fader } from '../../../core/models/fader.model';
import { IAuxs } from '../../../core/models/auxs.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, SlidersContainer, AuxContainer, MainContainer, Equalizer, Dca],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss']
})
export class HomePageComponent implements OnInit{
  HomeViewButtons = HomeViewButtons;
  activeView: HomeViewButtons | null = null;

  isEqActive : boolean = false;
  isDcaActive : boolean = false;
  
  // Side panel mode: 'aux' or 'main'
  sidePanelMode: 'aux' | 'main' | null = null;
  selectedAuxName: string = 'Main';

  @ViewChild(Equalizer) equalizerComponent?: Equalizer;
  @ViewChild(AuxContainer) auxContainer?: AuxContainer;

  faderList: Fader[] = [];
  dcaList: Fader[] = [];
  auxList: IAuxs[] = []

  constructor(private mixerService : MixerService){}

  ngOnInit(): void {
    this.mixerService.loadFader().subscribe({
      next: (res) =>{
        this.faderList = res;
      }
    });

    this.mixerService.loadDca().subscribe({
      next: (res) => {
        this.dcaList = res;
      }
    });

    this.mixerService.loadAux().subscribe({
      next : (res) => {
        this.auxList = res;
      }
    })
  }

  // Rileva se siamo su smartphone
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width < 768;
  }

  setView(view : HomeViewButtons){
    // Imposta sempre activeView per attivare il bottone
    this.activeView = view === this.activeView ? null : view;
    
    // Su mobile se clicco EQ apri anche la modale
    if (view === HomeViewButtons.EQ && this.activeView === HomeViewButtons.EQ && this.isMobile()) {
      
      setTimeout(() => {
        if (this.equalizerComponent) {
          console.log('Calling openModal()');
          this.equalizerComponent.openModal();
        } else {
          console.error('Equalizer component not found!');
        }
      }, 0);
    }
  }

  setSidePanelMode(mode: 'aux' | 'main'): void {
    if (this.sidePanelMode === mode) {
      this.sidePanelMode = null;
    } else {
      this.sidePanelMode = mode;
    }
  }

  onAuxSelectionChange(index: number): void {
    if (index === -1) {
      this.selectedAuxName = 'Main';
    } else if (this.auxContainer) {
      this.selectedAuxName = this.auxContainer.auxs[index]?.name || 'AUX';
    }
  }
}

export enum HomeViewButtons {
  EQ = 'eq',
  DCA = 'dca'
}
