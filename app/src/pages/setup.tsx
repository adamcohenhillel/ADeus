import { BleClient, numberToUUID } from "@capacitor-community/bluetooth-le";

// const HEART_RATE_SERVICE = numberToUUID(0x180d);

export default function Setup() {
  async function scan(): Promise<void> {
    try {
      await BleClient.initialize();

      await BleClient.requestLEScan({}, (result) => {
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
  scan();
  return (
    <div>
      <h1>Setup</h1>
    </div>
  );
}
