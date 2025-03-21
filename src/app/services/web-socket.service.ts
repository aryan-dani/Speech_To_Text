import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Base URL for backend services (ensure this matches your backend)
const BACKEND_HOST = '192.168.1.96';
const BACKEND_PORT = 8000;
const BACKEND_WS_BASE = `ws://${BACKEND_HOST}:${BACKEND_PORT}`;
const BACKEND_HTTP_BASE = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private transcribeWsUrl = `${BACKEND_WS_BASE}/transcribe/`;
  private summaryWsUrl = `${BACKEND_WS_BASE}/generate_summary/`;
  private aiWsUrl = `${BACKEND_WS_BASE}/talk_with_ai/`;

  private transcribeSocket: WebSocket | null = null;
  private summarySocket: WebSocket | null = null;

  public transcriptionSubject: Subject<string> = new Subject();
  public summarySubject: Subject<any> = new Subject();

  private transcribeReconnectAttempts = 0;
  private summaryReconnectAttempts = 0;
  private maxReconnectDelay = 30000; // 30 seconds max delay

  constructor(private zone: NgZone) {
    this.connectTranscriptionWebSocket();
    this.connectSummaryWebSocket();
  }

  // Transcription WebSocket Connection
  private connectTranscriptionWebSocket(): void {
    if (
      !this.transcribeSocket ||
      this.transcribeSocket.readyState === WebSocket.CLOSED ||
      this.transcribeSocket.readyState === WebSocket.CLOSING
    ) {
      console.log(
        'Attempting to connect to transcription WebSocket:',
        this.transcribeWsUrl
      );
      this.transcribeSocket = new WebSocket(this.transcribeWsUrl);

      this.transcribeSocket.onopen = () => {
        console.log('Transcription WebSocket connected');
        this.transcribeReconnectAttempts = 0;
        this.transcriptionSubject.next('WebSocket connected');
      };

      this.transcribeSocket.onmessage = (event) => {
        this.zone.run(() => {
          console.log('Transcription received:', event.data);
          // Backend sends plain text, no JSON parsing needed
          this.transcriptionSubject.next(event.data);
        });
      };

      this.transcribeSocket.onerror = (error) => {
        console.error('Transcription WebSocket error:', error);
        // Log the error object to inspect its structure
        console.log('Transcription WebSocket error object:', error);
        // Dispatch a new Event instance with the error message
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.transcriptionSubject.next(`WebSocket error: ${errorMessage}`);
      };

      this.transcribeSocket.onclose = (event) => {
        console.warn('Transcription WebSocket closed:', event);
        // Log the close event to inspect its structure
        console.log('Transcription WebSocket close event:', event);
        this.reconnectTranscription();
      };
    }
  }

  private reconnectTranscription(): void {
    const delay = Math.min(
      3000 * (this.transcribeReconnectAttempts + 1),
      this.maxReconnectDelay
    );
    this.transcribeReconnectAttempts++;
    console.log(
      `Reconnecting transcription in ${delay}ms (attempt ${this.transcribeReconnectAttempts})`
    );
    // Log before attempting to reconnect
    console.log('Attempting to reconnect to transcription WebSocket');
    setTimeout(() => this.connectTranscriptionWebSocket(), delay);
  }

  // Send audio data (expects 16kHz, 16-bit PCM)
  sendAudioData(audioData: ArrayBuffer | Blob): void {
    if (
      !this.transcribeSocket ||
      this.transcribeSocket.readyState !== WebSocket.OPEN
    ) {
      console.warn('Transcription WebSocket not open, attempting to connect');
      this.connectTranscriptionWebSocket();
      setTimeout(() => this.sendAudioData(audioData), 500);
      return;
    }

    try {
      if (audioData instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const audioBytes = new Uint8Array(arrayBuffer);
          this.transcribeSocket!.send(audioBytes);
          console.log('Audio data (Blob) sent');
        };
        reader.onerror = () => {
          console.error('Error reading Blob');
          this.transcriptionSubject.next('Error reading audio data');
        };
        reader.readAsArrayBuffer(audioData);
      } else {
        const audioBytes = new Uint8Array(audioData);
        this.transcribeSocket.send(audioBytes);
        console.log('Audio data (ArrayBuffer) sent');
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      this.transcriptionSubject.next(
        'Error sending audio: ' +
          (error instanceof Error ? error.message : 'Unknown')
      );
    }
  }

  // Get transcription stream
  getTranscriptionStream(): Observable<string> {
    if (
      !this.transcribeSocket ||
      this.transcribeSocket.readyState !== WebSocket.OPEN
    ) {
      console.log('Transcription WebSocket not connected, initializing');
      this.connectTranscriptionWebSocket();
    }
    return this.transcriptionSubject.asObservable();
  }

  // Summary WebSocket Connection
  private connectSummaryWebSocket(): void {
    if (
      !this.summarySocket ||
      this.summarySocket.readyState === WebSocket.CLOSED ||
      this.summarySocket.readyState === WebSocket.CLOSING
    ) {
      console.log(
        'Attempting to connect to summary WebSocket:',
        this.summaryWsUrl
      );
      this.summarySocket = new WebSocket(this.summaryWsUrl);

      this.summarySocket.onopen = () => {
        console.log('Summary WebSocket connected');
        this.summaryReconnectAttempts = 0;
      };

      this.summarySocket.onmessage = (event) => {
        this.zone.run(() => {
          try {
            console.log('Summary received:', event.data);
            const data = JSON.parse(event.data); // Backend sends JSON
            this.summarySubject.next(data);
          } catch (error) {
            console.error('Error parsing summary:', error);
            this.summarySubject.error(error);
          }
        });
      };

      this.summarySocket.onerror = (error) => {
        console.error('Summary WebSocket error:', error);
        // Log the error object to inspect its structure
        console.log('Summary WebSocket error object:', error);
        // Dispatch a new Event instance with the error message
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.summarySubject.error(`WebSocket error: ${errorMessage}`);
      };

      this.summarySocket.onclose = (event) => {
        console.warn('Summary WebSocket closed:', event);
        // Log the close event to inspect its structure
        console.log('Summary WebSocket close event:', event);
        this.reconnectSummary();
      };
    }
  }

  private reconnectSummary(): void {
    const delay = Math.min(
      3000 * (this.summaryReconnectAttempts + 1),
      this.maxReconnectDelay
    );
    this.summaryReconnectAttempts++;
    console.log(
      `Reconnecting summary in ${delay}ms (attempt ${this.summaryReconnectAttempts})`
    );
    // Log before attempting to reconnect
    console.log('Attempting to reconnect to summary WebSocket');
    setTimeout(() => this.connectSummaryWebSocket(), delay);
  }

  // Generate summary
  generateSummary(transcription: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (
        !this.summarySocket ||
        this.summarySocket.readyState !== WebSocket.OPEN
      ) {
        this.connectSummaryWebSocket();
        setTimeout(
          () => this.generateSummary(transcription).then(resolve).catch(reject),
          500
        );
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Summary response:', data);
          resolve(data);
          this.summarySocket!.removeEventListener('message', messageHandler);
        } catch (error) {
          console.error('Error processing summary:', error);
          reject(error);
          this.summarySocket!.removeEventListener('message', messageHandler);
        }
      };

      this.summarySocket.addEventListener('message', messageHandler);
      this.summarySocket.onerror = (error) =>
        reject(new Error('Summary WebSocket error'));
      this.summarySocket.onclose = () =>
        reject(new Error('Summary WebSocket closed'));

      try {
        // Format the message according to the new requirements
        const message = JSON.stringify({ transcription: transcription });
        this.summarySocket.send(message);
        console.log('Sent transcription for summary:', message);
      } catch (error) {
        console.error('Error sending transcription:', error);
        reject(error);
      }
    });
  }

  // AI Interaction (simplified, assuming rxjs/webSocket isn’t strictly needed)
  askAI(transcription: string, query: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.aiWsUrl);

      socket.onopen = () => {
        // Format the message according to the new requirements
        const payload = JSON.stringify({
          query: query,
          transcription: transcription,
        });
        socket.send(payload);
        console.log('Sent AI request:', payload);
      };

      socket.onmessage = (event) => {
        console.log('AI response:', event.data);
        resolve(event.data); // Backend sends text
        socket.close();
      };

      socket.onerror = (error) => {
        console.error('AI WebSocket error:', error);
        // Log the error object to inspect its structure
        console.log('AI WebSocket error object:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        reject(new Error(`AI WebSocket error: ${errorMessage}`));
      };

      socket.onclose = (event) => {
        if (event.code !== 1000) {
          // Normal closure
          console.warn('AI WebSocket closed unexpectedly:', event);
          reject(new Error('AI WebSocket closed'));
        }
      };
    });
  }

  // Close connections
  close(): void {
    if (this.transcribeSocket?.readyState === WebSocket.OPEN) {
      this.transcribeSocket.close();
      this.transcribeSocket = null;
    }
    if (this.summarySocket?.readyState === WebSocket.OPEN) {
      this.summarySocket.close();
      this.summarySocket = null;
    }
  }

  getHttpBaseUrl(): string {
    return BACKEND_HTTP_BASE;
  }
}
