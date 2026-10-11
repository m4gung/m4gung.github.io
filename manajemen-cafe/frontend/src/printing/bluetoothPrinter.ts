/**
 * Web Bluetooth Thermal Printer Driver
 */
export class BluetoothPrinterDriver {
  private device: any = null;
  private characteristic: any = null;

  async isSupported(): Promise<boolean> {
    return 'bluetooth' in navigator;
  }

  async connect(): Promise<string> {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth tidak didukung di browser ini. Gunakan Google Chrome.');
    }

    const nav = navigator as any;
    // Request device supporting standard Bluetooth SPP or printer service
    this.device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ]
    });

    const server = await this.device.gatt.connect();
    const services = await server.getPrimaryServices();

    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          this.characteristic = char;
          break;
        }
      }
      if (this.characteristic) break;
    }

    if (!this.characteristic) {
      throw new Error('Karakteristik cetak printer tidak ditemukan pada perangkat ini.');
    }

    return this.device.name || 'Printer Bluetooth';
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      await this.connect();
    }

    // Send chunks to avoid Bluetooth buffer overflow (max 512 bytes per chunk)
    const chunkSize = 256;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValue(chunk);
    }
  }

  disconnect(): void {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }
}

export const bluetoothPrinter = new BluetoothPrinterDriver();
