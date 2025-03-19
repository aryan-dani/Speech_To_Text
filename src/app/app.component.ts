import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { WebSocketService } from './services/web-socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatToolbarModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'medical-transcription-app';
  receivedMessages: string[] = [];

  constructor(private wsService: WebSocketService) {}

  ngOnInit(): void {
    // Subscribe to incoming messages from the WebSocket
    this.wsService.getMessages().subscribe({
      next: (msg: any) => {
        console.log('Received:', msg);
        this.receivedMessages.push(
          typeof msg === 'string' ? msg : JSON.stringify(msg)
        );
      },
      error: (err) => console.error(err),
      complete: () => console.warn('WebSocket connection closed'),
    });

    // Send an initial test message
    this.wsService.sendMessage({ text: 'Hello, Server!' });
  }

  ngOnDestroy(): void {
    // Clean up by closing the WebSocket connection
    this.wsService.close();
  }

  // Method to manually send a test message
  sendTestMessage(): void {
    this.wsService.sendMessage({ text: 'Test message from Angular' });
  }
}
