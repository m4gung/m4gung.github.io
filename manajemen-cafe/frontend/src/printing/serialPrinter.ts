/**
 * Web Serial / USB Thermal Printer Driver
 */
export class SerialPrinterDriver {
  private port: any = null;

  async isSupported(): Promise<boolean> {
    return 'serial' in navigator;
  }

  async connect(): Promise<string> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial tidak didukung di browser ini. Gunakan Google Chrome desktop.');
    }

    const nav = navigator as any;
    this.port = await nav.serial.requestPort();
    await this.port.open({ baudRate: 9600 });
    return 'Thermal Printer USB/Serial';
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.port) {
      await this.connect();
    }

    const writer = this.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  async disconnect(): Promise<void> {
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }
}

export const serialPrinter = new SerialPrinterDriver();
