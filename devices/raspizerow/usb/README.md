# Running Rasperry Pi Zero W with USB mic

### Hardware Requirements (~$37.97)

1. [USB mini mic](https://www.adafruit.com/product/3367) ($5.99)
2. [Rasperry Pi Zero W](https://www.adafruit.com/product/3400) ($15.00)
3. [USB 2.0 Micro USB Male to USB Female OTG](https://www.amazon.com/Ksmile%C2%AE-Female-Adapter-SamSung-tablets/dp/B01C6032G0) ($4.99)
4. [Power Supply](https://www.amazon.com/Raspberry-Supply-SoulBay-Adapter-Android/dp/B07CVH21NC?linkCode=df0&hvadid=385179140364&hvpos=&hvnetw=g&hvrand=2844111932483370033&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9002000&hvtargid=pla-838026314871&mcid=ec76ee0f13cb3008aa21bd3651e6dfdd&adgrpid=82240853201&hvpone=&hvptwo=&hvadid=385179140364&hvpos=&hvnetw=g&hvrand=2844111932483370033&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9002000&hvtargid=pla-838026314871) ($11.99). You can probably find one at home.

### How to

1. [Setup Pi Zero](https://www.raspberrypi.com/documentation/computers/getting-started.html)
2. Make sure your Pi has internet connection
3. Clone repo

```
git clone https://github.com/adamcohenhillel/ADeus
cd Adeus/devices/raspizerow
```

4. Run setup script. For this step you will need your SUPABASE_URL.

```
chmod +x ./setup.sh
./setup.sh
```

5. Run the executable

```
./main
```
