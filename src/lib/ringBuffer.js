// Queue of Uint8s
class RingBuffer {
    /**
   * @param {Buffer} buffer
   */
    constructor(buffer) {
      /** @type {Buffer} */
      this.buffer = buffer;
      this.buffer.fill(0);
      this.frontOffset = 0;
    }

    get average() {
      let sum = 0;
      const length = this.buffer.length - 1;
      for (let i = 0; i < length; i++) {
        sum += this.buffer.readUInt8(i);
      }
      return sum / this.buffer.length;
    }

    /**
   * @param {Number} value
   */
    push(value) {
        this.buffer.writeUInt8(value, this.frontOffset);
        this.frontOffset++;
        if (this.frontOffset > this.buffer.length - 1) {
            this.frontOffset = 0;
        }
    }

    front() {
      return this.buffer.readUInt8(this.frontOffset);
    }

    legnth() {
      return this.buffer.length;
    }
}

export default RingBuffer;