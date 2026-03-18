import { ChainIds, RPC_ERRORS } from './constants';
import state from './state';
import { requestAccount } from './injection';

// --- window.tronLink (TronLink-compatible provider) ---
export function setupTronLinkProvider() {
    window.tronLink = {
        ready: false,
        request: async function ({ method }) {
            if (method === 'tron_requestAccounts') {
                return requestAccount('tronLink');
            }
            return Promise.reject(RPC_ERRORS.UNSUPPORTED_METHOD);
        },
    };
}

// --- window.tron (EIP-1193 style provider) ---
export function setupTronProvider() {
    const { ee } = state;

    window.tron = {
        ready: false,
        isTronLink: true,

        // EventEmitter (bound to avoid this-context issues)
        on: ee.on.bind(ee),
        removeListener: ee.removeListener.bind(ee),
        emit: ee.emit.bind(ee),
        _events: ee._events,

        isConnected: function () {
            return state.connected;
        },

        request: async function ({ method, params }) {
            switch (method) {
                case 'eth_requestAccounts':
                    return requestAccount('tron');

                case 'wallet_switchEthereumChain': {
                    if (!params || !params[0] || !params[0].chainId) {
                        return Promise.reject(RPC_ERRORS.INVALID_PARAMS);
                    }
                    const targetChainId = params[0].chainId;
                    if (Object.values(ChainIds).indexOf(targetChainId) === -1) {
                        return Promise.reject(RPC_ERRORS.INVALID_CHAIN);
                    }
                    return Promise.reject(RPC_ERRORS.UNSUPPORTED_METHOD);
                }

                default:
                    return Promise.reject(RPC_ERRORS.UNSUPPORTED_METHOD);
            }
        },
    };
}
