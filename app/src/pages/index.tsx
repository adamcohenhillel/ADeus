import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useSupabase, useSupabaseConfig } from '@/utils/useSupabaseConfig';
import { BleClient, ScanResult } from '@capacitor-community/bluetooth-le';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { useRouter } from 'next/router';

// const SERVICE_ID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
// const CHARACTERISTIC_ID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
// const SAMPLE_RATE = 44100;
// const FRAMES_PER_BUFFER = 512;
// const RECORD_SECONDS = 10;

export default function Index() {
  const [devices, setDevices] = useState<ScanResult[]>([]);
  const { supabaseUrl, supabaseToken } = useSupabaseConfig();

  const connect = async (deviceId: string) => {
    const device = await BleClient.requestDevice({
      services: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b'],
    });

    console.log('connecged');
    await BleClient.connect(device.deviceId);

    return device.deviceId;
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
      });

      setTimeout(async () => {
        await BleClient.stopLEScan();
        console.log('stopped scanning');
      }, 5000);
    } catch (error) {
      console.error(error);
    }
  }

  async function sendAudioData(audioData: Uint8Array) {
    const data = Buffer.from(audioData).toString('base64');
    console.log('Sending audio data to the backend:', data);

    const options = {
      url: 'https://bgkiorohiiofwtxnfvvo.supabase.co/functions/v1/process-audio',
      headers: {
        'Content-Type': 'application/json',
      },
      data: { data: data },
    };

    const response: HttpResponse = await CapacitorHttp.post(options);

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.data;
    console.log('Response from the backend:', result);
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
        if (device.device.name?.includes('ESP32')) {
          return (
            <Button
              onClick={async () => {
                const deviceId = await connect(device.device.deviceId);

                let bufferSize = 100000;
                let buffer = new Uint8Array(bufferSize);

                let count = 0;

                const result = await BleClient.startNotifications(
                  deviceId,
                  '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
                  'beb5483e-36e1-4688-b7f5-ea07361b26a8',
                  async (value) => {
                    for (let i = 0; i < value.byteLength; i++) {
                      buffer[count] = value.getUint8(i);
                      count++;
                      if (count === bufferSize) {
                        count = 0;
                        await sendAudioData(buffer);
                      }
                    }
                  }
                );

                await sendAudioData(buffer);
              }}
              key={index}
            >
              <h1>Device: {device.device.name + ''}</h1>
              <p>UUID: {device.uuids}</p>
            </Button>
          );
        }
      })}
      {connected && <h1>status: connected</h1>}
      {data && <h1>data: {data}</h1>}
      <Button onClick={scan}>Scan Again</Button>
    </div>
  );
}
