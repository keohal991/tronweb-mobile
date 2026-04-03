export const SIGN_TIMEOUT = 5 * 60 * 1000; // 5 min

export const RPC_ERRORS = Object.freeze({
    USER_REJECTED: Object.freeze({ code: 4001, message: 'User rejected the request.' }),
    UNAUTHORIZED: Object.freeze({ code: 4100, message: 'Unauthorized.' }),
    UNSUPPORTED_METHOD: Object.freeze({ code: 4200, message: 'Unsupported Method.' }),
    DISCONNECTED: Object.freeze({ code: 4900, message: 'Disconnected.' }),
    CHAIN_DISCONNECTED: Object.freeze({ code: 4901, message: 'Chain Disconnected.' }),
    INVALID_PARAMS: Object.freeze({ code: -32602, message: 'Invalid params.' }),
    INVALID_CHAIN: Object.freeze({ code: 4902, message: 'Unrecognized chain ID.' }),
});

export const netWorks = Object.freeze({
    MainNet: 'https://api.trongrid.io',
    NileNet: 'https://nile.trongrid.io',
    ShastaNet: 'https://api.shasta.trongrid.io',
});

export const ChainIds = Object.freeze({
    MainNet: '0x2b6653dc',
    NileNet: '0xcd8690dc',
    ShastaNet: '0x94a9059e',
});
