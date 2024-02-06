import pyaudio
import wave
import requests

# Audio recording parameters
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 16000
CHUNK = 1024
RECORD_SECONDS = 10
WAVE_OUTPUT_FILENAME = "file.wav"

audio = pyaudio.PyAudio()

# Start recording
stream = audio.open(format=FORMAT, channels=CHANNELS,
                    rate=RATE, input=True,
                    frames_per_buffer=CHUNK)
print("recording...")
frames = []

for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
    data = stream.read(CHUNK)
    frames.append(data)
print("finished recording")

# Stop recording
stream.stop_stream()
stream.close()
audio.terminate()

# Save the recorded data as a WAV file
wf = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
wf.setnchannels(CHANNELS)
wf.setsampwidth(audio.get_sample_size(FORMAT))
wf.setframerate(RATE)
wf.writeframes(b''.join(frames))
wf.close()

# Send the audio file to the server
url = 'https://YOUR_APP_ID.supabase.co/functions/v1/process-audio'  # Replace this with your server's URL
files = {'file': open(WAVE_OUTPUT_FILENAME, 'rb')}
response = requests.post(url, files=files, headers={
    'apikey': 'PUB TOKEN',
    'Content-Type': 'audio/wav,'
})
print(response.text)