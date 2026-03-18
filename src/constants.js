export const SIGN_TIMEOUT = 5 * 60 * 1000; // 5 min

export const RPC_ERRORS = {
    USER_REJECTED: { code: 4001, message: 'User rejected the request.' },
    UNAUTHORIZED: { code: 4100, message: 'Unauthorized.' },
    UNSUPPORTED_METHOD: { code: 4200, message: 'Unsupported Method.' },
    DISCONNECTED: { code: 4900, message: 'Disconnected.' },
    CHAIN_DISCONNECTED: { code: 4901, message: 'Chain Disconnected.' },
    INVALID_PARAMS: { code: -32602, message: 'Invalid params.' },
    INVALID_CHAIN: { code: 4902, message: 'Unrecognized chain ID.' },
};

export const netWorks = {
    MainNet: 'https://api.trongrid.io',
    NileNet: 'https://nile.trongrid.io',
    ShastaNet: 'https://api.shasta.trongrid.io',
};

export const ChainIds = {
    MainNet: '0x2b6653dc',
    NileNet: '0xcd8690dc',
    ShastaNet: '0x94a9059e',
};
