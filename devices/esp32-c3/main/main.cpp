#include <Arduino.h>
#include "BLE/Server.h"
#include "esp_log.h"
#include <driver/i2s.h>

BluetoothServer BLEServer;

// you shouldn't need to change these settings
#define BUFFER_SIZE 182
#define SAMPLE_RATE 8000
// most microphones will probably default to left channel but you may need to tie the L/R pin low
#define I2S_MIC_CHANNEL I2S_CHANNEL_FMT_ONLY_LEFT
// either wire your microphone to the same pins or change these to match your wiring
#define I2S_MIC_SERIAL_CLOCK 3     // bck, bclk, sclk
#define I2S_MIC_LEFT_RIGHT_CLOCK 2 // ws, lrclk, fs
#define I2S_MIC_SERIAL_DATA 4      // sd

i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 1024,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0};

i2s_pin_config_t i2s_mic_pins = {
    .bck_io_num = I2S_MIC_SERIAL_CLOCK,
    .ws_io_num = I2S_MIC_LEFT_RIGHT_CLOCK,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_MIC_SERIAL_DATA};

void setup()
{
    ESP_LOGW("LOG", "Starting BLE Server");
    BLEServer.startAdvertising();
    ESP_LOGW("LOG", "BLE Server started");

    // start up the I2S peripheral
    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &i2s_mic_pins);
    ESP_LOGW("LOG", "I2S pins set");
}

#define LOG_BUFFER_BYTES_PER_LINE 16 // Adjust as needed for readability

void logBufferHex(const uint8_t *buffer, size_t length)
{
    for (size_t i = 0; i < length; i += LOG_BUFFER_BYTES_PER_LINE)
    {
        char line[LOG_BUFFER_BYTES_PER_LINE * 3 + 1] = {0}; // Initialize with 0 to ensure null-terminated
        size_t lineIndex = 0;
        for (size_t j = i; j < i + LOG_BUFFER_BYTES_PER_LINE && j < length; ++j)
        {
            lineIndex += snprintf(&line[lineIndex], sizeof(line) - lineIndex, "%02X ", buffer[j]);
            if (lineIndex >= sizeof(line) - 3)
                break; // Prevent buffer overrun
        }
        ESP_LOGW("LOG", "%s", line);
    }
}

uint8_t raw_samples[BUFFER_SIZE];
void loop()
{
    // read from the I2S device
    size_t bytes_read = 0;
    i2s_read(I2S_NUM_0, raw_samples, sizeof(uint8_t) * BUFFER_SIZE, &bytes_read, portMAX_DELAY);
    // logBufferHex(raw_samples, bytes_read);

    // Send the data over BLE
    if (bytes_read > 0)
    {
        BLEServer.setValue(reinterpret_cast<uint8_t *>(raw_samples), bytes_read);
    }
}