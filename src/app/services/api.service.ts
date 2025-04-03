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

    // Use the proxy path if enabled
    const baseUrl = environment.api.useProxy
      ? environment.api.proxyPath
      : `http://${environment.backend.host}`;

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

  private uploadInChunks(file: File) {
    // Chunked upload implementation
    // This would split the file and send it in smaller pieces
    // ...
  }
}
