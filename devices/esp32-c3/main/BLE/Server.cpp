#include "Server.h"
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <Arduino.h>

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

static bool s_is_connected = false;


class ServerHandler: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        s_is_connected = true;
        Serial.println("Connected");
    }

    void onDisconnect(BLEServer* pServer) {
        s_is_connected = false;
        Serial.println("Disconnected");
        BLEDevice::startAdvertising();
    }
};

BluetoothServer::BluetoothServer() {}

void BluetoothServer::startAdvertising()
{

    Serial.println("Starting BLE Server");
    BLEDevice::init("ESP32");
    BLEDevice::setMTU(185);
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new ServerHandler());
    pService = pServer->createService(SERVICE_UUID);
    audioCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
            BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY);
    


    audioCharacteristic->setValue("ESP32Hello World says ESP32Hello World");
    pService->start();

    
    // BLEAdvertising *pAdvertising = pServer->getAdvertising();  // this still is working for backward compatibility
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMinPreferred(0x12);
    pAdvertising->setMinInterval(0x20);
    pAdvertising->setMaxInterval(0x40);
    BLEDevice::startAdvertising();
    Serial.printf("MTU size: %d bytes\n", BLEDevice::getMTU());
}

void BluetoothServer::setValue(uint8_t *value, size_t len)
{
    if (!s_is_connected) {
        delay(50); // Wait for a connection
        return;
    }
    
    audioCharacteristic->setValue(value, len);
    audioCharacteristic->notify();
    delay(4);

    delay(4);
}