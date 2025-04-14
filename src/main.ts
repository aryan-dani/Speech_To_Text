import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { enableProdMode, isDevMode } from '@angular/core';
import { environment } from './environments/environment';

// Enable production mode if environment is set to production
if (environment.production) {
  enableProdMode();
  // Disable console logs in production
  if (!isDevMode()) {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {}; // Consider keeping error logs
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withFetch() // Modern fetch API for HTTP requests
      // Additional interceptors could be added here
    ),
    // Other application-wide providers would go here
  ],
}).catch((err) => console.error('Application bootstrap error:', err));
