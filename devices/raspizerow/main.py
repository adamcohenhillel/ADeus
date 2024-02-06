import pyaudio
import requests
import wave
import io
import os

# Audio Configuration
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
CHUNK_SIZE = 1024
RECORD_SECONDS = 5  # Adjust as needed

audio = pyaudio.PyAudio()

# Start Recording
stream = audio.open(format=FORMAT, channels=CHANNELS,
                    rate=RATE, input=True,
                    frames_per_buffer=CHUNK_SIZE)

print("Recording...")

frames = []

def aggregate_and_send():
    while True:
        data = stream.read(CHUNK_SIZE)
        frames.append(data)
        if len(frames) * CHUNK_SIZE >= RATE * RECORD_SECONDS:
            # Assume we're sending the raw data; you might want to process it first
            wav_io = io.BytesIO()
            wf = wave.open(wav_io, 'wb')
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(audio.get_sample_size(FORMAT))
            wf.setframerate(RATE)
            wf.writeframes(b''.join(frames))
            wf.close()
            
            wav_bytes = wav_io.getvalue()
            response = requests.post(os.environ["SUPABASE_URL"] + '/functions/v1/process-audio', data=wav_bytes)
            print("Data sent, response:", response.text)
            
            frames.clear()  # Clear the frames for the next aggregate

try:
    aggregate_and_send()
except KeyboardInterrupt:
    print("Stopping...")

stream.stop_stream()
stream.close()
audio.terminate()
