import serial
from time import sleep

# Create a serial connection
while True:
    try:
        ser = serial.Serial('/dev/cu.usbmodem101', 115200)
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
