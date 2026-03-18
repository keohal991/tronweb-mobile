import { SIGN_TIMEOUT } from './constants';
import state from './state';

// --- Unique callback ID generator (avoid global callback conflicts) ---
let _cbId = 0;
function genCallbackId(prefix) {
    return `__${prefix}_${++_cbId}_${Date.now()}__`;
}

// --- Settled promise helper with timeout & auto-cleanup ---
function withNativeCallback(timeoutMs, invokeFn) {
    return new Promise((resolve, reject) => {
        const cbName = genCallbackId('cb');
        const errName = 'onerror';
        let settled = false;

        const origOnError = window.onerror;
        const cleanup = () => {
            delete window[cbName];
            window.onerror = origOnError;
        };

        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error('Request timed out.'));
        }, timeoutMs);

        window[cbName] = function (result) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            cleanup();
            resolve(result);
        };

        window[errName] = function (errMsg) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            cleanup();
            reject(errMsg);
        };

        invokeFn(cbName, errName);
    });
}

// --- Transaction / message signing ---
export function proxySignTransaction(transaction, cb, type) {
    const { tronWeb } = state;
    const isString = Object.prototype.toString.call(transaction) === '[object String]';
    let transStr = transaction;
    let signMessageType = '1';

    if (!isString) {
        if (type === 'signMessageV2') {
            signMessageType = '3';
            transStr = transaction.toString();
        } else {
            transStr = JSON.stringify(transaction);
        }
    } else {
        if (type === 'signMessageV2' && tronWeb && tronWeb.utils.isHex(transStr)) {
            signMessageType = '1';
        }
    }

    const promise = withNativeCallback(SIGN_TIMEOUT, (cbName, errName) => {
        if (type === 'signMessageV2') {
            window.iTron.signMessageV2(transStr, cbName, signMessageType);
        } else {
            window.iTron.sign(transStr, cbName);
        }
    });

    return promise.then((sinTransStr) => {
        if (isString || type === 'signMessageV2') {
            if (cb) { cb(null, sinTransStr); return sinTransStr; }
            return sinTransStr;
        }
        return JSON.parse(sinTransStr);
    }, (err) => {
        if (cb) { cb(err); return; }
        throw err;
    });
}

// --- EIP-712 typed data ---
function getEIP712Data(domain, types, value) {
    const domainFieldTypes = {
        name: 'string',
        version: 'string',
        chainId: 'uint256',
        verifyingContract: 'address',
        salt: 'bytes32',
    };
    const domainFieldNames = ['name', 'version', 'chainId', 'verifyingContract', 'salt'];
    const domainValues = {};
    const domainTypes = [];

    domainFieldNames.forEach((name) => {
        const v = domain[name];
        if (v == null) return;
        domainValues[name] = v;
        domainTypes.push({ name, type: domainFieldTypes[name] });
    });

    return {
        types: { ...types, EIP712Domain: domainTypes },
        domain: domainValues,
        primaryType: state.utils._TypedDataEncoder.getPrimaryType(types),
        message: value,
    };
}

export function proxySignTypedData(domain, types, value) {
    const transStr = JSON.stringify(getEIP712Data(domain, types, value));

    return withNativeCallback(SIGN_TIMEOUT, (cbName, errName) => {
        window.iTron.sign(transStr, cbName);
    });
}

// --- Apply sign proxies to a trx object ---
export function applySignProxy(trxObj) {
    trxObj.sign = proxySignTransaction;
    trxObj.signTransaction = proxySignTransaction;
    trxObj.multiSign = proxySignTransaction;
    trxObj.signMessageV2 = function (transaction, cb) {
        return proxySignTransaction(transaction, cb, 'signMessageV2');
    };
    trxObj._signTypedData = proxySignTypedData;
}
