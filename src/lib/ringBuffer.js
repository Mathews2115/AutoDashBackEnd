// Queue of Uint8s
class RingBuffer {
    /**
   * @param {Buffer} buffer
   */
    constructor(buffer) {
      /** @type {Buffer} */
      this.buffer = buffer;
      this.buffer.fill(0);
      this.frontOffset = 0; // where the current front of the buffer is - will wrap around when it his the length of the buffer
      this.length = 0; // curent length of the filled buffer; wwill cap at the buffer.length
    }

    get average() {
      let sum = 0;
      //  minor optimization for smaller buffers: 
      //  If the ring buffer hasnt been filled out, then that means the index offset is still zero, 
      //  so we only want to iterate over the filled out buffer and not waste time on the unfilled part
      const length = Math.min(this.buffer.length - 1, this.length-1);
      for (let i = 0; i < length; i++) {
        sum += this.buffer.readUInt8(i);
      }
      return sum / length;
    }

    /**
   * @param {Number} value
   */
    push(value) {
        this.buffer.writeUInt8(value, this.frontOffset);
        this.frontOffset++;
        this.length = Math.min(this.length + 1, this.buffer.length);
        if (this.frontOffset > this.buffer.length - 1) {
            this.frontOffset = 0;
        }
    }

    front() {
      return this.buffer.readUInt8(this.frontOffset);
    }

    reset() {
      this.length = 0;
      this.buffer.fill(0);
      this.frontOffset = 0;
    }
}

export default RingBuffer;