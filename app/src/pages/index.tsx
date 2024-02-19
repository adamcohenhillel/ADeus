import React, { useState, useEffect } from "react";

import { useSupabase } from "@/utils/useSupabaseConfig";
import LoginForm from "@/components/LoginForm";
import Chat from "@/components/Chat";
import { useRouter } from "next/router";
import {
  BleClient,
  ScanResult,
  numberToUUID,
} from "@capacitor-community/bluetooth-le";
import { Button } from "@/components/ui/button";

const SERVICE_ID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_ID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const SAMPLE_RATE = 44100;
const FRAMES_PER_BUFFER = 512;
const RECORD_SECONDS = 10;

export default function Index() {
  const [devices, setDevices] = useState<ScanResult[]>([]);

  const connect = async (deviceId: string) => {
    BleClient.connect(deviceId);
  };

  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  const { user, supabaseClient } = useSupabase();

  useEffect(() => {
    scan();
  }, []);

  useEffect(() => {
    if (user) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, [user]);

  async function scan(): Promise<void> {
    try {
      await BleClient.initialize();

      await BleClient.requestLEScan({}, (result: ScanResult) => {
        setDevices((prev) => {
          return [...prev, result];
        });
        console.log("received new scan result", result);
      });

      setTimeout(async () => {
        await BleClient.stopLEScan();
        console.log("stopped scanning");
      }, 5000);
    } catch (error) {
      console.error(error);
    }
  }

  async function sendAudioData(audioData: Uint8Array) {
    const response = await fetch(
      "https://bgkiorohiiofwtxnfvvo.supabase.co/functions/v1/process-audio",
      {
        method: "POST",
        body: audioData.buffer, // Assuming audioData is a Uint8Array or similar binary data
        headers: {
          "Content-Type": "application/octet-stream",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Response from the backend:", result);
  }

  return (
    <div style={{ marginTop: 40 }}>
      <h1>Index</h1>
      {/* {loggedIn && user ? (
        <Chat supabaseClient={supabaseClient} />
      ) : (
        <LoginForm />
      )} */}
      {devices.map((device, index) => {
        if (device.device.name?.includes("ESP32")) {
          return (
            <Button
              onClick={async () => {
                await connect(device.device.deviceId);
                // let buffer: ArrayBuffer = new ArrayBuffer(441000 * 4);
                // const combinedView = new DataView(buffer);
                let buffer = new Uint8Array((32 * 441000 - 512) / 4);

                for (let i = 0; i < 441000 * 4; ++i) {
                  const result = await BleClient.read(
                    device.device.deviceId,
                    SERVICE_ID,
                    CHARACTERISTIC_ID
                  );

                  buffer.set(new Uint8Array(result.buffer));
                }

                await sendAudioData(buffer);
              }}
              key={index}
            >
              <h1>Device: {device.device.name + ""}</h1>
              <p>UUID: {device.uuids}</p>
            </Button>
          );
        }
      })}
      {connected && <h1>status: connected</h1>}
      {data && <h1>data: {data}</h1>}
    </div>
  );
}
