// ================================================================
// ------------------------- WASM LOADER --------------------------
// ================================================================

let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;

/**
 * Initialize WASM module
 * @returns true if initialization was successful
 */
export async function initWasm(): Promise<boolean> {
  if (wasmInstance) return true;

  try {
    const response = await fetch("/wasm/release.wasm");
    const wasmBuffer = await response.arrayBuffer();

    wasmMemory = new WebAssembly.Memory({
      initial: 256, // 16MB initial
      maximum: 1024, // 64MB max
    });

    const importObject = {
      env: {
        memory: wasmMemory,
        abort: (_msg: number, _file: number, line: number, column: number) => {
          console.error(`WASM abort at ${line}:${column}`);
        },
      },
    };

    const result = await WebAssembly.instantiate(wasmBuffer, importObject);
    wasmInstance = result.instance;

    console.log("WASM module loaded successfully");
    return true;
  } catch (error) {
    console.error("Failed to load WASM module:", error);
    return false;
  }
}

/**
 * Check if WASM is available
 */
export function isWasmAvailable(): boolean {
  return wasmInstance !== null;
}

/**
 * Get WASM instance (throws if not initialized)
 */
export function getWasmInstance(): WebAssembly.Instance {
  if (!wasmInstance) throw new Error("WASM not initialized");
  return wasmInstance;
}

/**
 * Get WASM memory (throws if not initialized)
 */
export function getWasmMemory(): WebAssembly.Memory {
  if (!wasmMemory) throw new Error("WASM not initialized");
  return wasmMemory;
}

/**
 * Ensure WASM memory is large enough for the required bytes
 */
export function ensureMemory(requiredBytes: number): void {
  if (!wasmMemory) return;

  const currentBytes = wasmMemory.buffer.byteLength;
  if (requiredBytes > currentBytes) {
    const pagesNeeded = Math.ceil((requiredBytes - currentBytes) / 65536);
    wasmMemory.grow(pagesNeeded);
  }
}
