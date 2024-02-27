#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

const char* ssid = ">ENTER WIFI NAME>"; // Your WiFi SSID
const char* password = "<ENTER PASS>"; // Your WiFi password


// Function to send WAV buffer
void sendWavBuffer(const std::vector<uint8_t>& buffer) {
    // Ensure we are connected to WiFi. If not, return.
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi is not connected!");
        return;
    }

    const char* supabaseUrlEnv = "<SUPABASE URL>"; // Use your Supabase URL here
    const char* authToken = "<ANON TOKEN>"; // Use your Auth Token here

    std::string url = std::string(supabaseUrlEnv) + "/functions/v1/process-audio";

    WiFiClientSecure client;
    client.setInsecure(); // Disables SSL certificate verification

    HTTPClient https;
    if (https.begin(client, url.c_str())) { // HTTPS begin
        https.addHeader("Authorization", "Bearer " + String(authToken));
        https.addHeader("Content-Type", "audio/wav");

        // Create a non-const copy of the data from the buffer
        size_t bufferSize = buffer.size();
        uint8_t* nonConstBuffer = new uint8_t[bufferSize];
        memcpy(nonConstBuffer, buffer.data(), bufferSize);

        // Use the non-const copy in the POST call
        int httpResponseCode = https.POST(nonConstBuffer, bufferSize);

        if (httpResponseCode > 0) {
            // If server responds, print response
            Serial.printf("HTTP Response code: %d\n", httpResponseCode);
            String payload = https.getString();
            Serial.println(payload);
        }
        else {
            Serial.printf("Error on sending POST: %d\n", httpResponseCode);
        }

        // Clean up the non-const buffer copy after use
        delete[] nonConstBuffer;

        https.end(); // HTTPS end
    }
    else {
        Serial.println("Error in HTTPS connection");
    }

    
}

void setup() {
    Serial.begin(115200);

    // Connect to WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi..");
    }
    Serial.println("Connected to WiFi");

    // Initialize vector with dummy data for testing
    std::vector<uint8_t> dummyData(1024, 0); // Example buffer, replace with actual audio data
    sendWavBuffer(dummyData); // Send the buffer
}

void loop() {
    // Nothing here
}

