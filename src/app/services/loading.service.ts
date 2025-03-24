import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  private loadingTimeout: any;

  show(timeout: number = 30000) {
    this.loadingSubject.next(true);
    // Auto-hide loading after timeout to prevent infinite loading states
    this.loadingTimeout = setTimeout(() => this.hide(), timeout);
  }

  hide() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    this.loadingSubject.next(false);
  }
}