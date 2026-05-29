import { Injectable, inject } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { environment } from "../../../environments/environment.development";
import { LoaderService } from "./loader.service";
import { UserRole } from "../models/user.model";

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
  private loader = inject(LoaderService);
  private connectingShown = false;

    connect(token: string, type: TypeSocket, role : UserRole, aux_id?: number) {
    this.socket = new WebSocket(this.WS_URL + type);

    this.loader.show();
    this.connectingShown = true;

    this.socket.onopen = () => {
      console.log('✅ WebSocket connessa');
      this.releaseConnectingLoader();

      this.send({
        type: 'auth',
        payload: {
          token: token,
          role: role,
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
      this.releaseConnectingLoader();
    };

    this.socket.onclose = () => {
      console.warn('⚠️ WS chiusa');
      this.releaseConnectingLoader();
    };
  }

  private releaseConnectingLoader() {
    if (this.connectingShown) {
      this.connectingShown = false;
      this.loader.hide();
    }
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
    this.releaseConnectingLoader();
  }
}