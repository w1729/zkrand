pragma circom 2.1.4;

include "node_modules/circomlib/circuits/poseidon.circom";

template PoseidonSignature() {
    // Public inputs
    signal input public_key;
    signal input message_hash;
    
    // Private input
    signal input private_key;
    
    // Output signals
    signal output signature[2];
    
    // Components
    component hash1 = Poseidon(1);
    component hash2_1 = Poseidon(2);
    component hash2_2 = Poseidon(2);
    component hash3_1 = Poseidon(3);
    component hash3_2 = Poseidon(3);
    
    // Verify public key derivation
    hash1.inputs[0] <== private_key;
    public_key === hash1.out;
    
    // Calculate first part of signature
    hash3_1.inputs[0] <== private_key;
    hash3_1.inputs[1] <== message_hash;
    hash3_1.inputs[2] <== 0;
    
    hash2_1.inputs[0] <== private_key;
    hash2_1.inputs[1] <== hash3_1.out;
    
    signature[0] <== hash2_1.out;
    
    // Calculate second part of signature
    hash3_2.inputs[0] <== private_key;
    hash3_2.inputs[1] <== message_hash;
    hash3_2.inputs[2] <== 1;
    
    hash2_2.inputs[0] <== private_key;
    hash2_2.inputs[1] <== hash3_2.out;
    
    signature[1] <== hash2_2.out;
}

component main { public [public_key, message_hash] } = PoseidonSignature();

/* Test vector for verification:
Input values:
private_key: 0x01c8bdf6686d4c8ba09db5f15ffee3c470a5e0ff54d6fbac3a548f9a666977
public_key: 0x15d76b9641dc1e52de6f9530a4161f077c348b1329efaeb0e052f13b5bf1ce49
message_hash: 0x003f46cee85de01c829c15a96765a024b48687825bca602b2124485dad9612a4

Expected outputs:
signature[0]: 0x1936f2209a2b048aa72fac77d56b9627a870449cf357de9744a54dafa0be8202
signature[1]: 0x25f0e32ce893cadb55ac7483237e554b03659b4498afe9d9d977e094ab1d68d1
*/