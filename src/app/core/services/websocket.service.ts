import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";

export interface SocketMessage<T = any> {
  type: string;
  payload: T;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private socket!: WebSocket;
  private messages$ = new Subject<SocketMessage>();

  connect(token: string) {
    this.socket = new WebSocket('ws://localhost:8000/ws/liveSyncMixer');

    this.socket.onopen = () => {
      console.log('✅ WebSocket connessa');

      this.send({
        type: 'auth',
        payload: {
          token: token
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