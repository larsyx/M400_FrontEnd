import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainContainer } from '../../../shared/main-container/main-container';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/custom-select/custom-select';
import { SliderSettingsService, SliderOrientation } from '../../../core/services/slider-settings.service';
import { VideoService } from '../../../core/services/video.service';
import { UserService } from '../../../core/services/user.service';
import { Fader, TypeChannel } from '../../../core/models/fader.model';
import { TypeRequest, TypeSocket, WebSocketService } from '../../../core/services/websocket.service';
import { UserRole } from '../../../core/models/user.model';
import { auditTime, Subject } from 'rxjs';
import { SlidersContainer } from "../../../shared/sliders/sliders-container/sliders-container/sliders-container";
import { IAuxs } from '../../../core/models/auxs.model';

@Component({
  selector: 'app-home-video',
  standalone: true,
  imports: [CommonModule, FormsModule, MainContainer, CustomSelectComponent, SlidersContainer],
  templateUrl: './home-video.html',
  styleUrls: ['./home-video.scss']
})
export class HomeVideoComponent {
  sliderOrientation = signal<SliderOrientation>('vertical');

  // Channel data
  channels: Fader[] = [];
  channelsSelected: Fader[] = [];
  mainFader!: Fader;
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
  private readonly GROUP_REPEAT_INTERVAL_MS = 60;
  private groupRepeatTimer: number | null = null;

  // Main container visibility toggle
  showMainContainer: boolean = false;

  // AUX selection
  auxOptions: CustomSelectOption[] = [];
  selectedAux: number | null = null;

  // Channel filter (all vs selected) — logic to be wired later
  showAllChannels: boolean = true;

  constructor(
    private sliderSettings: SliderSettingsService,
    private videoService: VideoService,
    private userService: UserService,
    private webSocketService: WebSocketService
  ) {
    effect(() => {
      this.sliderOrientation.set(this.sliderSettings.sliderOrientation());
    });

    this.loadHomeData();
  }

  private loadHomeData(): void {
    this.sliderOrientation.set(this.sliderSettings.getOrientation());

    this.videoService.loadHome().subscribe({
      next: (res) => {
        for (let aux of res.aux) {
          this.auxOptions.push({ value: aux.id, label: aux.name });
        }

        this.mainFader = res.fader.find(f => f.id === 0) ?? {
          id: 0,
          name: '',
          description: '',
          value: 0,
          switch: false,
          link: false,
          type: null,
          position: null
        };

        res.fader.forEach(f => f.switch = !f.switch);
        this.channels = res.fader.filter(f => f.id !== 0);
        this.channelsSelected = this.channels;

        this.auxUser = res.auxUser;
        this.selectedAux = this.auxUser.id;

        this.webSocketService.connect(this.token!, TypeSocket.AUX, UserRole.VIDEO, this.auxUser.id);

        this.webSocketService.messages().subscribe(msg => {
          const fader = this.channels.find(f => f.id === msg.payload.channel);

          if (fader) {
            if (msg.payload.value === true || msg.payload.value === false)
              fader.switch = !msg.payload.value;
            else
              fader.value = parseFloat(msg.payload.value);
          }
        });

        this.faderUpdate$
          .pipe(auditTime(50))
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
        console.error('Errore nel caricamento dei dati:', err);
      }
    });

    this.userService.loadFaderNames().subscribe({
      next: (res) => {
        this.channels.forEach(ch => {
          const named = res.find(r => r.id === ch.id);
          if (named) ch.description = named.description;
        });
      },
      error: (err) => {
        console.error('Errore nel caricamento dei nomi fader:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopGroupRepeat();
    this.webSocketService.disconnect();
  }

  selectTab(tabId: TypeChannel | string): void {
    this.activeTab = tabId;
    if (tabId === "all")
      this.channelsSelected = this.channels;
    else
      this.channelsSelected = this.channels.filter(f => f.type === tabId);
  }

  toggleMainContainer(): void {
    this.showMainContainer = !this.showMainContainer;
  }

  onAuxChange(value: number): void {
    this.selectedAux = value;
    console.log(`Selected AUX: ${this.selectedAux}`);

    this.webSocketService.disconnect();
    this.webSocketService.connect(this.token!, TypeSocket.AUX, UserRole.VIDEO, value);
    this.manageMessage();

    this.syncChannelsValues(value);
  }

  private manageMessage() {
    this.webSocketService.messages().subscribe(msg => {
      const fader = this.channels.find(f => f.id === msg.payload.channel);

      if (fader) {
        if (msg.payload.value === true || msg.payload.value === false)
          fader.switch = !msg.payload.value;
        else
          fader.value = parseFloat(msg.payload.value);
      }
    });
  }

  private syncChannelsValues(auxId: number) {
    this.videoService.loadValues(auxId).subscribe({
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
  }

  isSelected(id: number): boolean {
    return this.selectedSliderId === id;
  }

  updateFader(event: { fader: Fader, type: TypeRequest }) {
    this.faderUpdate$.next(event);
  }

  // Group control methods
  startGroupRepeat(direction: 1 | -1): void {
    this.stopGroupRepeat();
    const offset = direction * this.GROUP_CONTROL_STEP;
    this.applyGroupControl(offset);
    this.groupRepeatTimer = window.setInterval(
      () => this.applyGroupControl(offset),
      this.GROUP_REPEAT_INTERVAL_MS
    );
  }

  stopGroupRepeat(): void {
    if (this.groupRepeatTimer !== null) {
      clearInterval(this.groupRepeatTimer);
      this.groupRepeatTimer = null;
    }
  }

  private applyGroupControl(offset: number): void {
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

  showGroupControl(): boolean {
    return this.activeTab === TypeChannel.INSTRUMENT ||
           this.activeTab === TypeChannel.VOICE ||
           this.activeTab === TypeChannel.DRUM;
  }
}
