import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  NgZone,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { WebSocketService } from './services/web-socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatToolbarModule, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'medical-transcription-app';
  receivedMessages: string[] = [];
  transcription: string = '';
  summary: string = '';
  medicalHistory: any = null;
  context: string = '';
  query: string = '';
  llamaResponse: string = '';
  modelResponse: string = '';
  selectedFile: File | null = null;
  selectedFileName: string = '';
  uploadedTranscription: string = '';

  // Sidebar properties
  isMobile: boolean = false;
  activeSection: string = 'live'; // Default active section

  // Sample transcriptions
  sampleTranscriptions: any[] = [
    {
      title: 'Sample 1',
      preview: 'Patient presents with symptoms of...',
      content:
        'Patient presents with symptoms of acute respiratory distress. History of asthma and seasonal allergies. Currently using albuterol inhaler as needed.',
    },
    {
      title: 'Sample 2',
      preview: 'Follow-up appointment for diabetes management...',
      content:
        'Follow-up appointment for diabetes management. Blood glucose levels have been stable. Patient reports compliance with medication regimen and dietary recommendations.',
    },
    {
      title: 'Sample 3',
      preview: 'Post-operative evaluation following...',
      content:
        'Post-operative evaluation following total knee replacement. Incision healing well with no signs of infection. Patient reports moderate pain controlled with prescribed medication.',
    },
  ];
  selectedSample: number | null = null;

  // Live recording properties
  isRecording: boolean = false;
  private audioContext: AudioContext | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  transcriptionStream: any;
  liveTranscriptionEnabled: boolean = true;
  processingTranscription: boolean = false;

  constructor(
    private wsService: WebSocketService,
    private http: HttpClient,
    private zone: NgZone
  ) {
    // Check screen size only in browser environment
    if (typeof window !== 'undefined') {
      this.checkScreenSize();
    }
  }

  @HostListener('window:resize')
  checkScreenSize() {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth < 768;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Initialize application
    console.log('App initialized');
  }

  ngOnDestroy(): void {
    // Clean up by closing the WebSocket connection
    this.wsService.close();

    // Unsubscribe from transcription stream if it exists
    if (this.transcriptionStream) {
      this.transcriptionStream.unsubscribe();
    }

    // Stop recording if active
    this.stopRecording();
  }

  navigateTo(section: string): void {
    this.activeSection = section;
  }

  // Sample methods
  loadSample(index: number): void {
    this.selectedSample = index;
    this.transcription = this.sampleTranscriptions[index].content;
  }

  // Method to manually send a test message
  sendTestMessage(): void {
    console.log('Test message button clicked');
    // No longer using general sendMessage method - using specific WebSocket connections instead
  }

  // Updated method to generate full summary via WebSocket API
  generateSummaryWS(): void {
    if (typeof window === 'undefined') {
      console.error('WebSocket not available in SSR mode.');
      return;
    }

    // Show loading state
    this.summary = 'Generating summary...';

    this.wsService
      .generateSummary(this.transcription)
      .then((data) => {
        console.log('Summary data received:', data);

        try {
          // Try to parse the response as structured medical data
          if (typeof data === 'object') {
            // Store the structured data for display
            this.medicalHistory = data;

            // Create a readable summary from the structured data
            this.summary =
              'Summary generated successfully. See structured data below.';
          } else if (typeof data === 'string') {
            // If it's a string, use it directly
            this.summary = data;

            // Try to parse it as JSON in case it's a stringified JSON object
            try {
              const jsonData = JSON.parse(data);
              this.medicalHistory = jsonData;
            } catch (e) {
              // Not JSON, just use as text
              console.log('Response is not JSON, using as plain text');
            }
          } else {
            this.summary = 'Received response in unknown format';
          }
        } catch (error) {
          console.error('Error processing summary:', error);
          this.summary = 'Error processing summary response';
        }

        this.modelResponse = 'Model response received';
      })
      .catch((err) => {
        console.error('WebSocket error:', err);
        this.summary = 'Error: Could not generate summary. Please try again.';
      });
  }

  // Method to handle the Get Started button click
  onGetStarted(): void {
    // Scroll to the transcription section smoothly
    document
      .getElementById('transcription-section')
      ?.scrollIntoView({ behavior: 'smooth' });
    console.log(
      'Get Started button clicked and scrolled to transcription section'
    );
  }

  // Updated method to ask Llama API using WebSocketService
  askLlama(): void {
    if (typeof window === 'undefined') {
      console.error('WebSocket not available in SSR mode.');
      return;
    }

    // Show loading state
    this.llamaResponse = 'Processing request...';

    this.wsService
      .askAI(this.context, this.query)
      .then((response) => {
        console.log('Llama response received:', response);

        // Handle different response formats
        if (response.startsWith('Error:')) {
          // If it's an error message
          this.llamaResponse = response;
        } else {
          try {
            // Try to parse as JSON if it looks like JSON
            if (
              response.trim().startsWith('{') ||
              response.trim().startsWith('[')
            ) {
              try {
                const jsonData = JSON.parse(response);
                this.llamaResponse = JSON.stringify(jsonData, null, 2);
              } catch (e) {
                // Not valid JSON, use as is
                this.llamaResponse = response;
              }
            } else {
              // Plain text response
              this.llamaResponse = response;
            }
          } catch (error) {
            console.error('Error processing Llama response:', error);
            this.llamaResponse = response || 'Error processing response';
          }
        }
      })
      .catch((err) => {
        console.error('WebSocket error:', err);
        this.llamaResponse = `Error: ${
          err.message || 'Error communicating with AI service'
        }`;
      });
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length) {
      this.selectedFile = event.target.files[0];
      this.selectedFileName = this.selectedFile ? this.selectedFile.name : '';
      console.log('File selected:', this.selectedFileName);
    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
    }
  }

  uploadAudio(): void {
    if (!this.selectedFile) {
      console.error('No file selected');
      this.uploadedTranscription = 'Error: No file selected';
      return;
    }

    // Show loading state
    this.uploadedTranscription = 'Uploading and transcribing...';

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const uploadUrl = `${this.wsService.getHttpBaseUrl()}/upload/`;
    this.http.post<any>(uploadUrl, formData).subscribe({
      next: (response) => {
        if (response && response.transcription) {
          this.uploadedTranscription = response.transcription;

          // If the transcription is empty, provide feedback
          if (this.uploadedTranscription.trim() === '') {
            this.uploadedTranscription =
              'No speech detected in the audio file.';
          }

          // Optionally copy to main transcription area for further processing
          if (
            this.uploadedTranscription &&
            this.uploadedTranscription !==
              'No speech detected in the audio file.'
          ) {
            this.transcription = this.uploadedTranscription;
          }

          console.log('Upload response:', response);
        } else {
          this.uploadedTranscription = 'Error: Invalid response from server';
          console.error('Invalid upload response:', response);
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.uploadedTranscription = `Error: ${
          error.status === 0
            ? 'Could not connect to server'
            : error.message || 'Failed to upload audio file'
        }`;
      },
    });
  }

  // Method for live audio recording with real-time transcription
  async toggleRecording(): Promise<void> {
    if (typeof window === 'undefined') {
      console.error('MediaDevices not available in SSR mode.');
      return;
    }

    if (!this.isRecording) {
      // Starting recording
      this.transcription = 'Preparing to record...';

      try {
        // Set up direct WebSocket connection for real-time transcription
        if (this.liveTranscriptionEnabled) {
          // Subscribe to the direct WebSocket transcription stream
          this.transcriptionStream = this.wsService
            .getTranscriptionStream()
            .subscribe({
              next: (message: string) =>
                this.zone.run(() => {
                  console.log('Live transcription update received:', message);

                  // Append or update the transcription text
                  if (
                    !this.transcription ||
                    this.transcription === 'Recording... Speak now' ||
                    this.transcription === 'Preparing to record...'
                  ) {
                    this.transcription = message;
                  } else {
                    // Append the new text, avoiding duplication
                    this.transcription =
                      this.transcription.trim() + ' ' + message;
                  }
                }),
              error: (err: Error) =>
                this.zone.run(() => {
                  console.error(
                    'WebSocket error during live transcription:',
                    err
                  );
                  if (this.isRecording) {
                    this.transcription +=
                      '\n[Transcription error: Connection to server was lost. Still recording...]';
                  }
                }),
              complete: () =>
                this.zone.run(() => {
                  console.warn('Transcription WebSocket connection closed');
                }),
            });
        }

        // Set up audio context and script processor for capturing and processing audio
        this.audioContext = new AudioContext({ sampleRate: 16000 });
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.source = this.audioContext.createMediaStreamSource(stream);
        this.scriptNode = this.audioContext.createScriptProcessor(1024, 1, 1);

        // Process audio data when available
        this.scriptNode.onaudioprocess = (event) => {
          const inputBuffer = event.inputBuffer;
          const channelData = inputBuffer.getChannelData(0); // Mono channel
          const pcmData = this.floatTo16BitPCM(channelData);
          this.wsService.sendAudioData(pcmData.buffer); // Send as ArrayBuffer
          console.log('Sending audio chunk:', pcmData.length, 'samples');
        };

        // Connect the audio nodes
        this.source.connect(this.scriptNode);
        this.scriptNode.connect(this.audioContext.destination); // Required to trigger onaudioprocess

        this.isRecording = true;
        this.transcription = 'Recording... Speak now';
        console.log('Recording started with real-time transcription');
      } catch (err) {
        console.error('Error accessing microphone', err);
        this.transcription = `Microphone access error: ${
          err instanceof Error ? err.message : 'Could not access microphone'
        }`;
      }
    } else {
      // Stopping recording
      this.stopRecording();
    }
  }

  /** Stops recording and cleans up resources */
  private stopRecording(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isRecording = false;
    console.log('Recording stopped');
  }

  /** Converts Float32Array to 16-bit PCM (Int16Array) */
  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }
}
