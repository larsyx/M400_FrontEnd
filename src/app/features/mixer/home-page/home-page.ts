import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { SlidersContainer } from '../../../shared/sliders/sliders-container/sliders-container/sliders-container';
import { AuxContainer } from '../../../shared/aux-container/aux-container/aux-container';
import { MainContainer } from '../../../shared/main-container/main-container';
import { Equalizer } from "../../../shared/equalizer/equalizer";
import { Dca } from "../pages/dca/dca";
import { MixerService } from '../../../core/services/mixer.service';
import { Fader } from '../../../core/models/fader.model';
import { IAuxs } from '../../../core/models/auxs.model';
import { TypeRequest, TypeSocket, WebSocketService } from '../../../core/services/websocket.service';
import { auditTime, Subject } from 'rxjs';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, SlidersContainer, AuxContainer, MainContainer, Equalizer, Dca],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss']
})
export class HomePageComponent implements OnInit, OnDestroy{
  HomeViewButtons = HomeViewButtons;
  activeView: HomeViewButtons | null = null;

  isEqActive : boolean = false;
  isDcaActive : boolean = false;
  
  // Side panel mode: 'aux' or 'main'
  sidePanelMode: 'aux' | 'main' | null = null;
  selectedAuxName: string = 'Main';
  selectedAuxId: number = 0;

  @ViewChild(Equalizer) equalizerComponent?: Equalizer;
  @ViewChild(AuxContainer) auxContainer?: AuxContainer;

  faderList: Fader[] = [];
  dcaList: Fader[] = [];
  mainFader!: Fader;
  auxList: IAuxs[] = [];
  token = localStorage.getItem('access_token');
  private faderUpdate$ = new Subject<{ fader: Fader, type: TypeRequest }>();

  constructor(
    private mixerService : MixerService,
    private webSocketService: WebSocketService
  ){}
  

  ngOnInit(): void {
    this.mixerService.laodHome().subscribe({
      next: (res) => {  
        this.dcaList = res.dca;
        this.auxList = res.aux;

        this.mainFader = res.fader.find(f => f.id === 0) ?? {
          id: 0,
          name: '',
          description: '',
          value: 0,
          switch: false,
          link: false,
          type: null
        };

        res.fader.forEach(f => f.switch = !f.switch)
        this.faderList = res.fader.filter(f => f.id !== 0); 
      }
    });

    this.webSocketService.connect(this.token!, TypeSocket.MIXER, UserRole.MIXER);
    this.manageMessage();

    this.faderUpdate$
      .pipe(
        auditTime(50)
      )
      .subscribe(event => {
        this.webSocketService.send({
          type: event.type,
          payload: {
            aux_id: this.selectedAuxName,
            channel: event.fader.id,
            value: event.fader.value.toFixed(1),
            switch: !event.fader.switch
          }
        });
      });
  }

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
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
      this.webSocketService.disconnect();
      this.webSocketService.connect(this.token!, TypeSocket.MIXER, UserRole.MIXER);
      this.manageMessage();
    } else if (this.auxContainer) {
      const aux = this.auxContainer.auxs[index];
      this.selectedAuxName = aux?.name || 'AUX';

      this.webSocketService.disconnect();
      this.webSocketService.connect(this.token!, TypeSocket.AUX, UserRole.MIXER, aux.id);
      this.manageMessage();
    }
  }

  updateFader(event: {fader: Fader, type: TypeRequest}) {
    this.faderUpdate$.next(event);
  }

  manageMessage(){
    this.webSocketService.messages().subscribe(msg => {
      const fader = msg.payload.channel.dca ?
        this.dcaList.find(f => f.id === msg.payload.channel) :
        this.faderList.find(f => f.id === msg.payload.channel);

        if(fader){
          if(msg.payload.value === true || msg.payload.value === false)
            fader.switch = !msg.payload.value;
          else
            fader.value = parseFloat(msg.payload.value);
        }
    });
  }
}

export enum HomeViewButtons {
  EQ = 'eq',
  DCA = 'dca'
}
