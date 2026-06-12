import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { IProfile } from '../../../core/models/profile.model';

@Component({
  selector: 'app-home-user',
  standalone: true,
  imports: [CommonModule, FormsModule, MainContainer, CustomSelectComponent, SlidersContainer],
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

  // Profile selection
  readonly MANAGE_PROFILES_VALUE = -1;
  readonly NO_PROFILE_VALUE = 0;
  profiles: IProfile[] = [];
  profileOptions: CustomSelectOption[] = [];
  selectedProfile: number | null = this.NO_PROFILE_VALUE;

  // Profile management modal state
  showProfileModal = false;
  newProfileName = '';
  editingProfileId: number | null = null;
  editingProfileName = '';
  confirmDeleteId: number | null = null;
  confirmDeleteAll = false;
  confirmUpdateId: number | null = null;
  sortedProfiles: { id: number; name: string; data?: { id: number; value: number; switch: boolean }[]; updatedAt?: number }[] = [];
  
  constructor(
    private sliderSettings: SliderSettingsService,
    private userService: UserService,
    private webSocketService: WebSocketService
  ) {
    this.refreshProfileOptions();

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

        this.profiles = res.profile;
        this.refreshProfileOptions();

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

  selectTab(tabId: TypeChannel | string): void {
    this.activeTab = tabId;
    if(tabId === "all")
      this.channelsSelected = this.channels;
    else
      this.channelsSelected = this.channels.filter(f => f.type === tabId);
  }
  
  toggleMainContainer(): void {
    this.showMainContainer = !this.showMainContainer;
  }
  
  onProfileChange(value: number): void {
    if (value === this.MANAGE_PROFILES_VALUE) {
      this.openProfileModal();
      return;
    }
    
    if (value === this.NO_PROFILE_VALUE) {
      this.selectedProfile = value;
      return;
    }
    
    this.selectedProfile = value;
    this.userService.loadProfile(this.sceneId!, this.selectedProfile, this.selectedAux ?? -1).subscribe({
      next: (res) => {

        res.forEach(loadedFader => {
          const channel = this.channels.find(c => c.id === loadedFader.id);
          if (channel) {
            channel.value = loadedFader.value;
            //channel.switch = !loadedFader.switch;
          }
        });
        
        if (this.activeTab === "all") {
          this.channelsSelected = this.channels;
        } else {
          this.channelsSelected = this.channels.filter(f => f.type === this.activeTab);
        }
        
        console.log('Profilo caricato con successo');
      },
      error: (err) => {
        console.error('Errore nel caricamento del profilo:', err);
      }
    });
  }

  openProfileModal(): void {
    this.newProfileName = '';
    this.editingProfileId = null;
    this.editingProfileName = '';
    this.confirmDeleteId = null;
    this.confirmDeleteAll = false;
    this.confirmUpdateId = null;
    
    // Ordina i profili solo all'apertura del modal
    this.sortedProfiles = [...this.profiles].sort((a, b) =>
      a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
    );
    
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.newProfileName = '';
    this.editingProfileId = null;
    this.editingProfileName = '';
    this.confirmDeleteId = null;
    this.confirmDeleteAll = false;
    this.confirmUpdateId = null;
  }

  addProfile(): void {
    const name = this.newProfileName.trim();
    if (!name) {
      return;
    }

    const newProfile: IProfile = {
      id: -1,
      name: name
    };

    this.userService.createProfile(this.sceneId!, newProfile, this.channels).subscribe({
      next: (createdProfile: IProfile) => {
        this.profiles = [...this.profiles, { id: createdProfile.id, name: createdProfile.name }];
        // Aggiorna anche sortedProfiles
        this.sortedProfiles = [...this.profiles].sort((a, b) =>
          a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
        );
        this.refreshProfileOptions();
        this.closeProfileModal();
      },
      error: (err) => {
        console.error('Errore nella creazione del profilo:', err);
      }
    });
  }

  startEditProfile(profile: { id: number; name: string }): void {
    this.editingProfileId = profile.id;
    this.editingProfileName = profile.name;
    this.confirmDeleteId = null;
    this.confirmUpdateId = null;
  }

  saveEditProfile(): void {
    const name = this.editingProfileName.trim();
    if (!name || this.editingProfileId === null) {
      this.cancelEditProfile();
      return;
    }
    const id = this.editingProfileId;
    this.profiles = this.profiles.map(p => p.id === id ? { ...p, name } : p);
    // Aggiorna anche sortedProfiles
    this.sortedProfiles = [...this.profiles].sort((a, b) =>
      a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
    );
    this.editingProfileId = null;
    this.editingProfileName = '';
    this.refreshProfileOptions();
  }

  cancelEditProfile(): void {
    this.editingProfileId = null;
    this.editingProfileName = '';
  }

  requestDeleteProfile(id: number): void {
    this.confirmDeleteId = id;
    this.editingProfileId = null;
    this.confirmUpdateId = null;
  }

  cancelDeleteProfile(): void {
    this.confirmDeleteId = null;
  }

  confirmDeleteProfile(id: number): void {
    const profile = this.profiles.find(p => p.id === id)!;

    this.userService.deleteProfile(this.sceneId!, profile.id).subscribe({
      next: (res) => {
        this.profiles = this.profiles.filter(p => p.id !== id);
        if (this.selectedProfile === id) {
          this.selectedProfile = this.NO_PROFILE_VALUE;
        }
        this.confirmDeleteId = null;
        this.refreshProfileOptions();
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  requestUpdateProfile(id: number): void {
    this.confirmUpdateId = id;
    this.editingProfileId = null;
    this.confirmDeleteId = null;
  }

  cancelUpdateProfile(): void {
    this.confirmUpdateId = null;
  }

  confirmUpdateProfile(id: number): void {
    let profile = this.profiles.find(p => p.id === id)!;
    this.userService.updateProfile(this.sceneId!, profile, this.channels).subscribe({
      next: () => {
        this.confirmUpdateId = null;
        this.refreshProfileOptions();
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  requestDeleteAllProfiles(): void {
    this.confirmDeleteAll = true;
  }

  cancelDeleteAllProfiles(): void {
    this.confirmDeleteAll = false;
  }

  confirmDeleteAllProfiles(): void {
    this.userService.deleteAllProfiles(this.sceneId!).subscribe({
      next: () => {
        this.profiles = [];
        this.selectedProfile = this.NO_PROFILE_VALUE;
        this.confirmDeleteAll = false;
        this.refreshProfileOptions();
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  private refreshProfileOptions(): void {
    const sortedProfiles = [...this.profiles].sort((a, b) =>
      a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
    );
    
    this.profileOptions = [
      { value: this.NO_PROFILE_VALUE, label: 'Nessun profilo' },
      ...sortedProfiles.map(p => ({ value: p.id, label: p.name })),
      { value: this.MANAGE_PROFILES_VALUE, label: '⚙ Gestione profili' }
    ];
  }

  onAuxChange(value: number): void {
    this.selectedAux = value;
    this.selectedProfile = this.NO_PROFILE_VALUE; // Reset profilo a "Nessun profilo"
    console.log(`Selected AUX: ${this.selectedAux}`);
    
    this.webSocketService.disconnect();
    this.webSocketService.connect(this.token!, TypeSocket.AUX, UserRole.USER, value);
    this.manageMessage();
    
    this.syncChannelsValues(value);
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
        
        if (this.activeTab === "all") {
          this.channelsSelected = this.channels;
        } else {
          this.channelsSelected = this.channels.filter(f => f.type === this.activeTab);
        }
      },
      error: (err) => {
        console.error('Errore nel caricamento dei valori AUX:', err);
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
