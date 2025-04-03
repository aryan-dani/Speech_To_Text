export const environment = {
  production: false,
  backend: {
    host: '192.168.3.21', // Change this according to your environment
    // port: 8000,
    maxReconnectDelay: 30000,
    reconnectBaseDelay: 3000,
    maxReconnectAttempts: 100, // Maximum number of reconnection attempts
    useSecureWebSockets: false, // Set to true to use wss:// instead of ws://
    connectionTimeout: 5000, // Connection timeout in milliseconds
  },
  api: {
    useProxy: true, // Set to true to use Angular proxy for bypassing CORS in development
    proxyPath: '/api', // Proxy path to be used in requests instead of direct URL
  },
  uploads: {
    chunkSize: 1024 * 1024 * 5, // 5MB chunks for large file uploads
    retryAttempts: 3, // Number of retry attempts for failed uploads
    timeout: 30000, // Timeout for upload requests in milliseconds
    maxFileSize: 1024 * 1024 * 100, // 100MB maximum file size limit
    useChunkedUpload: true, // Enable chunked uploads for large files
  },
};
