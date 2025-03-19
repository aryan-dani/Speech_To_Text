import { Injectable, NgZone } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket$: WebSocketSubject<any>;

  constructor(private zone: NgZone) {
    // Create a WebSocket connection
    this.socket$ = webSocket('ws://192.168.1.96:8000/generate_summary/');
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

  // New method to handle summary generation WebSocket
  generateSummary(transcription: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(
        'ws://192.168.1.96:8000/transcribe/generate_summary/'
      );
      ws.onopen = () => {
        ws.send(transcription);
      };
      ws.onmessage = (event) => {
        this.zone.run(() => {
          resolve(event.data);
        });
        ws.close();
      };
      ws.onerror = (err) => {
        this.zone.run(() => {
          reject(err);
        });
        ws.close();
      };
    });
  }
}
