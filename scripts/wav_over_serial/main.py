import serial
import wave
import time

# Configure your serial port settings
SERIAL_PORT = '/dev/tty.usbmodem2101'  # Update this to your serial port name
BAUD_RATE = 500000
CHANNELS = 1
SAMPLE_RATE = 16000
SAMPLE_WIDTH = 2  # 16 bits = 2 bytes
RECORD_SECONDS = 10  # Modify as needed

def main():
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    wav_file = wave.open('output.wav', 'wb')
    wav_file.setnchannels(CHANNELS)
    wav_file.setsampwidth(SAMPLE_WIDTH)
    wav_file.setframerate(SAMPLE_RATE)

    try:
        print("Recording...")
        start_time = time.time()
        while (time.time() - start_time) < RECORD_SECONDS:
            data = ser.read(SAMPLE_RATE * SAMPLE_WIDTH * 2)
            print(len(data))
            if data:
                wav_file.writeframes(data)
    except KeyboardInterrupt:
        print("Recording stopped.")
    finally:
        ser.close()
        wav_file.close()
        print("WAV file has been created.")

if __name__ == "__main__":
    main()
