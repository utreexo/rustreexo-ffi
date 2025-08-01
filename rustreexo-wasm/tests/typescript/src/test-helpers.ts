/**
 * Test helpers for loading WASM modules across different targets
 */

export async function loadWasmModule(target: string = 'nodejs'): Promise<any> {
  try {
    switch (target) {
      case 'web': {
        const module = await import('../../../pkg-web/rustreexo_wasm.js');
        // Web target needs explicit WASM initialization
        const wasmUrl = new URL('../../../pkg-web/rustreexo_wasm_bg.wasm', import.meta.url);
        await module.default(wasmUrl);
        return module;
      }
      
      case 'bundler': {
        const module = await import('../../../pkg-bundler/rustreexo_wasm.js');
        // Bundler target may need initialization
        if (module.default && typeof module.default === 'function') {
          await module.default();
        }
        return module;
      }
      
      case 'nodejs':
      default: {
        // Node.js target works out of the box
        return await import('../../../pkg-node/rustreexo_wasm.js');
      }
    }
  } catch (error) {
    console.error(`Failed to load WASM module for target ${target}:`, error);
    throw error;
  }
}

export function isTestEnvironmentCompatible(target: string): boolean {
  switch (target) {
    case 'nodejs':
      return typeof process !== 'undefined' && process.versions && process.versions.node;
    
    case 'web':
      return typeof window !== 'undefined' || typeof self !== 'undefined';
    
    case 'bundler':
      return true; // Bundler target should work in most environments
    
    default:
      return false;
  }
}