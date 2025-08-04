use rustreexo::accumulator::{
    node_hash::{AccumulatorHash, BitcoinNodeHash},
    pollard::{Pollard, PollardAddition},
    proof::Proof,
    stump::Stump,
};
use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;
use wasm_bindgen::prelude::*;

// Error type for WASM API
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct UtreexoError {
    message: String,
}

#[wasm_bindgen]
impl UtreexoError {
    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }

    #[wasm_bindgen(js_name = toString)]
    pub fn to_string_js(&self) -> String {
        self.message.clone()
    }

    #[wasm_bindgen(js_name = valueOf)]
    pub fn value_of(&self) -> String {
        self.message.clone()
    }
}

impl fmt::Display for UtreexoError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl From<&str> for UtreexoError {
    fn from(message: &str) -> Self {
        Self {
            message: message.to_string(),
        }
    }
}

impl From<String> for UtreexoError {
    fn from(message: String) -> Self {
        Self { message }
    }
}

// Hash wrapper for WASM
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hash {
    inner: BitcoinNodeHash,
}

#[wasm_bindgen]
impl Hash {
    #[wasm_bindgen(constructor)]
    pub fn new(hex: &str) -> Result<Hash, UtreexoError> {
        let hash = BitcoinNodeHash::from_str(hex)
            .map_err(|e| UtreexoError::from(format!("Invalid hash: {}", e)))?;
        Ok(Hash { inner: hash })
    }

    #[wasm_bindgen]
    pub fn from_bytes(bytes: &[u8]) -> Result<Hash, UtreexoError> {
        if bytes.len() != 32 {
            return Err(UtreexoError::from("Hash must be exactly 32 bytes"));
        }

        let mut array = [0u8; 32];
        array.copy_from_slice(bytes);
        Ok(Hash {
            inner: BitcoinNodeHash::new(array),
        })
    }

    #[wasm_bindgen]
    pub fn to_hex(&self) -> String {
        self.inner.to_string()
    }

    #[wasm_bindgen]
    pub fn to_bytes(&self) -> Vec<u8> {
        self.inner.as_ref().to_vec()
    }

    #[wasm_bindgen]
    pub fn parent_hash(left: &Hash, right: &Hash) -> Hash {
        Hash {
            inner: BitcoinNodeHash::parent_hash(&left.inner, &right.inner),
        }
    }
}

// Stump wrapper for WASM (lightweight accumulator)
#[wasm_bindgen]
pub struct WasmStump {
    inner: Stump,
}

impl Default for WasmStump {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl WasmStump {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmStump {
        WasmStump {
            inner: Stump::new(),
        }
    }

    #[wasm_bindgen]
    pub fn from_json(json_str: &str) -> Result<WasmStump, UtreexoError> {
        let stump: Stump = serde_json::from_str(json_str)
            .map_err(|e| UtreexoError::from(format!("Failed to parse JSON: {}", e)))?;
        Ok(WasmStump { inner: stump })
    }

    #[wasm_bindgen]
    pub fn to_json(&self) -> Result<String, UtreexoError> {
        serde_json::to_string(&self.inner)
            .map_err(|e| UtreexoError::from(format!("Failed to serialize to JSON: {}", e)))
    }

    #[wasm_bindgen]
    pub fn num_leaves(&self) -> u64 {
        self.inner.leaves
    }

    #[wasm_bindgen]
    pub fn roots(&self) -> Vec<JsValue> {
        self.inner
            .roots
            .iter()
            .map(|root| {
                let hash = Hash { inner: *root };
                JsValue::from(hash.to_hex())
            })
            .collect()
    }

    #[wasm_bindgen]
    pub fn verify(&self, proof_json: &str, hashes: Vec<JsValue>) -> Result<bool, UtreexoError> {
        let proof: Proof<BitcoinNodeHash> = serde_json::from_str(proof_json)
            .map_err(|e| UtreexoError::from(format!("Failed to parse proof JSON: {}", e)))?;

        let del_hashes: Result<Vec<BitcoinNodeHash>, UtreexoError> = hashes
            .into_iter()
            .map(|js_val| {
                let hex_str = js_val
                    .as_string()
                    .ok_or_else(|| UtreexoError::from("Hash must be a string"))?;
                BitcoinNodeHash::from_str(&hex_str)
                    .map_err(|e| UtreexoError::from(format!("Invalid hash: {}", e)))
            })
            .collect();

        let del_hashes = del_hashes?;
        Ok(self.inner.verify(&proof, &del_hashes).is_ok())
    }

    #[wasm_bindgen]
    pub fn modify(
        &mut self,
        proof_json: &str,
        add_hashes: Vec<JsValue>,
        del_hashes: Vec<JsValue>,
    ) -> Result<(), JsValue> {
        let proof: Proof<BitcoinNodeHash> = serde_json::from_str(proof_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse proof JSON: {}", e)))?;

        let add_hashes: Result<Vec<BitcoinNodeHash>, JsValue> = add_hashes
            .into_iter()
            .map(|js_val| {
                let hex_str = js_val
                    .as_string()
                    .ok_or_else(|| JsValue::from_str("Hash must be a string"))?;
                BitcoinNodeHash::from_str(&hex_str)
                    .map_err(|e| JsValue::from_str(&format!("Invalid hash: {}", e)))
            })
            .collect();

        let del_hashes: Result<Vec<BitcoinNodeHash>, JsValue> = del_hashes
            .into_iter()
            .map(|js_val| {
                let hex_str = js_val
                    .as_string()
                    .ok_or_else(|| JsValue::from_str("Hash must be a string"))?;
                BitcoinNodeHash::from_str(&hex_str)
                    .map_err(|e| JsValue::from_str(&format!("Invalid hash: {}", e)))
            })
            .collect();

        let add_hashes = add_hashes?;
        let del_hashes = del_hashes?;

        let (new_stump, _update_data) = self
            .inner
            .modify(&add_hashes, &del_hashes, &proof)
            .map_err(|e| JsValue::from_str(&format!("Failed to modify stump: {}", e)))?;

        // Update the inner stump with the new state
        self.inner = new_stump;

        Ok(())
    }
}

// Pollard wrapper for WASM (full accumulator)
#[wasm_bindgen]
pub struct WasmPollard {
    inner: Pollard<BitcoinNodeHash>,
}

impl Default for WasmPollard {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl WasmPollard {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmPollard {
        WasmPollard {
            inner: Pollard::new(),
        }
    }

    #[wasm_bindgen]
    pub fn from_roots(roots: Vec<JsValue>, leaves: u64) -> Result<WasmPollard, UtreexoError> {
        let root_hashes: Result<Vec<BitcoinNodeHash>, UtreexoError> = roots
            .into_iter()
            .map(|js_val| {
                let hex_str = js_val
                    .as_string()
                    .ok_or_else(|| UtreexoError::from("Root hash must be a string"))?;
                BitcoinNodeHash::from_str(&hex_str)
                    .map_err(|e| UtreexoError::from(format!("Invalid root hash: {}", e)))
            })
            .collect();

        let root_hashes = root_hashes?;
        let pollard = Pollard::from_roots(root_hashes, leaves);
        Ok(WasmPollard { inner: pollard })
    }

    #[wasm_bindgen]
    pub fn num_leaves(&self) -> u64 {
        self.inner.leaves()
    }

    #[wasm_bindgen]
    pub fn roots(&self) -> Vec<JsValue> {
        self.inner
            .roots()
            .iter()
            .map(|root| {
                let hash = Hash { inner: *root };
                JsValue::from(hash.to_hex())
            })
            .collect()
    }

    #[wasm_bindgen]
    pub fn batch_proof(&self, target_hashes: Vec<JsValue>) -> Result<String, UtreexoError> {
        let hashes: Result<Vec<BitcoinNodeHash>, UtreexoError> = target_hashes
            .into_iter()
            .map(|js_val| {
                let hex_str = js_val
                    .as_string()
                    .ok_or_else(|| UtreexoError::from("Hash must be a string"))?;
                BitcoinNodeHash::from_str(&hex_str)
                    .map_err(|e| UtreexoError::from(format!("Invalid hash: {}", e)))
            })
            .collect();

        let hashes = hashes?;
        let proof = self
            .inner
            .batch_proof(&hashes)
            .map_err(|e| UtreexoError::from(format!("Failed to generate proof: {}", e)))?;

        serde_json::to_string(&proof)
            .map_err(|e| UtreexoError::from(format!("Failed to serialize proof: {}", e)))
    }

    #[wasm_bindgen]
    pub fn prove_single(&self, leaf_hash: &str) -> Result<String, UtreexoError> {
        let hash = BitcoinNodeHash::from_str(leaf_hash)
            .map_err(|e| UtreexoError::from(format!("Invalid hash: {}", e)))?;

        let proof = self
            .inner
            .prove_single(hash)
            .map_err(|e| UtreexoError::from(format!("Failed to generate proof: {}", e)))?;

        serde_json::to_string(&proof)
            .map_err(|e| UtreexoError::from(format!("Failed to serialize proof: {}", e)))
    }

    #[wasm_bindgen]
    pub fn verify(&self, proof_json: &str, hashes: Vec<JsValue>) -> Result<bool, UtreexoError> {
        let proof: Proof<BitcoinNodeHash> = serde_json::from_str(proof_json)
            .map_err(|e| UtreexoError::from(format!("Failed to parse proof JSON: {}", e)))?;

        let del_hashes: Result<Vec<BitcoinNodeHash>, UtreexoError> = hashes
            .into_iter()
            .map(|js_val| {
                let hex_str = js_val
                    .as_string()
                    .ok_or_else(|| UtreexoError::from("Hash must be a string"))?;
                BitcoinNodeHash::from_str(&hex_str)
                    .map_err(|e| UtreexoError::from(format!("Invalid hash: {}", e)))
            })
            .collect();

        let del_hashes = del_hashes?;
        Ok(self.inner.verify(&proof, &del_hashes).is_ok())
    }

    #[wasm_bindgen]
    pub fn modify(
        &mut self,
        proof_json: &str,
        additions_json: &str,
        del_hashes: Vec<JsValue>,
    ) -> Result<(), JsValue> {
        let proof: Proof<BitcoinNodeHash> = serde_json::from_str(proof_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse proof JSON: {}", e)))?;

        // Parse additions as JSON array of {hash: string, remember: boolean}
        let additions: Vec<serde_json::Value> = serde_json::from_str(additions_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse additions JSON: {}", e)))?;

        let add_items: Result<Vec<PollardAddition<BitcoinNodeHash>>, JsValue> = additions
            .into_iter()
            .map(|item| {
                let hash_str = item["hash"].as_str().ok_or_else(|| {
                    JsValue::from_str("Addition must have 'hash' field as string")
                })?;
                let remember = item["remember"].as_bool().unwrap_or(true); // Default to remembering

                let hash = BitcoinNodeHash::from_str(hash_str)
                    .map_err(|e| JsValue::from_str(&format!("Invalid hash in addition: {}", e)))?;

                Ok(PollardAddition { hash, remember })
            })
            .collect();

        let del_hashes: Result<Vec<BitcoinNodeHash>, JsValue> = del_hashes
            .into_iter()
            .map(|js_val| {
                let hex_str = js_val
                    .as_string()
                    .ok_or_else(|| JsValue::from_str("Hash must be a string"))?;
                BitcoinNodeHash::from_str(&hex_str)
                    .map_err(|e| JsValue::from_str(&format!("Invalid hash: {}", e)))
            })
            .collect();

        let add_items = add_items?;
        let del_hashes = del_hashes?;

        self.inner
            .modify(&add_items, &del_hashes, proof)
            .map_err(|e| JsValue::from_str(&format!("Failed to modify pollard: {}", e)))?;

        Ok(())
    }
}

// Utility functions
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
