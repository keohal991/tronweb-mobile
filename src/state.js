import EventEmitter from 'eventemitter3';

// Shared mutable state across all modules
const state = {
    tronWeb: null,
    utils: null,       // TronWeb utils (for EIP712 etc.)
    cNetwork: '',      // current network name: 'MainNet' | 'NileNet' | 'ShastaNet'
    httpUrl: '',       // current full node HTTP URL
    connected: false,  // whether a DApp has connected
    ee: new EventEmitter(),
};

export default state;
