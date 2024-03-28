#include <ArduinoBLE.h>
#include <mic.h>

#define MIC_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define MIC_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEService micService(MIC_SERVICE_UUID);
BLECharacteristic micDataChar(MIC_CHAR_UUID, BLERead | BLENotify, 179);

mic_config_t mic_config{
    .channel_cnt = 1,
    .sampling_rate = 16000,
    .buf_size = 1600,
    .debug_pin = LED_BUILTIN // Toggles each DAC ISR (if DEBUG is set to 1)
};

NRF52840_ADC_Class Mic(&mic_config);
#define SAMPLES 179

int16_t recording_buf[SAMPLES];
volatile static bool record_ready = false;

void setup()
{
    Serial.begin(115200);
    while (!Serial)
    {
        delay(10);
    }

    // Set callback to the mic
    Mic.set_callback(audio_rec_callback);

    if (!Mic.begin())
    {
        Serial.println("Mic initialization failed");
        while (1)
            ;
    }

    if (!BLE.begin())
    {
        Serial.println("starting BLE failed");
        while (1)
            ;
    }

    BLE.setLocalName("ADeus");
    BLE.setAdvertisedService(micService);
    micService.addCharacteristic(micDataChar);
    BLE.addService(micService);
    BLE.advertise();

    Serial.println("Bluetooth device active, waiting for connections...");
}

void loop()
{
    BLEDevice central = BLE.central();
    // central

    if (central)
    {
        Serial.print("Connected to central: ");
        Serial.println(central.address());
        digitalWrite(LED_BUILTIN, HIGH);

        while (central.connected())
        {
            if (record_ready)
            {
                Serial.println("finished sampling");
                micDataChar.writeValue((uint8_t *)recording_buf, 179);
                record_ready = false;
            }
        }

        digitalWrite(LED_BUILTIN, LOW);
        Serial.print("Disconnected from central: ");
        Serial.println(central.address());
    }
}

static void audio_rec_callback(uint16_t *buf, uint32_t buf_len)
{
    static uint32_t idx = 0;

    // Copy samples from DMA buffer to inference buffer
    for (uint32_t i = 0; i < buf_len; i++)
    {
        recording_buf[idx++] = buf[i];

        if (idx >= SAMPLES)
        {
            idx = 0;
            record_ready = true;
            break;
        }
    }
}
