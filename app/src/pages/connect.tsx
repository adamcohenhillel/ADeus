import { useEffect, useState } from 'react';

import LogoutButton from '@/components/LogoutButton';
import { NavMenu } from '@/components/NavMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useSupabase, useSupabaseConfig } from '@/utils/useSupabaseConfig';
import { BleClient, ScanResult } from '@capacitor-community/bluetooth-le';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { Files } from 'lucide-react';
import Link from 'next/link';
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
    // const device = await BleClient.requestDevice({
    //   services: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b'],
    // });
    await BleClient.connect(deviceId);

    return deviceId;
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
          if (result.device.name === 'ADeus') {
            return [...prev, result];
          } else {
            return prev;
          }
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
    console.log('base64', data);

    if (!supabaseUrl) {
      throw new Error('Supabase URL is not defined');
    }

    const options = {
      url: supabaseUrl + '/functions/v1/process-audio',
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

  if (!supabaseClient) {
    return <div>Supabase client not found</div>;
  }

  return (
    <>
      <div className="from-background fixed top-0 flex h-24 w-full items-center justify-between bg-gradient-to-b"></div>
      <div className="fixed right-4 top-4 flex space-x-4">
        <NavMenu>
          <Button
            asChild
            size={'icon'}
            className="bg-muted/20 text-muted-foreground hover:bg-muted/40 rounded-full"
          >
            <Link href="/">
              <Files size={20} />
            </Link>
          </Button>
          <ThemeToggle />
          <LogoutButton supabaseClient={supabaseClient} />
        </NavMenu>
      </div>
      <div className="mt-40">
        {devices.map((device, index) => {
          return (
            <Button
              onClick={async () => {
                // Around 20 seconds of audio data at: 8khz sample rate, 16-bit PCM, 1 channel
                let activeBufferIndex = 0;
                let bufferSize = 320000;
                const buffers = [
                  new Uint8Array(bufferSize),
                  new Uint8Array(bufferSize),
                ];

                const processBuffer = async (buffer: Uint8Array) => {
                  await sendAudioData(buffer);
                };

                const swapBuffers = () => {
                  processBuffer(buffers[activeBufferIndex]);
                  activeBufferIndex = 1 - activeBufferIndex; // Switch between 0 and 1
                  count = 0; // Reset count for the new active buffer
                };

                let count = 0;

                const result = await BleClient.startNotifications(
                  device.device.deviceId,
                  '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
                  'beb5483e-36e1-4688-b7f5-ea07361b26a8',
                  async (value) => {
                    for (let i = 0; i < value.byteLength; i++) {
                      buffers[activeBufferIndex][count] = value.getUint8(i);
                      count++;
                      if (count === bufferSize) {
                        swapBuffers();
                      }
                    }
                  }
                );
              }}
              key={index}
            >
              <h1>Device: {device.device.name + ''}</h1>
              <p>UUID: {device.uuids}</p>
            </Button>
          );
        })}
        <Button onClick={scan}>Scan Again</Button>
      </div>
    </>
  );
}
