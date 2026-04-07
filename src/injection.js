import { version } from '../package.json';
import { ChainIds, RPC_ERRORS, netWorks, SIGN_TIMEOUT } from './constants';
import state from './state';

let _cbId = 0;
function genCallbackId(prefix) {
    return `__${prefix}_${++_cbId}_${Date.now()}__`;
}

// --- Core injection: set address on all providers ---
export function injectTronWeb(addr) {
    const { tronWeb } = state;
    const address = addr || (window.iTron ? window.iTron.getCurrentAccount() : '');
    if (!address) return;

    tronWeb.setAddress(address);
    tronWeb.ready = true;
    tronWeb.version = version;
    window.tronWeb = tronWeb;

    window.tronLink.tronWeb = tronWeb;
    window.tronLink.ready = true;

    window.tron.tronWeb = tronWeb;
    window.tron.ready = true;
    state.connected = true;

    if (address) {
        state.ee.emit('connect', { chainId: ChainIds[state.cNetwork] });
    }
}

// --- Account request (used by both tronLink and tron providers) ---
export function requestAccount(type) {
    return new Promise((resolve, reject) => {
        const cbName = genCallbackId('reqAddr');
        let settled = false;

        const cleanup = () => {
            delete window[cbName];
        };

        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error('Request timed out.'));
        }, SIGN_TIMEOUT);

        window[cbName] = function (address) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            cleanup();

            const { tronWeb } = state;
            if (tronWeb.isAddress(address)) {
                injectTronWeb(address);
                if (type === 'tron') {
                    resolve([address]);
                } else {
                    resolve({ code: 200, message: 'User allowed the request.' });
                }
            } else {
                reject(RPC_ERRORS.USER_REJECTED);
            }
        };

        if (window.iTron && window.iTron.requestAddress) {
            try {
                window.iTron.requestAddress(cbName);
            } catch (e) {
                settled = true;
                clearTimeout(timer);
                cleanup();
                reject(e);
            }
        } else {
            settled = true;
            clearTimeout(timer);
            cleanup();
            reject(new Error('unknown error'));
        }
    });
}

