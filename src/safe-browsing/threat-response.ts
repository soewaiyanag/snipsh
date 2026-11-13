// Google answers in protobuf, a binary format made of fields. Each field starts with a
// "tag" (field number + wire type) and we only need to know if field 1 (threats) exists.
const THREATS_FIELD_NUMBER = 1;
const WIRE_TYPE_VARINT = 0;
const WIRE_TYPE_LENGTH_DELIMITED = 2;
const WIRE_TYPE_BITS = 3;
const WIRE_TYPE_MASK = 0b111;
const VARINT_PAYLOAD_MASK = 0x7f;
const VARINT_CONTINUE_FLAG = 0x80;
const VARINT_PAYLOAD_BITS = 7;

function readVarint(bytes: Uint8Array, start: number) {
  let value = 0;
  let shift = 0;
  let position = start;
  while (position < bytes.length) {
    const byte = bytes[position++];
    // multiplying avoids the 32-bit limit of the << operator
    value += (byte & VARINT_PAYLOAD_MASK) * 2 ** shift;
    if (!(byte & VARINT_CONTINUE_FLAG)) {
      return { value, next: position };
    }
    shift += VARINT_PAYLOAD_BITS;
  }
  throw new Error('Safe Browsing answer ended inside a number');
}

export function hasThreats(bytes: Uint8Array): boolean {
  let position = 0;
  while (position < bytes.length) {
    const tag = readVarint(bytes, position);
    const fieldNumber = Math.floor(tag.value / 2 ** WIRE_TYPE_BITS);
    const wireType = tag.value & WIRE_TYPE_MASK;
    position = tag.next;

    if (fieldNumber === THREATS_FIELD_NUMBER) {
      return true;
    }
    if (wireType === WIRE_TYPE_VARINT) {
      position = readVarint(bytes, position).next;
    } else if (wireType === WIRE_TYPE_LENGTH_DELIMITED) {
      const length = readVarint(bytes, position);
      position = length.next + length.value;
      if (position > bytes.length) {
        throw new Error('Safe Browsing answer was cut off');
      }
    } else {
      throw new Error(
        `Unexpected wire type ${wireType} in Safe Browsing answer`,
      );
    }
  }
  return false;
}
