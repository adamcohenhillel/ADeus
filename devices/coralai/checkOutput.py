import argparse
import serial
from time import sleep


def main(device: str):
    # Create a serial connection
    while True:
        try:
            ser = serial.Serial(device, 115200)
            break
        except:
            sleep(1)
            print(".", end="")

    print("Serial connection created.")

    try:
        while True:
            line = ser.readline().decode('utf-8').strip()
            print(line)

    except KeyboardInterrupt:
        pass

    finally:
        # Close the serial connection when done
        ser.close()

if __name__ == "__main__":
    # Add serial device as argparse before calling main:
    parser = argparse.ArgumentParser()
    parser.add_argument("device", help="Serial device to connect to", default="/dev/cu.usbmodem101", nargs='?')
    args = parser.parse_args()
    main(args.device)
