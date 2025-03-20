import { Injectable, NgZone } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Base URL for backend services
const BACKEND_HOST = '192.168.1.96';
const BACKEND_PORT = 8000;
const BACKEND_WS_BASE = `ws://${BACKEND_HOST}:${BACKEND_PORT}`;
const BACKEND_HTTP_BASE = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private summarySocket$!: WebSocketSubject<any>;
  private transcribeSocket$!: WebSocketSubject<any>;
  private aiSocket$!: WebSocketSubject<any>;
  
  // Direct WebSocket connection for transcription
  private transcribeWsUrl = `${BACKEND_WS_BASE}/transcribe/`;
  private transcribeSocket: WebSocket | null = null;
  public transcriptionSubject: Subject<string> = new Subject();
  private reconnectAttempts: number = 0;

  constructor(private zone: NgZone) {
    // Initialize the direct WebSocket connection
    this.connectDirectWebSocket();
  }
  
  // Direct WebSocket Implementation with robust connection handling
  private connectDirectWebSocket(): void {
    if (this.transcribeSocket === null || this.transcribeSocket.readyState === WebSocket.CLOSED) {
      console.log('Connecting to direct WebSocket:', this.transcribeWsUrl);
      this.transcribeSocket = new WebSocket(this.transcribeWsUrl);
  
      this.transcribeSocket.onopen = () => {
        console.log('Direct WebSocket connection established successfully');
      };
  
      this.transcribeSocket.onmessage = (event) => {
        this.zone.run(() => {
          try {
            console.log('WebSocket message received:', event.data);
            // Try to parse as JSON first
            const data = JSON.parse(event.data);
            this.transcriptionSubject.next(typeof data === 'string' ? data : JSON.stringify(data));
          } catch (e) {
            // If not JSON, use as plain text
            this.transcriptionSubject.next(event.data);
          }
        });
      };
  
      this.transcribeSocket.onerror = (error) => {
        console.error('Direct WebSocket error:', error);
        // Don't immediately emit an error - this lets us try to reconnect
        console.warn('Will attempt to reconnect WebSocket');
      };
  
      this.transcribeSocket.onclose = (event) => {
        console.warn('Direct WebSocket closed:', event);
        
        // Auto-reconnect after a delay with exponential backoff
        const delay = Math.min(3000 * (this.reconnectAttempts + 1), 30000);
        this.reconnectAttempts++;
        
        console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(() => {
          this.connectDirectWebSocket();
          // If successfully reconnected, notify subscribers
          if (this.transcribeSocket && this.transcribeSocket.readyState === WebSocket.OPEN) {
            this.transcriptionSubject.next('WebSocket reconnected successfully');
          }
        }, delay);
      };
    }
  }
  
  // Send audio data through the direct WebSocket connection
  sendAudioData(audioData: ArrayBuffer | Blob): void {
    if (!this.transcribeSocket || this.transcribeSocket.readyState !== WebSocket.OPEN) {
      this.connectDirectWebSocket();
      // Wait a bit for connection to establish if it was just created
      setTimeout(() => this.processSendAudioData(audioData), 500);
    } else {
      this.processSendAudioData(audioData);
    }
  }
  
  private processSendAudioData(audioData: ArrayBuffer | Blob): void {
    if (!this.transcribeSocket) {
      console.error('WebSocket not initialized, attempting to reconnect');
      this.connectDirectWebSocket();
      setTimeout(() => this.processSendAudioData(audioData), 500);
      return;
    }
    
    if (this.transcribeSocket.readyState !== WebSocket.OPEN) {
      console.error(`WebSocket not open (state: ${this.transcribeSocket.readyState}), cannot send audio data`);
      // Try to reconnect if the socket is closed
      if (this.transcribeSocket.readyState === WebSocket.CLOSED) {
        console.log('Attempting to reconnect closed WebSocket');
        this.connectDirectWebSocket();
        setTimeout(() => this.processSendAudioData(audioData), 1000);
      }
      return;
    }
    
    try {
      if (audioData instanceof Blob) {
        // Convert Blob to base64 for transmission
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const audioBytes = new Uint8Array(arrayBuffer);
            
            // Send the raw binary data directly - this is what the fullqa_api.py expects
            // The backend uses: audio_bytes = await websocket.receive_bytes()
            this.transcribeSocket?.send(audioBytes);
            
            // Reset reconnect attempts on successful send
            this.reconnectAttempts = 0;
            
            console.log('Audio data sent successfully via WebSocket');
          } catch (error) {
            console.error('Error processing Blob audio data:', error);
            this.transcriptionSubject.next('Error processing audio: ' + (error instanceof Error ? error.message : 'Unknown error'));
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading Blob:', error);
          this.transcriptionSubject.next('Error reading audio data');
        };
        reader.readAsArrayBuffer(audioData);
      } else {
        // If it's already an ArrayBuffer
        const audioBytes = new Uint8Array(audioData);
        // Send the raw binary data directly - this matches what fullqa_api.py expects
        this.transcribeSocket.send(audioBytes);
        
        // Reset reconnect attempts on successful send
        this.reconnectAttempts = 0;
        
        console.log('Audio data (ArrayBuffer) sent successfully via WebSocket');
      }
    } catch (error) {
      console.error('Error sending audio data via WebSocket:', error);
      this.transcriptionSubject.next('Error sending audio data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
  
  // Get Observable to subscribe to transcription updates
  getTranscriptionStream(): Observable<string> {
    if (!this.transcribeSocket || this.transcribeSocket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected, initializing connection');
      this.connectDirectWebSocket();
      
      // If socket is connecting, wait for it to connect
      if (this.transcribeSocket && this.transcribeSocket.readyState === WebSocket.CONNECTING) {
        console.log('Waiting for WebSocket connection to establish...');
        
        // Set up the onopen handler to reset reconnect attempts on success
        this.transcribeSocket.onopen = () => {
          console.log('WebSocket connection now established for transcription stream');
          // Reset reconnect attempts counter on successful connection
          this.reconnectAttempts = 0;
          
          // Add an initial message to the subject to indicate connection success
          this.transcriptionSubject.next('WebSocket connection established. Ready for transcription.');
        };
      }
    } else {
      console.log('Using existing WebSocket connection for transcription stream');
    }
    
    return this.transcriptionSubject.asObservable().pipe(
      // Add error handling
      catchError(error => {
        console.error('Error in transcription stream:', error);
        // Return a message about the error instead of failing
        return of(`Transcription error: ${error.message || 'Unknown error'}`);
      })
    );
  }

  // Send a message to the summary WebSocket
  sendMessage(message: any): void {
    this.connectToSummary();
    this.summarySocket$.next(message);
  }

  // Return an observable to listen for incoming messages from summary WebSocket
  getMessages() {
    this.connectToSummary();
    return this.summarySocket$.asObservable();
  }

  // Close all WebSocket connections
  close(): void {
    if (this.summarySocket$ && !this.summarySocket$.closed) {
      this.summarySocket$.complete();
    }
    if (this.transcribeSocket$ && !this.transcribeSocket$.closed) {
      this.transcribeSocket$.complete();
    }
    if (this.aiSocket$ && !this.aiSocket$.closed) {
      this.aiSocket$.complete();
    }
    
    // Close the direct WebSocket connection
    if (this.transcribeSocket && this.transcribeSocket.readyState === WebSocket.OPEN) {
      this.transcribeSocket.close();
      this.transcribeSocket = null;
    }
  }

  // Connect to the summary WebSocket endpoint
  private connectToSummary(): void {
    if (!this.summarySocket$ || this.summarySocket$.closed) {
      this.summarySocket$ = webSocket({
        url: `${BACKEND_WS_BASE}/generate_summary/`,
        openObserver: {
          next: () =>
            console.log('WebSocket connected to generate_summary endpoint'),
        },
        deserializer: (e) => {
          try {
            // First try to parse as JSON
            return JSON.parse(e.data);
          } catch (err) {
            // If it's not valid JSON, return as text
            return e.data;
          }
        },
        serializer: (value) => {
          // If the value is already a string, use it directly
          if (typeof value === 'string') {
            return value;
          }
          // Otherwise, convert to JSON string
          return JSON.stringify(value);
        },
      });
    }
  }

  // Connect to the transcribe WebSocket endpoint
  private connectToTranscribe(): void {
    if (!this.transcribeSocket$ || this.transcribeSocket$.closed) {
      const wsUrl = `${BACKEND_WS_BASE}/transcribe/`;
      console.log('Connecting to WebSocket at:', wsUrl);
      
      this.transcribeSocket$ = webSocket({
        url: wsUrl,
        openObserver: {
          next: () => console.log('WebSocket connected to transcribe endpoint')
        },
        closeObserver: {
          next: (e) => console.log('WebSocket connection closed:', e)
        },
        deserializer: (e) => {
          try {
            // First try to parse as JSON
            return JSON.parse(e.data);
          } catch (err) {
            // If it's not valid JSON, return as text
            return e.data;
          }
        },
        serializer: (value) => {
          // If the value is already a string, use it directly
          if (typeof value === 'string') {
            return value;
          }
          // Otherwise, convert to JSON string
          return JSON.stringify(value);
        }
      });
    }
  }

  // Connect to the AI WebSocket endpoint
  private connectToAI(): void {
    if (!this.aiSocket$ || this.aiSocket$.closed) {
      this.aiSocket$ = webSocket({
        url: `${BACKEND_WS_BASE}/talk_with_ai/`,
        openObserver: {
          next: () =>
            console.log('WebSocket connected to talk_with_ai endpoint'),
        },
      });
    }
  }

  // Method to handle summary generation WebSocket with SSR guard
  generateSummary(transcription: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('WebSocket not available in SSR mode.'));
        return;
      }

      this.connectToSummary();

      const subscription = this.summarySocket$.subscribe({
        next: (message) =>
          this.zone.run(() => {
            console.log('WebSocket message received:', message);

            try {
              // Handle different response formats
              // Backend might send JSON or string
              if (typeof message === 'string') {
                try {
                  // Try to parse as JSON if it's a string that contains JSON
                  const jsonData = JSON.parse(message);
                  resolve(jsonData);
                } catch (e) {
                  // If not valid JSON, return as string
                  resolve(message);
                }
              } else {
                // If already an object, return as is
                resolve(message);
              }
            } catch (error) {
              console.warn('Error processing summary response:', error);
              // Return raw message if processing fails
              resolve(message);
            }

            subscription.unsubscribe();
          }),
        error: (err) =>
          this.zone.run(() => {
            console.error('WebSocket error:', err);
            reject(err);
            subscription.unsubscribe();
          }),
        complete: () =>
          this.zone.run(() => {
            console.warn('WebSocket connection closed by server');
            subscription.unsubscribe();
          }),
      });

      this.summarySocket$.next(transcription);
      console.log('Sent transcription payload:', transcription);
    });
  }

  // Method to handle transcription via WebSocket
  transcribeAudio(audioData: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('WebSocket not available in SSR mode.'));
        return;
      }

      this.connectToTranscribe();

      const subscription = this.transcribeSocket$.subscribe({
        next: (message) =>
          this.zone.run(() => {
            console.log('Transcription received:', message);
            // Handle both string and JSON responses
            if (typeof message === 'object') {
              resolve(JSON.stringify(message));
            } else {
              resolve(message);
            }
            subscription.unsubscribe();
          }),
        error: (err) =>
          this.zone.run(() => {
            console.error('WebSocket error:', err);
            reject(err);
            subscription.unsubscribe();
          }),
        complete: () =>
          this.zone.run(() => {
            console.warn('WebSocket connection closed by server');
            subscription.unsubscribe();
          }),
      });

      // Convert Blob to base64 string as expected by the backend
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const audioBytes = new Uint8Array(arrayBuffer);
          
          // For rxjs WebSocketSubject, we need to wrap the data
          // We'll modify the parameter name from 'audio' to 'bytes' to match
          // what the backend is expecting
          const base64data = btoa(
            audioBytes.reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );
          this.transcribeSocket$.next({ bytes: base64data });
          console.log('Sent audio data for transcription');
        } catch (error) {
          console.error('Error processing audio data:', error);
          reject(new Error('Failed to encode audio data'));
        }
      };
      reader.onerror = (error) => {
        console.error('Error reading audio file:', error);
        reject(new Error('Failed to process audio data'));
      };
      reader.readAsArrayBuffer(audioData);
    });
  }

  // Method for real-time transcription via WebSocket
  // Returns an observable that emits transcription updates as they come in
  // Note: HTTP POST to /transcribe/ is recommended instead for more reliable real-time transcription
  streamTranscription(): {
    observable: Observable<any>;
    send: (audioData: Blob) => void;
  } {
    if (typeof window === 'undefined') {
      throw new Error('WebSocket not available in SSR mode.');
    }

    this.connectToTranscribe();
    
    // Create a subject to forward WebSocket messages and handle errors
    const transcriptionSubject = new Subject<any>();
    
    // Subscribe to the WebSocket and forward messages to our subject
    const wsSubscription = this.transcribeSocket$.subscribe({
      next: (message) => {
        console.log('Received transcription update:', message);
        transcriptionSubject.next(message);
      },
      error: (err) => {
        console.error('WebSocket error during real-time transcription:', err);
        transcriptionSubject.error(err);
      },
      complete: () => {
        console.log('Transcription WebSocket connection closed');
        transcriptionSubject.complete();
      }
    });

    // Function to send audio data to the transcription WebSocket
    const send = (audioData: Blob) => {
      // Convert Blob to base64 string as expected by the backend
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          
          // The backend is expecting raw audio data as a Float32Array
          const audioData = new Uint8Array(arrayBuffer);
          
          // We're using the WebSocketSubject from rxjs, so we need to send a JSON object
          // Change the property from 'audio' to 'bytes' to match what the backend expects
          const base64data = btoa(
            audioData.reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );
          
          console.log('Sending audio data for real-time transcription...');
          
          // Send with the 'bytes' key instead of 'audio'
          this.transcribeSocket$.next({ bytes: base64data });
          
        } catch (error) {
          console.error('Error processing audio data for real-time transcription:', error);
          transcriptionSubject.error(error);
        }
      };
      reader.onerror = (error) => {
        console.error('Error reading audio file:', error);
        transcriptionSubject.error(error);
      };
      reader.readAsArrayBuffer(audioData);
    };

    return {
      observable: transcriptionSubject.asObservable(),
      send
    };
  }

  // Method to interact with AI via WebSocket
  askAI(transcription: string, query: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('WebSocket not available in SSR mode.'));
        return;
      }

      this.connectToAI();

      // Set a timeout to prevent hanging indefinitely
      const timeoutId = setTimeout(() => {
        console.error('WebSocket request timed out');
        subscription.unsubscribe();
        reject(
          new Error('Request timed out. The AI service may be unavailable.')
        );
      }, 30000); // 30 second timeout

      const subscription = this.aiSocket$.subscribe({
        next: (message) =>
          this.zone.run(() => {
            clearTimeout(timeoutId);
            console.log('AI response received:', message);

            // Handle different response formats
            if (typeof message === 'object') {
              try {
                // If it's an object with an error field
                if (message.error) {
                  console.warn('AI service returned an error:', message.error);
                  resolve(`Error: ${message.error}`);
                } else {
                  // Convert object to string if needed
                  resolve(JSON.stringify(message));
                }
              } catch (e) {
                console.warn('Error processing AI response:', e);
                resolve(String(message));
              }
            } else {
              // If it's already a string
              resolve(message);
            }

            subscription.unsubscribe();
          }),
        error: (err) =>
          this.zone.run(() => {
            clearTimeout(timeoutId);
            console.error('WebSocket error:', err);

            // Provide more specific error messages
            if (err.message && err.message.includes('not found')) {
              reject(
                new Error(
                  'AI service endpoint not found. Please check if the backend is running.'
                )
              );
            } else if (err.message && err.message.includes('timeout')) {
              reject(
                new Error(
                  'Connection to AI service timed out. The server might be overloaded.'
                )
              );
            } else {
              reject(err);
            }

            subscription.unsubscribe();
          }),
        complete: () =>
          this.zone.run(() => {
            clearTimeout(timeoutId);
            console.warn('WebSocket connection closed by server');
            subscription.unsubscribe();
          }),
      });

      try {
        this.aiSocket$.next({ transcription, query });
        console.log('Sent AI request payload:', { transcription, query });
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error sending data to WebSocket:', error);
        reject(new Error('Failed to send request to AI service'));
        subscription.unsubscribe();
      }
    });
  }

  // Get the HTTP base URL for REST endpoints
  getHttpBaseUrl(): string {
    return BACKEND_HTTP_BASE;
  }
}
