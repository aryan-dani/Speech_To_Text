import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket$: WebSocketSubject<any>;

  constructor() {
    // Create a WebSocket connection
    this.socket$ = webSocket('ws://localhost:8000/transcribe/');
  }

  // Send a message to the server
  sendMessage(message: any): void {
    this.socket$.next(message);
  }

  // Return an observable to listen for incoming messages
  getMessages() {
    return this.socket$.asObservable();
  }

  // Close the WebSocket connection
  close(): void {
    this.socket$.complete();
  }
}
