import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    // Determine protocol based on environment setting
    const protocol = environment.backend.useSecureWebSockets ? 'https' : 'http';

    // Use the proxy path if enabled, otherwise construct the URL with the determined protocol
    const baseUrl = environment.api.useProxy
      ? environment.api.proxyPath
      : `${protocol}://${environment.backend.host}`;

    return this.http.post(`${baseUrl}/upload/`, formData);
  }

  // For large files, implement chunked upload
  uploadLargeFile(file: File) {
    if (
      environment.uploads.useChunkedUpload &&
      file.size > environment.uploads.chunkSize
    ) {
      // Implement chunked upload logic here
      return this.uploadInChunks(file);
    } else {
      return this.uploadFile(file);
    }
  }

  private uploadInChunks(file: File) {}
}
