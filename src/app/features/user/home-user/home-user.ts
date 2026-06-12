import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainContainer } from '../../../shared/main-container/main-container';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/custom-select/custom-select';
import { SliderSettingsService, SliderOrientation } from '../../../core/services/slider-settings.service';
import { UserService } from '../../../core/services/user.service';
import { Fader, TypeChannel } from '../../../core/models/fader.model';
import { TypeRequest, TypeSocket, WebSocketService } from '../../../core/services/websocket.service';
import { UserRole } from '../../../core/models/user.model';
import { auditTime, Subject } from 'rxjs';
import { SlidersContainer } from "../../../shared/sliders/sliders-container/sliders-container/sliders-container";
import { IAuxs } from '../../../core/models/auxs.model';

@Component({
  selector: 'app-home-user',
  standalone: true,
  imports: [CommonModule, MainContainer, CustomSelectComponent, SlidersContainer],
  templateUrl: './home-user.html',
  styleUrls: ['./home-user.scss']
})
export class HomeUserComponent {
  sliderOrientation = signal<SliderOrientation>('vertical');
  
  // Channel data
  channels: Fader[] = [];
  channelsSelected: Fader[] = [];
  mainFader!: Fader;
  sceneId: number | null = null;
  selectedSceneName = '';
  token = localStorage.getItem('access_token');
  auxUser?: IAuxs;
  private faderUpdate$ = new Subject<{ fader: Fader, type: TypeRequest }>();
  
  selectedSliderId: number | null = null;

  tabs = [
    { id: 'all', label: 'Tutti', icon: '🎵' },
    { id: TypeChannel.INSTRUMENT, label: 'Strumenti', icon: '🎸' },
    { id: TypeChannel.VOICE, label: 'Voci', icon: '🎤' },
    { id: TypeChannel.DRUM, label: 'Batteria', icon: '🥁' }
  ];
  
  activeTab: string = "all";
  
  // Group control step
  readonly GROUP_CONTROL_STEP = 0.2; // Step in dB
  
  // Main container visibility toggle
  showMainContainer: boolean = false;
  
  // AUX selection
  auxOptions: CustomSelectOption[] = [];
  selectedAux: number | null = null;
  
  constructor(
    private sliderSettings: SliderSettingsService,
    private userService: UserService,
    private webSocketService: WebSocketService
  ) {
    effect(() => {
      this.sliderOrientation.set(this.sliderSettings.sliderOrientation());
    });

    effect(() => {
      this.selectedSceneName = this.userService.currentSceneName();
      const id = this.userService.currentSceneId();
      if (id !== this.sceneId) {
        this.sceneId = id;
        if (id !== null) {
          this.loadSceneData();
        }
      }
    });
  }

  private loadSceneData(): void {
    this.sliderOrientation.set(this.sliderSettings.getOrientation());

    this.userService.loadHome(this.sceneId!).subscribe({
      next: (res) => {
        for(let aux of res.aux){
          this.auxOptions.push({value: aux.id, label: aux.name})
        }

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
        this.channels = res.fader.filter(f => f.id !== 0); 
        this.channelsSelected = this.channels;

        this.auxUser = res.auxUser;
        this.selectedAux = this.auxUser.id;

        this.webSocketService.connect(this.token!, TypeSocket.AUX, UserRole.USER, this.auxUser.id);

        this.webSocketService.messages().subscribe(msg => {
          const fader = this.channels.find(f => f.id === msg.payload.channel);

            if(fader){
              if(msg.payload.value === true || msg.payload.value === false)
                fader.switch = !msg.payload.value;
              else
                fader.value = parseFloat(msg.payload.value);
            }
        });

        this.faderUpdate$
          .pipe(
            auditTime(50)
          )
          .subscribe(event => {
            this.webSocketService.send({
              type: event.type,
              payload: {
                aux_id: this.auxUser?.id,
                channel: event.fader.id,
                value: event.fader.value.toFixed(1),
                switch: !event.fader.switch
              }
            });
          });
      },
      error: (err) => {
        console.error('Errore nel caricamento dei dati:', err); // Debug
      }
    });
  }
  

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
  }

  // Switch to selected tab
  selectTab(tabId: TypeChannel | string): void {
    this.activeTab = tabId;
    if(tabId === "all")
      this.channelsSelected = this.channels;
    else
      this.channelsSelected = this.channels.filter(f => f.type === tabId);
  }
  
  // Toggle main container visibility
  toggleMainContainer(): void {
    this.showMainContainer = !this.showMainContainer;
    console.log(`Main container visibility: ${this.showMainContainer}`);
  }
  
  // Handle AUX selection change
  onAuxChange(value: number): void {
    this.selectedAux = value;
    console.log(`Selected AUX: ${this.selectedAux}`);
    this.syncChannelsValues(value);

    this.webSocketService.disconnect();
    this.webSocketService.connect(this.token!, TypeSocket.AUX, UserRole.MIXER, value);
    this.manageMessage();
  }

  private manageMessage(){
    this.webSocketService.messages().subscribe(msg => {
      const fader = this.channels.find(f => f.id === msg.payload.channel);

        if(fader){
          if(msg.payload.value === true || msg.payload.value === false)
            fader.switch = !msg.payload.value;
          else
            fader.value = parseFloat(msg.payload.value);
        }
    });
  }


  private syncChannelsValues(auxId: number){
    this.userService.loadValues(auxId).subscribe({
      next: (res) => {  
        res.forEach(f => {
          const item = this.channels.find(v => v.id === f.id);
          if (item) {
            item.switch = !f.switch;
            item.value = f.value;
          }
        });
      }
    });
  }
  
  // Slider event handlers
  selectSlider(id: number): void {
    this.selectedSliderId = id;
    //console.log(`Selected slider ID: ${id}`);
  }

  isSelected(id: number): boolean {
    return this.selectedSliderId === id;
  }

  updateFader(event: {fader: Fader, type: TypeRequest}) {
    this.faderUpdate$.next(event);
  }

  // Group control methods
  incrementGroupControl(): void {
    this.applyGroupControl(this.GROUP_CONTROL_STEP);
  }

  decrementGroupControl(): void {
    this.applyGroupControl(-this.GROUP_CONTROL_STEP);
  }

  private applyGroupControl(offset: number): void {
    // Apply offset to all visible channels
    this.channelsSelected.forEach(channel => {
      const newValue = Math.max(-90, Math.min(10, channel.value + offset));
      if (newValue !== channel.value) {
        channel.value = newValue;
        this.faderUpdate$.next({
          fader: channel,
          type: TypeRequest.SLIDER_VALUE
        });
      }
    });
  }

  // Check if group control should be shown (only for specific tabs)
  showGroupControl(): boolean {
    return this.activeTab === TypeChannel.INSTRUMENT ||
           this.activeTab === TypeChannel.VOICE ||
           this.activeTab === TypeChannel.DRUM;
  }
}
