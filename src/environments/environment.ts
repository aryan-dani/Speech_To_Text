export const environment = {
  production: false,
  backend: {
    host: '192.168.3.21', // Change this according to your environment
    port: 8000,
    maxReconnectDelay: 30000,
    reconnectBaseDelay: 3000,
    maxReconnectAttempts: 10, // Maximum number of reconnection attempts
    useSecureWebSockets: true, // Set to true to use wss:// instead of ws://
    connectionTimeout: 5000 // Connection timeout in milliseconds
  }
};