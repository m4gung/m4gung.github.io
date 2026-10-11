/**
 * ESC/POS Command Generator for 58mm & 80mm Thermal Receipt Printers
 */
export class EscposBuilder {
  private buffer: number[] = [];
  private readonly maxChars: number;

  constructor(paperWidth: 58 | 80 = 58) {
    this.maxChars = paperWidth === 80 ? 48 : 32;
    this.init();
  }

  init(): this {
    // ESC @ - Initialize printer
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  align(alignment: 'left' | 'center' | 'right'): this {
    // ESC a n
    const code = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1B, 0x61, code);
    return this;
  }

  bold(enable: boolean = true): this {
    // ESC E n
    this.buffer.push(0x1B, 0x45, enable ? 1 : 0);
    return this;
  }

  doubleSize(enable: boolean = true): this {
    // GS ! n (0x11 for double width & height, 0x00 for normal)
    this.buffer.push(0x1D, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (const b of bytes) {
      this.buffer.push(b);
    }
    return this;
  }

  line(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0A); // LF
    return this;
  }

  divider(): this {
    this.align('center');
    this.line('-'.repeat(this.maxChars));
    this.align('left');
    return this;
  }

  twoColumn(left: string, right: string): this {
    const spaceCount = this.maxChars - left.length - right.length;
    if (spaceCount <= 0) {
      // Potong jika terlalu panjang
      const truncatedLeft = left.substring(0, Math.max(1, this.maxChars - right.length - 1));
      const spaces = ' '.repeat(Math.max(1, this.maxChars - truncatedLeft.length - right.length));
      this.line(truncatedLeft + spaces + right);
    } else {
      this.line(left + ' '.repeat(spaceCount) + right);
    }
    return this;
  }

  feed(lines: number = 3): this {
    // ESC d n
    this.buffer.push(0x1B, 0x64, lines);
    return this;
  }

  cut(): this {
    // GS V 66 0 - Partial cut with paper feed
    this.buffer.push(0x1D, 0x56, 0x42, 0x00);
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
