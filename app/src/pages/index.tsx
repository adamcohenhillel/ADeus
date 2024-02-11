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

  return (
    <div style={{ marginTop: 40 }}>
      <h1>Index</h1>
      {/* {loggedIn && user ? (
        <Chat supabaseClient={supabaseClient} />
      ) : (
        <LoginForm />
      )} */}
      {devices.map((device, index) => {
        if (device.uuids?.includes("4fafc201-1fb5-459e-8fcc-c5c9c331914b")) {
          return (
            <Button
              onClick={async () => {
                await connect(device.device.deviceId);
                const result = await BleClient.read(
                  device.device.deviceId,
                  SERVICE_ID,
                  CHARACTERISTIC_ID
                );
                const decoder = new TextDecoder("utf-8");
                const fullMessage = decoder.decode(result);

                setData(fullMessage);
                setConnected(true);
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
