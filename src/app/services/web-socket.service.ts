import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoggingService } from './logging.service';

// Configuration constants from environment
const BACKEND_CONFIG = environment.backend;

// Define protocol variables - these will be updated in the constructor if needed
let WS_PROTOCOL = BACKEND_CONFIG.useSecureWebSockets ? 'wss' : 'ws';
let HTTP_PROTOCOL = BACKEND_CONFIG.useSecureWebSockets ? 'https' : 'http';
let BACKEND_WS_BASE = `${WS_PROTOCOL}://${BACKEND_CONFIG.host}`;
let BACKEND_HTTP_BASE = `${HTTP_PROTOCOL}://${BACKEND_CONFIG.host}`;

// WebSocket error code descriptions for better error messages
const WS_ERROR_CODES: Record<number, string> = {
  1000: 'Normal closure',
  1001: 'Going away',
  1002: 'Protocol error',
  1003: 'Unsupported data',
  1004: 'Reserved',
  1005: 'No status received',
  1006: 'Abnormal closure',
  1007: 'Invalid frame payload data',
  1008: 'Policy violation',
  1009: 'Message too big',
  1010: 'Mandatory extension',
  1011: 'Internal server error',
  1012: 'Service restart',
  1013: 'Try again later',
  1014: 'Bad gateway',
  1015: 'TLS handshake',
};

// Type definitions for better type safety
interface SummaryRequest {
  transcription: string;
}

interface AIRequest {
  query: string;
  transcription: string;
}

interface WebSocketConnection {
  socket: WebSocket | null;
  url: string;
  reconnectAttempts: number;
  subject?: Subject<any>;
  connectionTimeout?: number;
}

type ConnectionType = 'transcribe' | 'summary';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  // WebSocket endpoints
  private readonly endpoints: {
    transcribe: string;
    summary: string;
    ai: string;
  };

  // Subject for communication streams
  public transcriptionSubject: Subject<string> = new Subject<string>();
  public summarySubject: Subject<any> = new Subject<any>();

  // Socket connection state
  private connections: Record<ConnectionType, WebSocketConnection>;

  // Track the last received transcription to prevent duplicates
  private lastTranscriptionReceived: string = '';
  private lastTranscriptionTime: number = 0;
  private transcriptionDedupeWindow: number = 1000; // 1 second window to deduplicate

  constructor(private zone: NgZone, private logger: LoggingService) {
    // Auto-detect protocol from current page URL and update configuration
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:';
      this.logger.info(`Detected protocol: ${window.location.protocol}, using ${isSecure ? 'secure' : 'standard'} WebSockets`);
      
      // Update protocol settings based on current page protocol
      WS_PROTOCOL = isSecure ? 'wss' : 'ws';
      HTTP_PROTOCOL = isSecure ? 'https' : 'http';
      BACKEND_WS_BASE = `${WS_PROTOCOL}://${BACKEND_CONFIG.host}`;
      BACKEND_HTTP_BASE = `${HTTP_PROTOCOL}://${BACKEND_CONFIG.host}`;
    }
    
    // Initialize endpoints with updated protocol
    this.endpoints = {
      transcribe: `${BACKEND_WS_BASE}/transcribe/`,
      summary: `${BACKEND_WS_BASE}/generate_summary/`,
      ai: `${BACKEND_WS_BASE}/talk_with_ai/`,
    };
    
    // Initialize connections with updated endpoints
    this.connections = {
      transcribe: {
        socket: null,
        url: this.endpoints.transcribe,
        reconnectAttempts: 0,
        subject: this.transcriptionSubject,
      },
      summary: {
        socket: null,
        url: this.endpoints.summary,
        reconnectAttempts: 0,
        subject: this.summarySubject,
      },
    };

    // Ensure we only initialize once
    this.initializeConnections();
    this.logger.info(`WebSocket base URL: ${BACKEND_WS_BASE}`);
  }

  // Initialize all WebSocket connections
  private initializeConnections(): void {
    this.connectWebSocket('transcribe');
    this.connectWebSocket('summary');
  }

  // Generic method to connect any WebSocket with enhanced error handling
  private connectWebSocket(type: ConnectionType): void {
    const connection = this.connections[type];

    if (
      !connection.socket ||
      connection.socket.readyState === WebSocket.CLOSED ||
      connection.socket.readyState === WebSocket.CLOSING
    ) {
      this.logger.info(
        `Attempting to connect to ${type} WebSocket`,
        connection.url
      );

      // Clear any existing timeout
      if (connection.connectionTimeout) {
        clearTimeout(connection.connectionTimeout);
      }

      try {
        connection.socket = new WebSocket(connection.url);

        // Set connection timeout
        connection.connectionTimeout = window.setTimeout(() => {
          if (connection.socket?.readyState !== WebSocket.OPEN) {
            this.logger.error(
              `${type} WebSocket connection timeout after ${BACKEND_CONFIG.connectionTimeout}ms`
            );
            connection.socket?.close();
            this.handleConnectionFailure(type, 'Connection timeout');
          }
        }, BACKEND_CONFIG.connectionTimeout);

        connection.socket.onopen = () => {
          // Clear the timeout on successful connection
          if (connection.connectionTimeout) {
            clearTimeout(connection.connectionTimeout);
          }

          this.logger.info(
            `${
              type.charAt(0).toUpperCase() + type.slice(1)
            } WebSocket connected`
          );
          connection.reconnectAttempts = 0;

          if (connection.subject) {
            connection.subject.next(
              type === 'transcribe'
                ? 'WebSocket connected'
                : { status: 'connected' }
            );
          }
        };

        connection.socket.onmessage = (event) => {
          this.zone.run(() => {
            this.logger.debug(`${type} received:`, event.data);

            if (connection.subject) {
              if (type === 'transcribe') {
                // Backend sends plain text for transcription
                const timestamp = new Date().toISOString();
                const currentTime = Date.now();
                
                // Deduplicate transcriptions received within the time window
                if (
                  event.data === this.lastTranscriptionReceived && 
                  (currentTime - this.lastTranscriptionTime) < this.transcriptionDedupeWindow
                ) {
                  this.logger.debug('Duplicate transcription received, ignoring', event.data);
                  console.log(`[${timestamp}] Duplicate transcription detected and ignored`);
                  return;
                }
                
                // Store this transcription to detect duplicates
                this.lastTranscriptionReceived = event.data;
                this.lastTranscriptionTime = currentTime;
                
                console.log(`[${timestamp}] Transcription received from WebSocket:`, event.data);
                connection.subject.next(event.data);
              } else {
                // For summary, parse JSON
                try {
                  const data = JSON.parse(event.data);
                  connection.subject.next(data);
                } catch (error) {
                  this.logger.error(`Error parsing ${type} data:`, error);
                  const errorMessage = this.getReadableErrorMessage(
                    'parsing_error',
                    error
                  );
                  connection.subject.error(errorMessage);
                }
              }
            }
          });
        };

        connection.socket.onerror = (error) => {
          this.logger.error(`${type} WebSocket error:`, error);

          if (connection.connectionTimeout) {
            clearTimeout(connection.connectionTimeout);
          }

          const errorMessage = this.getReadableErrorMessage(
            'socket_error',
            error
          );

          // If we're using secure WebSocket (wss) and getting errors, try falling back to insecure (ws)
          if (connection.url.startsWith('wss://') && connection.reconnectAttempts <= 1) {
            this.logger.warn('Secure WebSocket connection failed. Trying fallback to standard WebSocket...');
            const fallbackUrl = connection.url.replace('wss://', 'ws://');
            connection.url = fallbackUrl;
            
            // Close the current socket if it exists
            if (connection.socket) {
              connection.socket.close();
              connection.socket = null;
            }
            
            // Try to connect with the fallback URL
            setTimeout(() => this.connectWebSocket(type), 1000);
            return;
          }

          if (connection.subject) {
            if (type === 'transcribe') {
              connection.subject.next(`WebSocket error: ${errorMessage}`);
            } else {
              connection.subject.error(`WebSocket error: ${errorMessage}`);
            }
          }
        };

        connection.socket.onclose = (event) => {
          if (connection.connectionTimeout) {
            clearTimeout(connection.connectionTimeout);
          }

          const closeReason = this.getWebSocketCloseReason(event);
          this.logger.warn(`${type} WebSocket closed: ${closeReason}`);

          if (event.wasClean) {
            this.logger.info(
              `${type} WebSocket closed cleanly with code ${event.code}`
            );
          } else {
            this.logger.warn(`${type} WebSocket connection died unexpectedly`);
            
            // If we're using secure WebSocket (wss) and getting closed connections, try falling back to insecure (ws)
            if (connection.url.startsWith('wss://') && connection.reconnectAttempts <= 1) {
              this.logger.warn('Secure WebSocket connection closed. Trying fallback to standard WebSocket...');
              const fallbackUrl = connection.url.replace('wss://', 'ws://');
              connection.url = fallbackUrl;
              
              // Close the current socket if it exists
              if (connection.socket) {
                connection.socket.close();
                connection.socket = null;
              }
              
              // Try to connect with the fallback URL
              setTimeout(() => this.connectWebSocket(type), 1000);
              return;
            }
            
            this.handleConnectionFailure(type, closeReason);
          }
        };
      } catch (error) {
        this.logger.error(`Error creating ${type} WebSocket:`, error);
        this.handleConnectionFailure(type, this.logger.formatError(error));
      }
    }
  }

  // Get a readable message for WebSocket close events
  private getWebSocketCloseReason(event: CloseEvent): string {
    const code = event.code;
    const reason = event.reason || WS_ERROR_CODES[code] || 'Unknown reason';
    return `Code: ${code}, Reason: ${reason}`;
  }

  // Get human-readable error messages from various error types
  private getReadableErrorMessage(type: string, error: any): string {
    let baseMessage = '';

    switch (type) {
      case 'socket_error':
        baseMessage = 'Connection error';
        break;
      case 'parsing_error':
        baseMessage = 'Error processing data from server';
        break;
      case 'send_error':
        baseMessage = 'Error sending data to server';
        break;
      case 'connection_failure':
        baseMessage = 'Failed to connect to server';
        break;
      default:
        baseMessage = 'Unknown error';
    }

    const details = this.logger.formatError(error);
    return `${baseMessage}${details ? `: ${details}` : ''}`;
  }

  // Handle connection failures with max retry logic
  private handleConnectionFailure(
    type: ConnectionType,
    errorMessage: string
  ): void {
    const connection = this.connections[type];
    connection.reconnectAttempts++;

    // Check if we've reached maximum reconnection attempts
    if (connection.reconnectAttempts > BACKEND_CONFIG.maxReconnectAttempts) {
      this.logger.error(
        `${type} WebSocket maximum reconnection attempts (${BACKEND_CONFIG.maxReconnectAttempts}) reached. Giving up.`
      );

      if (connection.subject) {
        const message = `Unable to connect to the server after ${BACKEND_CONFIG.maxReconnectAttempts} attempts. Please check your network connection or contact support.`;
        connection.subject.error(message);
      }
      return;
    }

    this.scheduleReconnect(type);
  }

  // Handle reconnection with exponential backoff
  private scheduleReconnect(type: ConnectionType): void {
    const connection = this.connections[type];
    const delay = Math.min(
      BACKEND_CONFIG.reconnectBaseDelay *
        Math.pow(1.5, connection.reconnectAttempts - 1),
      BACKEND_CONFIG.maxReconnectDelay
    );

    this.logger.info(
      `Reconnecting ${type} in ${delay}ms (attempt ${connection.reconnectAttempts}/${BACKEND_CONFIG.maxReconnectAttempts})`
    );

    setTimeout(() => this.connectWebSocket(type), delay);
  }

  // Send audio data for transcription with enhanced error handling
  public sendAudioData(audioData: ArrayBuffer | Blob): void {
    const connection = this.connections['transcribe'];

    // Reset the deduplication tracker when sending new audio
    // This helps ensure we're starting fresh for each new audio chunk
    this.lastTranscriptionReceived = '';
    this.lastTranscriptionTime = 0;

    if (!connection.socket || connection.socket.readyState !== WebSocket.OPEN) {
      this.logger.warn(
        'Transcription WebSocket not open, attempting to connect'
      );
      this.connectWebSocket('transcribe');

      // If we're at the max attempts, don't try to send again
      if (connection.reconnectAttempts >= BACKEND_CONFIG.maxReconnectAttempts) {
        this.transcriptionSubject.next(
          'Cannot send audio: Unable to connect to the server. Please check your network connection or contact support.'
        );
        return;
      }

      setTimeout(() => this.sendAudioData(audioData), 500);
      return;
    }

    try {
      if (audioData instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const audioBytes = new Uint8Array(arrayBuffer);
          connection.socket!.send(audioBytes);
          this.logger.debug('Audio data (Blob) sent');
        };
        reader.onerror = (error) => {
          this.logger.error('Error reading Blob:', error);
          this.transcriptionSubject.next(
            `Error preparing audio data: ${this.logger.formatError(error)}`
          );
        };
        reader.readAsArrayBuffer(audioData);
      } else {
        const audioBytes = new Uint8Array(audioData);
        connection.socket.send(audioBytes);
        this.logger.debug('Audio data (ArrayBuffer) sent');
      }
    } catch (error) {
      this.logger.error('Error sending audio:', error);
      this.transcriptionSubject.next(
        `Error sending audio: ${this.logger.formatError(error)}`
      );
    }
  }

  // Get transcription stream as observable
  public getTranscriptionStream(): Observable<string> {
    if (
      !this.connections['transcribe'].socket ||
      this.connections['transcribe'].socket.readyState !== WebSocket.OPEN
    ) {
      this.logger.info('Transcription WebSocket not connected, initializing');
      this.connectWebSocket('transcribe');
    }
    return this.transcriptionSubject.asObservable();
  }

  // Generate summary with improved promise handling and error messages
  public generateSummary(transcription: string): Promise<any> {
    const connection = this.connections['summary'];

    return new Promise((resolve, reject) => {
      if (
        !connection.socket ||
        connection.socket.readyState !== WebSocket.OPEN
      ) {
        this.logger.info('Summary WebSocket not connected, initializing');
        this.connectWebSocket('summary');

        // If we're at the max attempts, don't try to send again
        if (
          connection.reconnectAttempts >= BACKEND_CONFIG.maxReconnectAttempts
        ) {
          reject(
            new Error(
              'Cannot generate summary: Unable to connect to the server. Please check your network connection or contact support.'
            )
          );
          return;
        }

        setTimeout(
          () => this.generateSummary(transcription).then(resolve).catch(reject),
          500
        );
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.logger.info('Summary response received');
          this.logger.debug('Summary data:', data);
          resolve(data);
          connection.socket!.removeEventListener('message', messageHandler);
        } catch (error) {
          this.logger.error('Error processing summary:', error);
          const errorMessage = `Error processing summary: ${this.logger.formatError(
            error
          )}`;
          reject(new Error(errorMessage));
          connection.socket!.removeEventListener('message', messageHandler);
        }
      };

      connection.socket.addEventListener('message', messageHandler);

      const errorHandler = (error: Event) => {
        const errorMessage = `Summary request failed: ${this.logger.formatError(
          error
        )}`;
        this.logger.error(errorMessage);
        reject(new Error(errorMessage));
        connection.socket!.removeEventListener('error', errorHandler);
      };

      const closeHandler = (event: CloseEvent) => {
        const closeReason = this.getWebSocketCloseReason(event);
        const errorMessage = `Summary connection closed: ${closeReason}`;
        this.logger.warn(errorMessage);
        reject(new Error(errorMessage));
        connection.socket!.removeEventListener('close', closeHandler);
      };

      connection.socket.addEventListener('error', errorHandler);
      connection.socket.addEventListener('close', closeHandler);

      try {
        // Check if transcription is empty
        if (!transcription || transcription.trim() === '') {
          const errorMessage =
            'Cannot generate summary: Empty transcription provided';
          this.logger.warn(errorMessage);
          reject(new Error(errorMessage));
          return;
        }

        // Format the message according to the backend requirements
        const request: SummaryRequest = { transcription };
        const message = JSON.stringify(request);
        connection.socket.send(message);
        this.logger.info('Sent transcription for summary generation');
        this.logger.debug('Summary request payload:', request);
      } catch (error) {
        const errorMessage = `Error sending transcription: ${this.logger.formatError(
          error
        )}`;
        this.logger.error(errorMessage);
        reject(new Error(errorMessage));
      }
    });
  }

  // AI Interaction with proper error handling and better user messages
  public askAI(transcription: string, query: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate inputs
      if (!query || query.trim() === '') {
        const errorMessage = 'Cannot process AI request: Empty query provided';
        this.logger.warn(errorMessage);
        reject(new Error(errorMessage));
        return;
      }

      if (!transcription || transcription.trim() === '') {
        const errorMessage =
          'Cannot process AI request: Empty transcription provided';
        this.logger.warn(errorMessage);
        reject(new Error(errorMessage));
        return;
      }

      let connectionTimeout: number | undefined;

      try {
        this.logger.info('Creating AI WebSocket connection');
        const socket = new WebSocket(this.endpoints.ai);

        // Set connection timeout
        connectionTimeout = window.setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            this.logger.error(
              `AI WebSocket connection timeout after ${BACKEND_CONFIG.connectionTimeout}ms`
            );
            socket.close();
            reject(
              new Error(
                'AI request failed: Connection timeout. Please try again later.'
              )
            );
          }
        }, BACKEND_CONFIG.connectionTimeout);

        socket.onopen = () => {
          // Clear the timeout on successful connection
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
          }

          this.logger.info('AI WebSocket connected');

          // Format the message according to backend requirements
          const payload: AIRequest = {
            query,
            transcription,
          };

          socket.send(JSON.stringify(payload));
          this.logger.info('Sent AI request');
          this.logger.debug('AI request payload:', payload);
        };

        socket.onmessage = (event) => {
          this.logger.info('AI response received');
          this.logger.debug('AI response:', event.data);
          resolve(event.data); // Backend sends text
          socket.close();
        };

        socket.onerror = (error) => {
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
          }

          const errorMessage = `AI request failed: ${this.logger.formatError(
            error
          )}`;
          this.logger.error(errorMessage, error);
          reject(new Error(errorMessage));
        };

        socket.onclose = (event) => {
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
          }

          if (event.code !== 1000) {
            // Normal closure
            const closeReason = this.getWebSocketCloseReason(event);
            const errorMessage = `AI connection closed: ${closeReason}`;
            this.logger.warn(errorMessage);
            reject(new Error(errorMessage));
          }
        };
      } catch (error) {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }

        const errorMessage = `Error setting up AI connection: ${this.logger.formatError(
          error
        )}`;
        this.logger.error(errorMessage, error);
        reject(new Error(errorMessage));
      }
    });
  }

  // Clean up all connections
  public close(): void {
    this.logger.info('Closing all WebSocket connections');

    Object.entries(this.connections).forEach(([type, connection]) => {
      if (connection.socket?.readyState === WebSocket.OPEN) {
        this.logger.debug(`Closing ${type} WebSocket connection`);
        connection.socket.close();
        connection.socket = null;
      }
    });
  }

  // Get HTTP base URL for other services
  public getHttpBaseUrl(): string {
    return BACKEND_HTTP_BASE;
  }
}
