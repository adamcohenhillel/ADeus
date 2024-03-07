#ifndef I2SRECORDER_H
#define I2SRECORDER_H

#include <Arduino.h>
#include <ESP_I2S.h>

class I2SRecorder
{
private:
    I2SClass I2S;
    int sck, ws, din, mclk; // Renamed variables

public:
    // Updated constructor with renamed parameters
    I2SRecorder(int sck, int ws, int din, int mclk);

    void setup();
    size_t record(char *buffer, size_t bufferSize);
};

#endif // I2SRECORDER_H
