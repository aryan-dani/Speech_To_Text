import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  NgZone,
  AfterViewInit,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WebSocketService } from './services/web-socket.service';
import { LoadingService } from './services/loading.service';
import { HelpService } from './services/help.service';
import { Subject, from } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatToolbarModule, FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  // Cleanup subject for better subscription management
  private destroy$ = new Subject<void>();

  private boundCheckScreenSize: any;
  clearSections: boolean = false;
  sidebarCollapsed: boolean = true; // Set to true to make sidebar collapsed by default

  // Add missing properties
  isSidebarOpen: boolean = false;
  isAskAIEnabled: boolean = true;

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
  liveAudioUrl: string = ''; // Added for audio URL
  showAskAIForm: boolean = false; // Control visibility of Ask AI form

  // Audio playback properties
  private audioElement: HTMLAudioElement | null = null;
  private recordedChunks: Int16Array[] = [];
  isPlaying: boolean = false;
  uploadedFileUrl: string = ''; // URL for uploaded audio/video files

  // Sidebar properties
  isMobile: boolean = false;
  activeSection: string = 'live'; // Default active section
  sidebarActive: boolean = false; // For mobile sidebar toggle

  // Interactive UI properties
  isDragging: boolean = false; // For drag and drop
  isUploading: boolean = false; // For upload progress
  uploadProgress: number = 0; // For upload progress bar

  // Collapsible sections state
  hospitalActive: boolean = false;
  gynActive: boolean = false;
  lifestyleActive: boolean = false;
  familyActive: boolean = false;
  allergyActive: boolean = false;

  // Toast notification properties
  toasts: any[] = [];
  // Sample transcriptions with original text content but updated file info
  sampleTranscriptions: any[] = [
    {
      title: 'Sample 1',
      preview: 'Patient presents with symptoms of...',
      content:
        'Patient presents with symptoms of acute respiratory distress. History of asthma and seasonal allergies. Currently using albuterol inhaler as needed.',
      duration: 'Loading...',
      type: 'Consultation',
      fileName: '1.ogg',
      filePath: 'assets/Doctor_patient_communication/1.ogg',
    },
    {
      title: 'Sample 2',
      preview: 'Follow-up appointment for diabetes management...',
      content:
        'Follow-up appointment for diabetes management. Blood glucose levels have been stable. Patient reports compliance with medication regimen and dietary recommendations.',
      duration: 'Loading...',
      type: 'Follow-up',
      fileName: '2.mp4',
      filePath: 'assets/Doctor_patient_communication/2.mp4',
    },
    {
      title: 'Sample 3',
      preview: 'Post-operative evaluation following...',
      content:
        'Post-operative evaluation following total knee replacement. Incision healing well with no signs of infection. Patient reports moderate pain controlled with prescribed medication.',
      duration: 'Loading...',
      type: 'Post-op',
      fileName: '3.aac',
      filePath: 'assets/Doctor_patient_communication/3.aac',
    },
    {
      title: 'Sample 4',
      preview: 'Discussion of recent lab results...',
      content:
        'Discussion of recent lab results for cholesterol panel. LDL elevated, recommending lifestyle modifications and follow-up testing in three months.',
      duration: 'Loading...',
      type: 'Lab Review',
      fileName: '4.aac',
      filePath: 'assets/Doctor_patient_communication/4.aac',
    },
    {
      title: 'Sample 5',
      preview: 'Initial consultation for chronic pain...',
      content:
        'Initial consultation for chronic lower back pain. Patient reports pain radiating to left leg. Discussing conservative management options and imaging recommendations.',
      duration: 'Loading...',
      type: 'Initial Consult',
      fileName: '5.mp4',
      filePath: 'assets/Doctor_patient_communication/5.mp4',
    },
    {
      title: 'Sample 6',
      preview: 'Audio consultation sample...',
      content: 'Medical consultation audio.',
      duration: 'Loading...',
      type: 'Audio Sample',
      fileName: '6.aac',
      filePath: 'assets/Doctor_patient_communication/6.aac',
    },
    {
      title: 'Sample 7',
      preview: 'Medical recording example...',
      content: 'Medical recording example.',
      duration: 'Loading...',
      type: 'Recording',
      fileName: '7.mp4',
      filePath: 'assets/Doctor_patient_communication/7.mp4',
    },
    {
      title: 'Sample 8',
      preview: 'Patient-doctor conversation...',
      content: 'Patient-doctor conversation.',
      duration: 'Loading...',
      type: 'Conversation',
      fileName: '8.mp4',
      filePath: 'assets/Doctor_patient_communication/8.mp4',
    },
    {
      title: 'Sample 9',
      preview: 'Medical consultation recording...',
      content: 'Medical consultation recording.',
      duration: 'Loading...',
      type: 'Consultation',
      fileName: '9.mp4',
      filePath: 'assets/Doctor_patient_communication/9.mp4',
    },
    {
      title: 'Sample 10',
      preview: 'Audio sample example...',
      content: 'Audio sample example.',
      duration: 'Loading...',
      type: 'Audio Sample',
      fileName: '10.ogg',
      filePath: 'assets/Doctor_patient_communication/10.ogg',
    },
    {
      title: 'Sample 11',
      preview: 'Medical video recording...',
      content: 'Medical video recording.',
      duration: 'Loading...',
      type: 'Video',
      fileName: '11.mp4',
      filePath: 'assets/Doctor_patient_communication/11.mp4',
    },
    {
      title: 'Sample 12',
      preview: 'Patient interview example...',
      content: 'Patient interview example.',
      duration: 'Loading...',
      type: 'Interview',
      fileName: '12.mp4',
      filePath: 'assets/Doctor_patient_communication/12.mp4',
    },
    {
      title: 'Sample 13',
      preview: 'Doctor-patient interaction...',
      content: 'Doctor-patient interaction.',
      duration: 'Loading...',
      type: 'Interaction',
      fileName: '13.mp4',
      filePath: 'assets/Doctor_patient_communication/13.mp4',
    },
    {
      title: 'Sample 14',
      preview: 'Medical consultation video...',
      content: 'Medical consultation video.',
      duration: 'Loading...',
      type: 'Consultation',
      fileName: '14.mp4',
      filePath: 'assets/Doctor_patient_communication/14.mp4',
    },
    {
      title: 'Sample 15',
      preview: 'Clinical conversation example...',
      content: 'Clinical conversation example.',
      duration: 'Loading...',
      type: 'Conversation',
      fileName: '15.mp4',
      filePath: 'assets/Doctor_patient_communication/15.mp4',
    },
    {
      title: 'Sample 16',
      preview: 'Medical assessment recording...',
      content: 'Medical assessment recording.',
      duration: 'Loading...',
      type: 'Assessment',
      fileName: '16.mp4',
      filePath: 'assets/Doctor_patient_communication/16.mp4',
    },
    {
      title: 'Sample 17',
      preview: 'Patient evaluation audio...',
      content: 'Patient evaluation audio.',
      duration: 'Loading...',
      type: 'Evaluation',
      fileName: '17.wav',
      filePath: 'assets/Doctor_patient_communication/17.wav',
    },
    {
      title: 'Sample 18',
      preview: 'Medical discussion sample...',
      content: 'Medical discussion sample.',
      duration: 'Loading...',
      type: 'Discussion',
      fileName: '18.ogg',
      filePath: 'assets/Doctor_patient_communication/18.ogg',
    },
    {
      title: 'Sample 19',
      preview: 'Clinical interview recording...',
      content: 'Clinical interview recording.',
      duration: 'Loading...',
      type: 'Interview',
      fileName: '19.mp4',
      filePath: 'assets/Doctor_patient_communication/19.mp4',
    },
    {
      title: 'Sample 20',
      preview: 'Medical consultation example...',
      content: 'Medical consultation example.',
      duration: 'Loading...',
      type: 'Consultation',
      fileName: '20.mp4',
      filePath: 'assets/Doctor_patient_communication/20.mp4',
    },
    {
      title: 'Sample 21',
      preview: 'Patient history audio...',
      content: 'Patient history audio.',
      duration: 'Loading...',
      type: 'History',
      fileName: '21.aac',
      filePath: 'assets/Doctor_patient_communication/21.aac',
    },
    {
      title: 'Sample 22',
      preview: 'Clinical examination video...',
      content: 'Clinical examination video.',
      duration: 'Loading...',
      type: 'Examination',
      fileName: '22.mp4',
      filePath: 'assets/Doctor_patient_communication/22.mp4',
    },
    {
      title: 'Sample 23',
      preview: 'Medical recording sample...',
      content: 'Medical recording sample.',
      duration: 'Loading...',
      type: 'Recording',
      fileName: '23.mpeg',
      filePath: 'assets/Doctor_patient_communication/23.mpeg',
    },
  ];
  selectedSample: number | null = null;

  // Live recording properties
  isRecording: boolean = false;
  private audioContext: AudioContext | null = null;
  private scriptNode: any = null; // Changed from ScriptProcessorNode (deprecated)
  private source: MediaStreamAudioSourceNode | null = null;
  transcriptionStream: any;
  liveTranscriptionEnabled: boolean = true;
  processingTranscription: boolean = false;

  // Audio analyzer for real-time visualization
  private audioAnalyser: AnalyserNode | null = null;
  private visualizationDataArray: Uint8Array | null = null;
  private visualizationAnimationFrame: number | null = null;
  private readonly BAR_COUNT = 15; // Number of visualization bars

  // New UX-related properties
  private readonly RETRY_ATTEMPTS = 3;
  private retryCount = 0;
  isFirstVisit = true;
  lastAction: string = '';
  helpSteps: any[] = [];
  visualFeedback = {
    recordingPulse: false,
    uploadSuccess: false,
    aiThinking: false,
  };

  constructor(
    private wsService: WebSocketService,
    private zone: NgZone,
    private loadingService: LoadingService,
    private helpService: HelpService
  ) {
    if (typeof document !== 'undefined') {
      this.checkScreenSize();
    }
  }

  checkScreenSize() {
    if (typeof document !== 'undefined') {
      this.isMobile = document.documentElement.clientWidth < 768;
      this.sidebarActive = !this.isMobile && !this.sidebarCollapsed; // Only active if not mobile and not collapsed
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (typeof document !== 'undefined') {
      this.checkScreenSize();
    }
  }
  ngOnInit(): void {
    // Initialize application
    console.log('App initialized');
    if (typeof document !== 'undefined') {
      this.checkScreenSize();
      this.boundCheckScreenSize = this.checkScreenSize.bind(this);
      window.addEventListener('resize', this.boundCheckScreenSize);
    }

    // Initialize keyboard navigation
    this.initKeyboardNavigation();

    // Enable keyboard navigation hints for first-time users
    setTimeout(() => {
      const askAIButton = document.querySelector('.ask-ai-button');
      if (askAIButton) {
        askAIButton.setAttribute('title', 'Press Alt + A to toggle Ask AI');
      }
    }, 1000);

    // Show initial tutorial for first-time users
    this.helpSteps = this.helpService.showInitialTutorial() || [];
    if (this.helpSteps.length > 0) {
      this.showTutorial();
    }

    // Initialize audio sample durations
    this.initializeAudioSamples();

    // Enable smooth transitions for UI changes
    document.body.classList.add('transitions-enabled');
  }

  ngAfterViewInit(): void {
    // Initialization that requires DOM to be ready
    if (typeof document !== 'undefined') {
      this.ensureCardKeyboardAccessibility();
    }
  }

  ngOnDestroy(): void {
    // Signal all subscriptions to complete
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up by closing the WebSocket connection
    this.wsService.close();

    // Unsubscribe from transcription stream if it exists
    if (this.transcriptionStream) {
      this.transcriptionStream.unsubscribe();
    }

    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }

    // Clean up any audio URLs to prevent memory leaks
    if (this.liveAudioUrl && typeof URL !== 'undefined') {
      URL.revokeObjectURL(this.liveAudioUrl);
    }

    // Clean up audio element
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }

    // Remove window event listener using the stored reference
    if (typeof window !== 'undefined' && this.boundCheckScreenSize) {
      window.removeEventListener('resize', this.boundCheckScreenSize);
    }
  }

  // Sidebar toggle methods for mobile
  toggleSidebar(): void {
    this.sidebarActive = !this.sidebarActive;
    this.sidebarCollapsed = !this.sidebarActive;
    console.log('Sidebar toggled:', this.sidebarActive ? 'open' : 'collapsed');
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.sidebarActive = false;
      this.sidebarCollapsed = true;
    }
  }

  // Updated navigation method to properly collapse sidebar when changing tabs
  navigateTo(section: string): void {
    if (this.activeSection !== section) {
      document.body.classList.add('section-transition');

      // Reset all content with fade effect
      this.clearSections = true;
      this.summary = '';
      this.medicalHistory = null;
      this.showAskAIForm = false;
      this.llamaResponse = '';
      this.transcription = '';
      this.uploadedTranscription = '';
      this.selectedFile = null;
      this.selectedFileName = '';
      this.isUploading = false;
      this.selectedSample = null;
      this.liveAudioUrl = '';

      // Change section after transition
      setTimeout(() => {
        this.activeSection = section;
        this.clearSections = false;
        document.body.classList.remove('section-transition');

        // Show contextual help for new sections
        this.helpService.showContextualHelp(`section-${section}`);
      }, 300);

      // Always close sidebar when clicking an item
      this.sidebarActive = false;
      this.sidebarCollapsed = true;

      // Add a small delay to ensure the sidebar closing animation is smooth
      setTimeout(() => {
        const overlay = document.querySelector(
          '.sidebar-overlay'
        ) as HTMLElement;
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.visibility = 'hidden';
        }
      }, 50);
    }
  }

  // Toast notification methods with improved functionality
  showToast(
    type: string,
    title: string,
    message: string,
    duration: number = 5000
  ): void {
    const toast = {
      id: new Date().getTime(),
      type,
      title,
      message,
      progress: 100,
      removing: false,
    };

    this.zone.run(() => {
      this.toasts.unshift(toast);

      // Auto-remove toast after duration
      setTimeout(() => {
        this.removeToast(toast.id);
      }, duration);

      // Update progress bar
      const interval = setInterval(() => {
        if (toast.removing) {
          clearInterval(interval);
          return;
        }

        toast.progress -= 100 / (duration / 100);
        if (toast.progress <= 0) {
          clearInterval(interval);
        }
      }, 100);
    });
  }

  removeToast(id: number): void {
    const toastIndex = this.toasts.findIndex((t) => t.id === id);
    if (toastIndex > -1) {
      // Mark as removing to start the animation
      this.toasts[toastIndex].removing = true;

      // Remove after animation completes
      setTimeout(() => {
        this.zone.run(() => {
          this.toasts = this.toasts.filter((toast) => toast.id !== id);
        });
      }, 300); // Match animation duration
    }
  }

  // Visualization for audio recording - replaced with real-time visualization
  getRandomHeight(index: number): number {
    if (!this.isRecording) return 10;

    // Generate more realistic audio visualization
    const baseHeight = 20;
    const maxVar = 60;
    const time = Date.now() / 200;
    const sinVal = Math.sin(time + index * 0.4);
    const cosVal = Math.cos(time * 0.7 + index * 0.3);

    return baseHeight + ((sinVal + cosVal) * maxVar) / 2;
  }

  // Get the height for a visualization bar based on actual audio data
  getVisualizationHeight(index: number): number {
    if (!this.isRecording || !this.visualizationDataArray) {
      return 10; // Default minimal height when not recording
    }

    // Map the frequency data to the bar index
    const dataLength = this.visualizationDataArray.length;
    const barIndex = Math.floor((index / this.BAR_COUNT) * dataLength);

    // Get the value from the frequency data array
    const value = this.visualizationDataArray[barIndex] || 0;

    // Scale the value to a percentage (0-100)
    return 10 + (value / 255) * 90; // 10% minimum height, max 100%
  } // Sample methods
  selectSample(index: number): void {
    this.selectedSample = index;
    const sample = this.sampleTranscriptions[index];
    this.showToast('info', 'Sample Selected', `Selected ${sample.title}`, 2000); // Shorter duration

    // Set the transcription content right away
    this.transcription = sample.content;

    // Use NgZone to ensure Angular updates the view before scrolling
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => {
          // Scroll to the transcription area smoothly
          this.scrollToElement('.transcription-area', 'start');

          // Highlight the transcription text area briefly
          const transcriptionDisplay = document.querySelector(
            '.transcription-area textarea'
          ) as HTMLTextAreaElement;
          if (transcriptionDisplay) {
            transcriptionDisplay.classList.add('highlight-new');
            setTimeout(() => {
              transcriptionDisplay.classList.remove('highlight-new');
            }, 1500); // Keep highlight for 1.5 seconds
          }
        });
      }, 100); // Small delay to allow rendering
    });

    // Only load the media if it's an audio/video sample but don't translate
    if (this.isMediaSample(sample)) {
      // Load the media file
      this.loadSampleMedia(index);
    } else {
      // Clear any previous audio/video
      this.selectedFile = null;
      this.uploadedFileUrl = '';
      // Ensure player is hidden if it's a text sample
      const playerElement = document.querySelector('.audio-player');
      if (playerElement) {
        playerElement.classList.remove('visible');
      }
    }
  }

  // Load sample media (audio or video) without automatic translation
  loadSampleMedia(index: number): void {
    const sample = this.sampleTranscriptions[index];

    fetch(sample.filePath)
      .then((response) => response.blob())
      .then((blob) => {
        // Create a File object from the blob
        const file = new File([blob], sample.fileName, { type: blob.type });
        this.selectedFile = file;
        this.selectedFileName = sample.fileName;

        // Create URL for selected file so it can be played
        if (this.uploadedFileUrl) {
          URL.revokeObjectURL(this.uploadedFileUrl);
        }
        this.uploadedFileUrl = URL.createObjectURL(file);
      })
      .catch((error) => {
        console.error('Error loading sample media:', error);
        this.showToast(
          'error',
          'Loading Error',
          'Could not load sample media file.',
          5000
        );

        // Clear file references
        this.selectedFile = null;
        this.uploadedFileUrl = '';
      });
  }

  // Determine if a sample has audio/video media
  isMediaSample(sample: any): boolean {
    const audioExtensions = ['.mp3', '.ogg', '.wav', '.aac', '.m4a', '.flac'];
    const videoExtensions = ['.mp4', '.webm', '.mpeg', '.mov'];
    const fileName = sample.fileName.toLowerCase();

    return (
      audioExtensions.some((ext) => fileName.endsWith(ext)) ||
      videoExtensions.some((ext) => fileName.endsWith(ext))
    );
  }

  // Play a sample directly from the list
  playSample(index: number, event: Event): void {
    event.stopPropagation(); // Prevent the click from selecting the sample

    // First ensure the sample is selected
    if (this.selectedSample !== index) {
      this.selectSample(index);
    }

    // Then load and play the media
    const sample = this.sampleTranscriptions[index];
    if (this.isMediaSample(sample)) {
      this.loadSampleMedia(index);

      // Play the media after a short delay to ensure it's loaded
      setTimeout(() => {
        const audioElement = document.querySelector(
          '.audio-player audio'
        ) as HTMLAudioElement;
        const videoElement = document.querySelector(
          '.audio-player video'
        ) as HTMLVideoElement;

        if (audioElement && !sample.fileName.includes('mp4')) {
          audioElement.play();
        } else if (videoElement && sample.fileName.includes('mp4')) {
          videoElement.play();
        }
      }, 500);
    }
  }

  // Translate the selected sample (separate action from selection)
  translateSelectedSample(): void {
    if (this.selectedSample === null) {
      this.showToast(
        'error',
        'No Sample Selected',
        'Please select a sample first.',
        3000
      );
      return;
    }

    const sample = this.sampleTranscriptions[this.selectedSample];
    this.showToast(
      'info',
      'Processing Sample',
      `Processing ${sample.title}...`,
      3000
    );

    // Show loading indicator for better user experience
    this.processingTranscription = true;

    // If we already loaded the file, use that, otherwise load it now
    if (!this.selectedFile && this.isMediaSample(sample)) {
      fetch(sample.filePath)
        .then((response) => response.blob())
        .then((blob) => {
          const file = new File([blob], sample.fileName, { type: blob.type });
          this.selectedFile = file;
          this.selectedFileName = sample.fileName;

          if (this.uploadedFileUrl) {
            URL.revokeObjectURL(this.uploadedFileUrl);
          }
          this.uploadedFileUrl = URL.createObjectURL(file);

          // Process the file through the existing upload mechanism
          this.uploadAudio();
        })
        .catch((error) => {
          console.error('Error loading sample for translation:', error);
          this.processingTranscription = false;
          this.showToast(
            'error',
            'Loading Error',
            'Could not load sample for translation.',
            5000
          );
        });
    } else if (this.isMediaSample(sample)) {
      // Process the already loaded file
      this.uploadAudio();
    } else {
      // Text-only sample, no need for processing
      this.showToast(
        'info',
        'Text Sample',
        'This is a text-only sample that does not require translation.',
        3000
      );
      this.processingTranscription = false;
    }
  }

  // Original loadSample method (kept for backward compatibility if needed)
  loadSample(index: number): void {
    this.selectSample(index);
    this.translateSelectedSample();
  }

  // Drag and drop file handling
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.type === 'video/mp4') {
        this.selectedFile = file;
        this.selectedFileName = file.name;

        // Create URL for selected file so it can be played
        if (this.uploadedFileUrl) {
          URL.revokeObjectURL(this.uploadedFileUrl);
        }
        if (this.selectedFile) {
          this.uploadedFileUrl = URL.createObjectURL(this.selectedFile);
        }

        this.showToast(
          'success',
          'File Added',
          `${file.name} has been added.`,
          3000
        );
      } else {
        this.showToast(
          'error',
          'Invalid File',
          'Please upload an audio or MP4 video file.',
          5000
        );
      }
    }
  }

  // Audio playback methods
  playAudio(): void {
    if (!this.liveAudioUrl) {
      this.showToast(
        'error',
        'No Audio',
        'No audio file available for playback',
        3000
      );
      return;
    }

    if (!this.audioElement) {
      this.audioElement = new Audio(this.liveAudioUrl);

      // Add event listeners
      this.audioElement.addEventListener('play', () => {
        this.isPlaying = true;
        console.log('Audio playback started');
      });

      this.audioElement.addEventListener('pause', () => {
        this.isPlaying = false;
        console.log('Audio playback paused');
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        console.log('Audio playback ended');
      });
    } else {
      // Update the source in case it has changed
      this.audioElement.src = this.liveAudioUrl;
    }

    this.audioElement.play().catch((error) => {
      console.error('Error playing audio:', error);
      this.showToast(
        'error',
        'Playback Error',
        'Could not play the audio file.',
        5000
      );
    });
  }

  pauseAudio(): void {
    if (this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      console.log('Audio playback paused');
    }
  }

  stopAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
      console.log('Audio playback stopped');
    }
  }

  // Updated method to generate full summary via WebSocket API
  generateSummaryWS(): void {
    if (typeof window === 'undefined') {
      console.error('WebSocket not available in SSR mode.');
      return;
    }

    // Show loading state
    this.summary = 'Generating summary...';
    this.processingTranscription = true;

    // Important: Don't clear the medical history when regenerating summary
    // This ensures hospitalization/surgical history buttons remain visible
    // This ensures hospitalization/surgical history buttons remain visible
    // this.medicalHistory = null; // Removing this line

    // Show a more attractive toast for generating summary
    this.showToast(
      'primary',
      'Generating Summary',
      'Creating medical summary from transcription...',
      5000
    );

    // Get the appropriate transcription based on the active section
    let currentTranscription = this.transcription;
    if (this.activeSection === 'file' && this.uploadedTranscription) {
      currentTranscription = this.uploadedTranscription;
    } else if (
      this.activeSection === 'samples' &&
      this.selectedSample !== null
    ) {
      currentTranscription = this.transcription;
    }

    // Check if we have a valid transcription
    if (!currentTranscription || currentTranscription.trim() === '') {
      this.summary = 'Error: No transcription available to summarize.';
      this.processingTranscription = false;
      this.showToast(
        'error',
        'No Content',
        'No transcription available to summarize.',
        5000
      );
      return;
    }

    // Scroll to summary section once it appears
    setTimeout(() => {
      const summarySection = document.querySelector('.summary-section');
      if (summarySection) {
        summarySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    from(this.wsService.generateSummary(currentTranscription))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log('Summary data received:', data);
          this.processingTranscription = false;

          try {
            // Try to parse the response as structured medical data
            if (typeof data === 'object') {
              // Store the structured data for display
              this.medicalHistory = data;

              // Create a readable summary from the structured data
              this.summary =
                'Summary generated successfully. See structured data below.';
              this.showToast(
                'success',
                'Summary Generated',
                'Your medical report has been created successfully.',
                5000
              );
            } else if (typeof data === 'string') {
              // If it's a string, use it directly
              this.summary = data;

              // Try to parse it as JSON in case it's a stringified JSON object
              try {
                const jsonData = JSON.parse(data);
                this.medicalHistory = jsonData;
                this.showToast(
                  'success',
                  'Summary Generated',
                  'Your medical report has been created successfully.',
                  5000
                );
              } catch (e) {
                // Not JSON, just use as text
                console.log('Response is not JSON, using as plain text');
                this.showToast(
                  'success',
                  'Summary Generated',
                  'Your text summary has been created.',
                  5000
                );
              }
            } else {
              this.summary = 'Received response in unknown format';
              this.showToast(
                'warning',
                'Unusual Response',
                'The server returned data in an unexpected format.',
                5000
              );
            }
          } catch (error) {
            console.error('Error processing summary:', error);
            this.summary = 'Error processing summary response';
            this.showToast(
              'error',
              'Processing Error',
              'Could not process the summary response.',
              5000
            );
          }

          this.modelResponse = 'Model response received';
        },
        error: (err: Error) => {
          console.error('WebSocket error:', err);
          this.summary = 'Error: Could not generate summary. Please try again.';
          this.processingTranscription = false;
          this.showToast(
            'error',
            'Connection Error',
            'Could not generate summary. Please try again.',
            5000
          );
        },
      });
  }

  // Toggle Ask AI form visibility with improved scrolling
  toggleAskAI(): void {
    this.showAskAIForm = !this.showAskAIForm;

    // Reset the query and response when closing
    if (!this.showAskAIForm) {
      this.query = '';
      this.llamaResponse = '';
    } else {
      // When opening, add a slight delay to ensure the element is rendered before scrolling
      setTimeout(() => {
        const aiResponseContainer = document.querySelector(
          '.ai-response-container'
        );
        if (aiResponseContainer) {
          // Add visible class to ensure it's displayed
          aiResponseContainer.classList.add('visible');
          this.scrollToElement('.ai-response-container');
        }
      }, 100);
    }

    // Make sure any AI response container gets the visible class
    setTimeout(() => {
      document
        .querySelectorAll('.ai-response-container')
        .forEach((container) => {
          if (this.showAskAIForm) {
            container.classList.add('visible');
          } else {
            container.classList.remove('visible');
          }
        });
    }, 50);

    console.log(
      'Ask AI form toggled:',
      this.showAskAIForm ? 'visible' : 'hidden'
    );
  }

  // Improved method to scroll to any element
  scrollToElement(
    selector: string,
    blockPosition: ScrollLogicalPosition = 'center'
  ): void {
    try {
      const element = document.querySelector(selector);
      if (element) {
        // Use a more reliable scrolling method
        element.scrollIntoView({
          behavior: 'smooth',
          block: blockPosition, // Use provided block position ('start', 'center', 'end')
        });

        // Optional: Add focus outline temporarily (if applicable)
        // const focusableElement =
        //   element.querySelector('input, textarea, button') || element;
        // if (focusableElement instanceof HTMLElement) {
        //   focusableElement.classList.add('highlight-scroll-target');
        //   setTimeout(() => {
        //     focusableElement.classList.remove('highlight-scroll-target');
        //   }, 1500);
        // }
      } else {
        console.warn(`Scroll target element not found: ${selector}`);
      }
    } catch (error) {
      console.error('Error scrolling to element:', error);
    }
  }

  // Updated method to ask Llama API using WebSocketService
  askLlama(): void {
    if (typeof window === 'undefined') {
      console.error('WebSocket not available in SSR mode.');
      return;
    }

    if (!this.query?.trim()) {
      this.showToast(
        'error',
        'Empty Question',
        'Please enter a question to ask.',
        3000
      );
      return;
    }

    this.loadingService.show();
    this.visualFeedback.aiThinking = true;
    this.llamaResponse = 'AI is thinking...';

    // Store last query for retry purposes
    this.lastAction = this.query;

    // Show loading state
    this.llamaResponse = 'Processing request...';
    this.processingTranscription = true;
    this.showToast('info', 'AI Request', 'Processing your question...', 3000);

    // Get the appropriate transcription based on the active section
    let currentTranscription = this.transcription;
    if (this.activeSection === 'file' && this.uploadedTranscription) {
      currentTranscription = this.uploadedTranscription;
    } else if (
      this.activeSection === 'samples' &&
      this.selectedSample !== null
    ) {
      currentTranscription = this.transcription;
    }

    // If no transcription is available, use a default message
    if (!currentTranscription || currentTranscription.trim() === '') {
      currentTranscription =
        'No transcription available. You can still ask general medical questions.';
    }

    if (!this.query || this.query.trim() === '') {
      this.llamaResponse = 'Error: Please enter a question to ask.';
      this.processingTranscription = false;
      this.showToast(
        'error',
        'Empty Question',
        'Please enter a question to ask.',
        3000
      );
      return;
    }

    // Scroll to AI response container
    setTimeout(() => {
      const responseContainer = document.querySelector(
        '.ai-response-container'
      );
      if (responseContainer) {
        responseContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);

    this.wsService
      .askAI(currentTranscription, this.query)
      .then((response: string) => {
        console.log('Llama response received:', response);
        this.processingTranscription = false;

        // Handle different response formats
        if (response.startsWith('Error:')) {
          // If it's an error message
          this.llamaResponse = response;
          this.showToast(
            'error',
            'AI Error',
            'The AI service returned an error.',
            5000
          );
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
                this.showToast(
                  'success',
                  'Response Received',
                  'The AI has answered your question.',
                  3000
                );
              } catch (e) {
                // Not valid JSON, use as is
                this.llamaResponse = response;
                this.showToast(
                  'success',
                  'Response Received',
                  'The AI has answered your question.',
                  3000
                );
              }
            } else {
              // Plain text response
              this.llamaResponse = response;
              this.showToast(
                'success',
                'Response Received',
                'The AI has answered your question.',
                3000
              );
            }
          } catch (error) {
            console.error('Error processing Llama response:', error);
            this.llamaResponse = response || 'Error processing response';
            this.showToast(
              'warning',
              'Processing Issue',
              'There was an issue processing the AI response.',
              5000
            );
          }
        }
      })
      .catch((err: Error) => {
        console.error('WebSocket error:', err);
        this.llamaResponse = `Error: ${
          err.message || 'Error communicating with AI service'
        }`;
        this.processingTranscription = false;
        this.showToast(
          'error',
          'Connection Error',
          'Could not connect to the AI service.',
          5000
        );
      });
  }

  // Fixed file selection handling
  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length) {
      this.selectedFile = event.target.files[0];
      this.selectedFileName = this.selectedFile ? this.selectedFile.name : '';
      console.log('File selected:', this.selectedFileName);

      // Create URL for selected file so it can be played
      if (this.uploadedFileUrl) {
        URL.revokeObjectURL(this.uploadedFileUrl);
      }
      if (this.selectedFile) {
        this.uploadedFileUrl = URL.createObjectURL(this.selectedFile);
      }

      this.showToast(
        'info',
        'File Selected',
        `${this.selectedFileName} ready for upload.`,
        3000
      );
    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
      this.uploadedFileUrl = '';
    }
  }
  // Enhanced file upload with clear progress feedback and retry
  uploadAudio(): void {
    if (!this.selectedFile) {
      this.showToast(
        'error',
        'Upload Error',
        'No file selected for upload.',
        3000
      );
      return;
    }

    // Clear any previous transcription to avoid confusion
    this.uploadedTranscription = '';
    this.transcription = '';

    // Show loading indicators
    this.loadingService.show();
    this.isUploading = true;
    this.processingTranscription = true;
    this.uploadProgress = 0;

    this.showToast(
      'info',
      'Upload Started',
      'Uploading and transcribing your audio...',
      3000
    );

    // Make transcription area show processing state
    const transcriptionArea = document.querySelector(
      '.transcription-area textarea'
    );
    if (transcriptionArea) {
      transcriptionArea.setAttribute(
        'placeholder',
        'Processing your audio file...'
      );
    }

    const upload = () => {
      const formData = new FormData();
      formData.append('file', this.selectedFile!);

      const uploadUrl = `${this.wsService.getHttpBaseUrl()}/upload/`;

      // Create upload observer with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          this.zone.run(() => {
            this.uploadProgress = Math.round(
              (event.loaded / event.total) * 100
            );

            // Update status message based on progress
            if (this.uploadProgress < 100) {
              if (transcriptionArea) {
                transcriptionArea.setAttribute(
                  'placeholder',
                  `Uploading: ${this.uploadProgress}% complete...`
                );
              }
            } else {
              if (transcriptionArea) {
                transcriptionArea.setAttribute(
                  'placeholder',
                  'Transcribing audio... This may take a moment.'
                );
              }
            }
          });
        }
      };

      xhr.onload = () => {
        this.zone.run(() => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.response);
            this.handleUploadSuccess(response);
          } else {
            this.handleUploadError(xhr.statusText);
          }
        });
      };

      xhr.onerror = () => {
        this.zone.run(() => {
          this.handleUploadError('Network error occurred');
        });
      };

      xhr.open('POST', uploadUrl, true);
      xhr.send(formData);
    };

    upload();
  }
  private handleUploadSuccess(response: any): void {
    this.loadingService.hide();
    this.isUploading = false;
    this.uploadProgress = 100;
    this.processingTranscription = false;
    this.visualFeedback.uploadSuccess = true;

    setTimeout(() => {
      this.visualFeedback.uploadSuccess = false;

      if (response && response.transcription) {
        this.uploadedTranscription = response.transcription;

        // Scroll to the transcription area to make it visible
        setTimeout(() => {
          const transcriptionArea = document.querySelector(
            '.transcription-area'
          );
          if (transcriptionArea) {
            transcriptionArea.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });

            // Add a highlight effect to draw attention to the result
            const textarea = transcriptionArea.querySelector('textarea');
            if (textarea) {
              textarea.classList.add('highlight-new');
              setTimeout(() => {
                textarea.classList.remove('highlight-new');
              }, 1500);
            }
          }
        }, 100);

        if (this.uploadedTranscription.trim() === '') {
          this.uploadedTranscription = 'No speech detected in the audio file.';
          this.showToast(
            'warning',
            'No Speech Detected',
            'No speech could be detected in the audio file.',
            5000
          );
        } else {
          this.showToast(
            'success',
            'Transcription Complete',
            'Your audio has been transcribed successfully.',
            3000
          );
          this.transcription = this.uploadedTranscription;
        }
      }
    }, 500);
  }
  private handleUploadError(error: string): void {
    // Reset placeholder in transcription area
    const transcriptionArea = document.querySelector(
      '.transcription-area textarea'
    );
    if (transcriptionArea) {
      transcriptionArea.setAttribute(
        'placeholder',
        'Error processing file. Please try again.'
      );
      transcriptionArea.classList.add('error');
      setTimeout(() => {
        transcriptionArea.classList.remove('error');
      }, 2000);
    }

    if (this.retryCount < this.RETRY_ATTEMPTS) {
      this.retryCount++;
      this.showToast(
        'warning',
        'Upload Failed',
        `Retrying upload (${this.retryCount}/${this.RETRY_ATTEMPTS})...`,
        3000
      );
      setTimeout(() => this.uploadAudio(), 1000);
      return;
    }

    this.loadingService.hide();
    this.isUploading = false;
    this.processingTranscription = false;
    this.uploadedTranscription = `Error: Upload failed after ${this.RETRY_ATTEMPTS} attempts. Please try again or choose a different file.`;

    this.showToast(
      'error',
      'Upload Failed',
      'Could not upload the audio file after multiple attempts.',
      5000
    );
    // Show error message in transcription area
    if (transcriptionArea instanceof HTMLTextAreaElement) {
      transcriptionArea.value = this.uploadedTranscription;
    }

    this.retryCount = 0;
  }

  // Method for live audio recording with real-time transcription
  async toggleRecording(): Promise<void> {
    if (typeof window === 'undefined') {
      console.error('MediaDevices not available in SSR mode.');
      return;
    }

    if (!this.isRecording) {
      this.loadingService.show();
      this.visualFeedback.recordingPulse = true;

      this.transcription = 'Preparing to record...';
      this.showToast('info', 'Recording Setup', 'Preparing to record...', 3000);

      try {
        // Set up direct WebSocket connection for real-time transcription
        if (this.liveTranscriptionEnabled) {
          // Subscribe to the direct WebSocket transcription stream
          this.transcriptionStream = this.wsService
            .getTranscriptionStream()
            .pipe(takeUntil(this.destroy$))
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
                    this.showToast(
                      'warning',
                      'Connection Issue',
                      'Transcription connection lost, but still recording.',
                      5000
                    );
                  }
                }),
              complete: () =>
                this.zone.run(() => {
                  console.warn('Transcription WebSocket connection closed');
                }),
            });
        }

        // Set up audio context and audio processing
        this.audioContext = new AudioContext({ sampleRate: 16000 });
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.source = this.audioContext.createMediaStreamSource(stream);

        // Create analyzer node for real-time visualization
        this.audioAnalyser = this.audioContext.createAnalyser();
        this.audioAnalyser.fftSize = 256;
        this.audioAnalyser.smoothingTimeConstant = 0.8;
        this.visualizationDataArray = new Uint8Array(
          this.audioAnalyser.frequencyBinCount
        );

        // Connect the source to the analyzer
        this.source.connect(this.audioAnalyser);

        // Start visualization animation
        this.startVisualization();

        // Use AudioWorkletNode instead of deprecated ScriptProcessorNode when supported
        if (this.audioContext.audioWorklet) {
          // Modern approach (replace with AudioWorkletNode implementation)
          // For now, fallback to ScriptProcessorNode
          // First, dynamically load the audio worklet processor
          await this.audioContext.audioWorklet.addModule(
            'assets/recorderWorkletProcessor.js'
          );

          // Create the AudioWorkletNode instance
          this.scriptNode = new AudioWorkletNode(
            this.audioContext,
            'recorder-processor'
          );

          // Clear any previously recorded chunks when starting a new recording
          this.recordedChunks = [];

          // Set up message handler to receive processed audio data from the worklet
          this.scriptNode.port.onmessage = (
            event: MessageEvent<{ eventType: string; audioBuffer: ArrayBuffer }>
          ) => {
            if (event.data.eventType === 'audio') {
              const pcmData = new Int16Array(event.data.audioBuffer);

              // Store a copy of the recorded chunk for local playback
              this.recordedChunks.push(new Int16Array(pcmData));

              // Send to WebSocket for transcription
              this.wsService.sendAudioData(pcmData.buffer);
            }
          };

          // Connect the audio nodes
          this.source!.connect(this.scriptNode);
          // Connect to destination to keep the audio processing active
          this.scriptNode.connect(this.audioContext!.destination);
        } else {
          // Fallback for browsers that don't support AudioWorkletNode
          this.useScriptProcessorNode();
        }

        this.isRecording = true;
        this.transcription = 'Recording... Speak now';
        this.showToast(
          'success',
          'Recording Started',
          'Speak clearly into your microphone.',
          3000
        );
        console.log(
          'Recording started with real-time transcription and visualization'
        );

        // Show contextual help for first recording
        this.helpService.showContextualHelp('first-recording');
      } catch (err) {
        console.error('Error accessing microphone', err);

        if (this.retryCount < this.RETRY_ATTEMPTS) {
          this.retryCount++;
          this.showToast(
            'warning',
            'Retrying',
            `Attempting to access microphone (${this.retryCount}/${this.RETRY_ATTEMPTS})...`,
            3000
          );
          setTimeout(() => this.toggleRecording(), 1000);
          return;
        }

        this.transcription = `Microphone access error: ${
          err instanceof Error ? err.message : 'Could not access microphone'
        }`;
        this.showToast(
          'error',
          'Microphone Error',
          'Could not access your microphone. Please check your permissions.',
          5000
        );
      } finally {
        this.loadingService.hide();
      }
    } else {
      // Stopping recording
      this.visualFeedback.recordingPulse = false;
      this.stopRecording();
      this.showToast(
        'info',
        'Recording Stopped',
        'Processing your audio...',
        3000
      );
    }
  }

  // Use deprecated ScriptProcessorNode (will be replaced with AudioWorkletNode in future)
  private useScriptProcessorNode(): void {
    // Create an AudioWorkletNode when available (modern approach), otherwise fallback to ScriptProcessorNode
    if (this.audioContext && 'audioWorklet' in this.audioContext) {
      // Modern approach is implemented in toggleRecording method
      console.log(
        'AudioWorklet is supported, should be using that instead of ScriptProcessorNode'
      );
      return;
    }

    // DEPRECATION WARNING: ScriptProcessorNode is deprecated.
    // This is a fallback for browsers that don't support AudioWorkletNode
    console.warn('WARNING: Using deprecated ScriptProcessorNode as a fallback');

    // Using a larger buffer size to reduce performance impact
    const bufferSize = 2048; // Increased from 1024 for better performance
    this.scriptNode = this.audioContext!.createScriptProcessor(
      bufferSize,
      1,
      1
    );

    // Clear any previously recorded chunks when starting a new recording
    this.recordedChunks = [];

    // Process audio data when available
    this.scriptNode.onaudioprocess = (event: AudioProcessingEvent) => {
      const inputBuffer = event.inputBuffer;
      const channelData = inputBuffer.getChannelData(0); // Mono channel
      const pcmData = this.floatTo16BitPCM(channelData);

      // Store a copy of the recorded chunk for local playback
      this.recordedChunks.push(new Int16Array(pcmData));

      // Send to WebSocket for transcription
      this.wsService.sendAudioData(pcmData.buffer); // Send as ArrayBuffer
    };

    // Connect the audio nodes
    this.source!.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext!.destination); // Required to trigger onaudioprocess
  }

  /** Stops recording and cleans up resources */
  private stopRecording(): void {
    // Stop the visualization animation
    this.stopVisualization();

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
    if (this.audioAnalyser) {
      this.audioAnalyser = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // If we have recorded audio data, create a blob and URL for playback
    if (this.recordedChunks.length > 0) {
      this.processingTranscription = true;
      this.createAudioFromChunks();
      this.processingTranscription = false;
      this.showToast(
        'success',
        'Recording Processed',
        'Your audio has been processed successfully.',
        3000
      );
    }

    this.isRecording = false;
    console.log('Recording stopped');
  }

  /** Start real-time audio visualization */
  private startVisualization(): void {
    if (!this.visualizationAnimationFrame) {
      this.updateVisualization();
    }
  }

  /** Stop real-time audio visualization */
  private stopVisualization(): void {
    if (this.visualizationAnimationFrame) {
      cancelAnimationFrame(this.visualizationAnimationFrame);
      this.visualizationAnimationFrame = null;
    }
  }

  /** Update the audio visualization based on real-time audio data */
  private updateVisualization(): void {
    if (!this.audioAnalyser || !this.visualizationDataArray) {
      this.visualizationAnimationFrame = null;
      return;
    }

    // Get frequency data from the analyzer
    this.audioAnalyser.getByteFrequencyData(this.visualizationDataArray);

    // Request the next animation frame
    this.visualizationAnimationFrame = requestAnimationFrame(() =>
      this.updateVisualization()
    );
  }

  /** Creates an audio blob from recorded chunks and sets the audio URL */
  private createAudioFromChunks(): void {
    try {
      // Concatenate all Int16Array chunks into a single array
      const totalLength = this.recordedChunks.reduce(
        (acc, chunk) => acc + chunk.length,
        0
      );
      const audioData = new Int16Array(totalLength);

      let offset = 0;
      for (const chunk of this.recordedChunks) {
        audioData.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert Int16Array to Float32Array for Web Audio API
      const floatArray = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        floatArray[i] = audioData[i] / 32768.0; // Convert from int16 to float32 (-1.0 to 1.0)
      }

      // Create WAV file with 16kHz sample rate
      const wavBuffer = this.createWaveFileBuffer(floatArray, 16000);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });

      // Create URL for the audio blob
      if (this.liveAudioUrl) {
        URL.revokeObjectURL(this.liveAudioUrl); // Clean up previous URL
      }
      this.liveAudioUrl = URL.createObjectURL(blob);
      console.log('Audio URL created:', this.liveAudioUrl);
    } catch (error) {
      console.error('Error creating audio from chunks:', error);
      this.showToast(
        'error',
        'Audio Processing Error',
        'Could not process the recorded audio.',
        5000
      );
    }
  }

  /** Creates a WAV file buffer from audio data */
  private createWaveFileBuffer(
    audioData: Float32Array,
    sampleRate: number
  ): ArrayBuffer {
    // Convert Float32Array to Int16Array for WAV format
    const numSamples = audioData.length;
    const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
    const buffer = new ArrayBuffer(44 + dataSize); // 44 bytes is the size of the WAV header
    const view = new DataView(buffer);

    // Write WAV header
    // "RIFF" chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // 36 + dataSize
    this.writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size: 16
    view.setUint16(20, 1, true); // audio format: PCM = 1
    view.setUint16(22, 1, true); // number of channels: 1 (mono)
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * 2, true); // byte rate = sampleRate * blockAlign
    view.setUint16(32, 2, true); // block align = channels * bitsPerSample/8
    view.setUint16(34, 16, true); // bits per sample

    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true); // data chunk size

    // Write audio data
    const dataView = new Int16Array(buffer, 44, numSamples);
    for (let i = 0; i < numSamples; i++) {
      // Convert float to int16
      const s = Math.max(-1, Math.min(1, audioData[i]));
      dataView[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return buffer;
  }

  /** Helper function to write a string to a DataView */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
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

  // Handle keyboard navigation for sidebar
  initKeyboardNavigation() {
    console.log('Initializing enhanced keyboard navigation...');

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'keydown',
        (event: KeyboardEvent) => {
          console.log('Key pressed:', event.key);

          // ESC key to toggle sidebar
          if (event.key === 'Escape') {
            this.toggleSidebar();
            console.log('Escape pressed, toggling sidebar');
            event.preventDefault();
            event.stopPropagation();
          }

          // Add keyboard shortcut for Ask AI (Alt+A)
          if (event.key === 'a' && event.altKey) {
            console.log('Alt+A pressed, toggling Ask AI');
            this.toggleAskAI();
            event.preventDefault();
          }

          // Add keyboard shortcut for toggling recording (Alt+R)
          if (event.key === 'r' && event.altKey) {
            console.log('Alt+R pressed, toggling recording');
            this.toggleRecording();
            event.preventDefault();
          }

          // Navigation between menu items with Shift+Arrow
          if (event.shiftKey) {
            const sections = ['live', 'file', 'samples'];
            const currentIndex = sections.indexOf(this.activeSection);

            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
              // Navigate to next section
              if (currentIndex < sections.length - 1) {
                const nextSection = sections[currentIndex + 1];
                this.navigateTo(nextSection);
                console.log(
                  `Shift+${event.key} pressed, navigating to: ${nextSection}`
                );
                event.preventDefault();
              }
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
              // Navigate to previous section
              if (currentIndex > 0) {
                const prevSection = sections[currentIndex - 1];
                this.navigateTo(prevSection);
                console.log(
                  `Shift+${event.key} pressed, navigating to: ${prevSection}`
                );
                event.preventDefault();
              }
            }
          }
        },
        true
      ); // Added true for capture phase to ensure our handler runs first
    }

    // Enable Ask AI button regardless of other conditions
    this.enableIndependentAskAI();

    // Force focus outlines for keyboard users
    document.addEventListener('keydown', () => {
      document.body.classList.add('keyboard-user');
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-user');
    });

    console.log('Enhanced keyboard navigation initialized');
  }

  // Make Ask AI button work independently
  enableIndependentAskAI() {
    // Remove any conditions that disable the Ask AI button
    this.isAskAIEnabled = true;

    // If this method is called after view init, we need to manually update the button
    setTimeout(() => {
      const askAIButtons = document.querySelectorAll(
        '.ask-ai-button'
      ) as NodeListOf<HTMLButtonElement>;
      if (askAIButtons.length > 0) {
        console.log('Found Ask AI buttons, enabling independently');

        askAIButtons.forEach((askAIButton) => {
          // Make sure the button is enabled
          askAIButton.disabled = false;
          askAIButton.removeAttribute('disabled');

          // Add stronger click handler
          const clickHandler = () => {
            console.log('Ask AI button clicked from TypeScript handler');
            askAIButton.classList.add('feedback-click');
            setTimeout(() => {
              askAIButton.classList.remove('feedback-click');
            }, 300);

            // Toggle the Ask AI form
            this.zone.run(() => {
              this.toggleAskAI();
            });

            // If there's no text in the transcription, provide a helpful message
            if (!this.transcription || this.transcription.trim() === '') {
              this.showToast(
                'info',
                'No Transcription',
                'No transcription available. You can still ask general medical questions.',
                3000
              );
            }
          };

          // Remove existing listeners to avoid duplicates
          const newElement = askAIButton.cloneNode(true) as HTMLButtonElement;
          askAIButton.parentNode?.replaceChild(newElement, askAIButton);

          // Use capture to ensure our handler runs
          newElement.addEventListener('click', clickHandler, true);

          // Ensure keyboard activation works
          newElement.addEventListener(
            'keydown',
            (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                clickHandler();
              }
            },
            true
          );
        });
      }
    }, 500);
  }

  // Add method to ensure keyboard interactivity for all cards
  ensureCardKeyboardAccessibility() {
    setTimeout(() => {
      const cards = document.querySelectorAll(
        '.card, .sample-item, .medical-card'
      );
      cards.forEach((card) => {
        if (!card.hasAttribute('tabindex')) {
          card.setAttribute('tabindex', '0');
        }

        (card as HTMLElement).addEventListener(
          'keydown',
          (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (card as HTMLElement).click();
            }
          }
        );
      });
    }, 1000);
  }

  // Add these methods to handle keyboard events in the Ask AI form
  handleAskAIKeydown(event: KeyboardEvent): void {
    // If the user presses Enter and not holding Shift
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent form submission
      this.askLlama(); // Submit the question
    }
  }

  // Add this to initialize keyboard event listeners
  initKeyboardListeners(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Handle Shift + Arrow keys for navigation
      if (event.shiftKey) {
        const sections = ['live', 'file', 'samples'];
        const currentIndex = sections.indexOf(this.activeSection);

        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            if (currentIndex < sections.length - 1) {
              event.preventDefault();
              this.navigateTo(sections[currentIndex + 1]);
            }
            break;

          case 'ArrowLeft':
          case 'ArrowUp':
            if (currentIndex > 0) {
              event.preventDefault();
              this.navigateTo(sections[currentIndex - 1]);
            }
            break;
        }
      }

      // Add Escape key to close Ask AI form
      if (event.key === 'Escape' && this.showAskAIForm) {
        event.preventDefault();
        this.toggleAskAI();
      }

      // Add keyboard shortcut Alt + A to toggle Ask AI
      if (event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        this.toggleAskAI();
      }
    });
  }

  private showTutorial(): void {
    let currentStep = 0;

    const showNextStep = () => {
      if (currentStep < this.helpSteps.length) {
        const step = this.helpSteps[currentStep];
        const element = document.querySelector(step.target);
        if (element) {
          element.classList.add('highlight-tutorial');
          this.showToast('info', 'Tip', step.content, 5000);
        }
        currentStep++;
        setTimeout(showNextStep, 5000);
      } else {
        // Remove highlights
        document.querySelectorAll('.highlight-tutorial').forEach((el) => {
          el.classList.remove('highlight-tutorial');
        });
      }
    };

    showNextStep();
  }

  // Get actual audio duration
  getAudioDuration(url: string): Promise<string> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      });
      audio.addEventListener('error', () => {
        resolve('Unknown'); // Default duration if can't be determined
      });
      audio.src = url;
    });
  }

  // Initialize sample audio durations
  async initializeAudioSamples(): Promise<void> {
    for (let i = 0; i < this.sampleTranscriptions.length; i++) {
      const sample = this.sampleTranscriptions[i];
      try {
        sample.duration = await this.getAudioDuration(sample.filePath);
      } catch (error) {
        console.error(`Error getting duration for ${sample.fileName}:`, error);
      }
    }
  }
}
