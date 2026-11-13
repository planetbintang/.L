/** Deterministic binary helpers; deliberately no dynamic code execution. */
export function toBits(value,width=8){if(!Number.isSafeInteger(value)||value<0)throw new TypeError("non-negative safe integer required");if(!Number.isInteger(width)||width<1||width>256)throw new RangeError("width must be 1..256");return BigInt(value).toString(2).padStart(width,"0").slice(-width)}
export function fromBits(bits){if(typeof bits!=="string"||!/^[01]+$/.test(bits)||bits.length>256)throw new TypeError("invalid binary string");return BigInt("0b"+bits)}
export function xorBits(a,b){return(fromBits(a)^fromBits(b)).toString(2).padStart(Math.max(a.length,b.length),"0")}
export function andBits(a,b){return(fromBits(a)&fromBits(b)).toString(2).padStart(Math.max(a.length,b.length),"0")}
export function orBits(a,b){return(fromBits(a)|fromBits(b)).toString(2).padStart(Math.max(a.length,b.length),"0")}
export function checksum(text){let h=2166136261;for(const b of new TextEncoder().encode(String(text)))h=Math.imul(h^b,16777619)>>>0;return h.toString(16).padStart(8,"0")}
