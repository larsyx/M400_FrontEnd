import { Component, Input, OnInit } from '@angular/core';
import { SlidersContainer } from '../../../../shared/sliders/sliders-container/sliders-container/sliders-container';
import { Fader } from '../../../../core/models/fader.model';
import { MixerService } from '../../../../core/services/mixer.service';
import { TypeRequest, TypeSocket, WebSocketService } from '../../../../core/services/websocket.service';

@Component({
  selector: 'app-dca',
  imports: [SlidersContainer],
  standalone: true,
  templateUrl: './dca.html',
  styleUrl: './dca.scss',
})
export class Dca implements OnInit {

  @Input() dca: Fader[] = [];
  token = localStorage.getItem('access_token');

  constructor(private mixerService: MixerService, private webSocketService: WebSocketService){}

  ngOnInit(): void {
    if(this.dca.length==0){
      this.mixerService.loadDca().subscribe({
        next: (res) => {
          this.dca = res;
        }
      });
    }

    this.webSocketService.connect(this.token!, TypeSocket.MIXER);

    this.webSocketService.messages().subscribe(msg => {
      console.log(msg.payload);
    });
  }


  onFaderUpdate(event: {fader: Fader, type: TypeRequest}){
    if(event.type == TypeRequest.SLIDER_VALUE)
      event.type = TypeRequest.DCA_VALUE
    if(event.type == TypeRequest.SLIDER_SWITCH)
      event.type = TypeRequest.DCA_SWITCH

    this.webSocketService.send({
      type: event.type,
      payload: {
        channel: event.fader.id,
        value: event.fader.value.toFixed(1),
        switch: event.fader.switch
      }
    });
  }
}
