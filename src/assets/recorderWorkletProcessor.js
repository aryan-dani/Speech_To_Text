class RecorderProcessor extends AudioWorkletProcessor {
process(inputs, outputs) {
const input = inputs[0];
if (input && input.length > 0) {
const channelData = input[0];
if (channelData) {
// Convert float32 to int16
const pcmData = new Int16Array(channelData.length);
for (let i = 0; i < channelData.length; i++) {
const s = Math.max(-1, Math.min(1, channelData[i]));
pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
}

// Send data to the main thread
this.port.postMessage({
eventType: 'audio',
audioBuffer: pcmData.buffer
}, [pcmData.buffer]);
}
}
return true; // Keep processor alive
}
}

registerProcessor('recorder-processor', RecorderProcessor);