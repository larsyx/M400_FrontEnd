import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { environment } from "../../../environments/environment.development";

export interface SocketMessage<T = any> {
  type: string;
  payload: T;
}

export enum TypeSocket{
  MIXER = 'liveSyncMixer',
  AUX = 'liveSyncAux'
}

export enum TypeRequest{
    AUTH = "auth",
    PING = "ping",
    SLIDER_VALUE = "slider_value",
    SLIDER_SWITCH = "slider_switch",
    DCA_VALUE = "dca_value",
    DCA_SWITCH = "dca_switch"
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private WS_URL = environment.wsUrl + '/ws/' 
  private socket!: WebSocket;
  private messages$ = new Subject<SocketMessage>();

  connect(token: string, type: TypeSocket, aux_id?: number) {
    this.socket = new WebSocket(this.WS_URL + type);

    this.socket.onopen = () => {
      console.log('✅ WebSocket connessa');

      this.send({
        type: 'auth',
        payload: {
          token: token,
          role: "mixer",
          aux_id:  aux_id
        }
      });
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messages$.next(data);
    };

    this.socket.onerror = (err) => {
      console.error('❌ WS errore', err);
    };

    this.socket.onclose = () => {
      console.warn('⚠️ WS chiusa');
    };
  }

  send<T>(message: SocketMessage<T>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ Socket non pronta');
    }
  }

  messages(): Observable<SocketMessage> {
    return this.messages$.asObservable();
  }

  disconnect() {
    this.socket?.close();
  }
}