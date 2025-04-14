import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HelpService {
  private hasSeenTutorial = false;
  private helpTipsShown = new Set<string>();
  private helpVisibleSubject = new BehaviorSubject<boolean>(false);
  helpVisible$ = this.helpVisibleSubject.asObservable();

  showInitialTutorial() {
    if (!this.hasSeenTutorial) {
      const steps = [
        {
          target: '.recording-section',
          content: 'Start by recording your voice or uploading an audio file',
          position: 'bottom',
        },
        {
          target: '.ask-ai-button',
          content:
            'Use AI to analyze your transcriptions or ask medical questions (Alt + A)',
          position: 'left',
        },
        {
          target: '.shortcuts-section',
          content:
            'Use keyboard shortcuts for quick navigation (Shift + Arrow keys)',
          position: 'right',
        },
      ];

      this.helpVisibleSubject.next(true);
      this.hasSeenTutorial = true;
      return steps;
    }
    return null;
  }

  showContextualHelp(elementId: string): void {
    if (!this.helpTipsShown.has(elementId)) {
      this.helpTipsShown.add(elementId);
      this.helpVisibleSubject.next(true);
    }
  }

  hideHelp(): void {
    this.helpVisibleSubject.next(false);
  }

  resetTutorial(): void {
    this.hasSeenTutorial = false;
    this.helpTipsShown.clear();
  }
}
