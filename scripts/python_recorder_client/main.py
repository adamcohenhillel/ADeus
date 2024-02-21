import os
import threading
import pyaudio
import wave
import numpy as np
import time
import signal

import requests
import logging
import argparse

parser = argparse.ArgumentParser(
    description='Record audio and send it to a server.',
    epilog='python main.py -s 60 -m 50.0 -u "https://{YOUR_ID}.supabase.co" -t "API_TOKEN" -r -v'
)

parser.add_argument('-u', '--base-url', type=str, required=True,
                    help="The base URL to which the recordings are sent.")
parser.add_argument('-t', '--token', type=str, required=True,
                    help="API token for authentication with the server.")
parser.add_argument('-s', '--seconds', type=int, default=30,
                    help="Duration of each recording segment in seconds. (default 30)")
parser.add_argument('-m', '--sensitivity', type=float, default=0.0,
                    help="Microphone sensitivity threshold (0.0 to 100.0, default: 0).")
parser.add_argument('-l', '--save', action='store_true', help="Save recordings locally.")
parser.add_argument('-v', '--verbose', action='store_true',
                    help="Enable verbose output for debugging.")

# Parse the arguments
args = parser.parse_args()

logger = logging.getLogger('AudioRecorder')
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)
if args.verbose:
    logger.setLevel(logging.DEBUG)

FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 1024
WAVE_OUTPUT_FILENAME = 'recording{}.wav'

audio = pyaudio.PyAudio()


def is_silent(data_chunk):
    as_ints = np.frombuffer(data_chunk, dtype=np.int16)
    mean = np.mean(as_ints ** 2)
    if np.isnan(mean):
        return None

    volume = np.sqrt(mean)
    return volume < args.sensitivity


def get_wav_filename():
    return WAVE_OUTPUT_FILENAME.format(int(time.time()) if args.save else '')


def get_base_url():
    return args.base_url if not args.base_url.endswith('/') else args.base_url[:-1]


def store_sound(frames):
    logger.debug('Store and sending wav.')
    filename = get_wav_filename()
    wf = wave.open(filename, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(audio.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()

    with open(filename, 'rb') as f:
        files = {'file': (filename, f, 'audio/wav')}
        response = requests.post(f'{get_base_url()}/functions/v1/process-audio', files=files, headers={
            'Authorization': f'Bearer {args.token}',
            'apikey': args.token,
        }, timeout=540)
    logger.info(response.text)


def main():
    print(f"""
Starting ADeus sound recording,
    - Use --help for help.
    - Running with URL: "{get_base_url()}"
    - Recordings length: {args.seconds} seconds.
    """)
    # Prepare to record
    stream = audio.open(format=FORMAT, channels=CHANNELS,
                        rate=RATE, input=True,
                        frames_per_buffer=CHUNK)

    def exit_script(_, __):
        logger.info('Exiting...')
        stream.stop_stream()
        stream.close()
        audio.terminate()
        if not args.save:
            os.remove(get_wav_filename())
        exit(0)

    signal.signal(signal.SIGINT, exit_script)
    logger.info('Listening... (press Ctrl+C to stop)')

    try:
        logger.info('Status: [ WAITING FOR SOUND ]')
        while True:
            data = stream.read(CHUNK, exception_on_overflow=False)
            if not is_silent(data):
                logger.info('Status: [     RECORDING     ]')

                start_time = time.time()
                frames = [data]

                while True:
                    data = stream.read(CHUNK, exception_on_overflow=False)
                    frames.append(data)

                    if (time.time() - start_time) >= args.seconds:
                        logger.debug(f'{args.seconds} seconds reached, checking for continued sound...')
                        break

                threading.Thread(target=store_sound, args=(frames,)).start()

                if not is_silent(data):
                    logger.debug('Still not silent, continuing recording...')
                else:
                    logger.debug('Listening again... (press Ctrl+C to stop)')
                logger.info('Status: [ WAITING FOR SOUND ]')

    except KeyboardInterrupt:
        logger.info('Recording stopped by user.')

    finally:
        stream.stop_stream()
        stream.close()
        audio.terminate()


if __name__ == '__main__':
    main()
