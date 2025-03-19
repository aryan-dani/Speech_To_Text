import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms'; // added for ngModel
import { CommonModule } from '@angular/common'; // added for *ngIf and *ngFor
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { WebSocketService } from './services/web-socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatToolbarModule, FormsModule, CommonModule, HttpClientModule], // added CommonModule here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'medical-transcription-app';
  receivedMessages: string[] = [];
  transcription: string = ''; // holds transcription input
  summary: string = ''; // holds summary returned from WS
  modelResponse: string = ''; // holds model response
  context: string = ''; // holds context input
  query: string = ''; // holds query input
  llamaResponse: string = ''; // holds Llama response
  selectedFile: File | null = null;
  uploadedTranscription: string = '';

  // New properties for live recording
  isRecording: boolean = false;
  mediaRecorder: any;
  recordedChunks: any[] = [];
  liveAudioUrl: string = '';

  constructor(private wsService: WebSocketService, private http: HttpClient) {}

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

  // New method to generate full summary via WebSocket API
  generateSummaryWS(): void {
    const ws = new WebSocket('ws://localhost:8000/generate_summary/');
    ws.onopen = () => {
      console.log('Connected to summary endpoint');
      // Send the transcription text as a request
      ws.send(this.transcription);
    };
    ws.onmessage = (event) => {
      // If event.data is empty or only whitespace, set a default placeholder
      const data =
        event.data && event.data.trim() ? event.data : 'No summary available';
      this.summary = data;
      console.log('Summary received:', this.summary);
      ws.close();
      // After generating the summary, set the modelResponse
      this.modelResponse = 'Model response goes here';
    };
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
      // Set summary to placeholder on error
      this.summary = 'No summary available';
    };
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

  // Method to ask Llama API
  askLlama(): void {
    const ws = new WebSocket('ws://localhost:8000/talk_with_ai/');
    ws.onopen = () => {
      console.log('Connected to Llama endpoint');
      // Send the context and query as a request
      ws.send(
        JSON.stringify({ transcription: this.context, query: this.query })
      );
    };
    ws.onmessage = (event) => {
      this.llamaResponse = event.data;
      console.log('Llama response received:', this.llamaResponse);
      ws.close();
    };
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length) {
      this.selectedFile = event.target.files[0];
      console.log('File selected:');
    }
  }

  uploadAudio(): void {
    if (!this.selectedFile) {
      console.error('No file selected');
      return;
    }
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    this.http.post<any>('http://localhost:8000/upload/', formData).subscribe({
      next: (response) => {
        this.uploadedTranscription = response.transcription;
        console.log('Upload response:', response);
      },
      error: (error) => {
        console.error('Upload error:', error);
      },
    });
  }

  // New method for live audio recording toggle
  async toggleRecording(): Promise<void> {
    if (!this.isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.mediaRecorder = new MediaRecorder(stream);
        this.recordedChunks = [];
        this.mediaRecorder.ondataavailable = (event: any) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          this.liveAudioUrl = URL.createObjectURL(blob);
          console.log('Recording stopped', this.liveAudioUrl);
        };
        this.mediaRecorder.start();
        this.isRecording = true;
        console.log('Recording started');
      } catch (err) {
        console.error('Error accessing microphone', err);
      }
    } else {
      this.mediaRecorder.stop();
      this.isRecording = false;
      console.log('Recording stopped');
    }
  }
}
