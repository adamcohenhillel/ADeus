#ifndef BLESERVER_H
#define BLESERVER_H

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

class BluetoothServer
{
    private:
        BLEServer *pServer;
        BLEService *pService;
        BLECharacteristic *audioCharacteristic;

    public:
        BluetoothServer();
        void startAdvertising();
        void setValue(uint8_t *value, size_t len);
};
#endif // BLESERVER_H