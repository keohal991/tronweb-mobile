import { proxySignTransaction, proxySignTypedData, applySignProxy } from '../src/signing';
import state from '../src/state';
import { SIGN_TIMEOUT } from '../src/constants';

// Set up mock tronWeb in state
beforeEach(() => {
    state.tronWeb = {
        utils: { isHex: (v) => /^(0x)?[0-9a-fA-F]+$/.test(v) },
    };
    state.utils = {
        _TypedDataEncoder: {
            getPrimaryType: (types) => Object.keys(types).filter(k => k !== 'EIP712Domain')[0] || '',
        },
    };

    // Mock iTron on window
    window.iTron = {
        sign: jest.fn((data, cbName) => {
            // Simulate async native callback
            setTimeout(() => {
                if (window[cbName]) window[cbName](data);
            }, 10);
        }),
        signMessageV2: jest.fn((data, cbName, type) => {
            setTimeout(() => {
                if (window[cbName]) window[cbName]('signed_' + data);
            }, 10);
        }),
    };
});

afterEach(() => {
    delete window.iTron;
    // Clean up any leftover callbacks
    Object.keys(window).forEach((key) => {
        if (key.startsWith('__')) delete window[key];
    });
});

describe('proxySignTransaction', () => {
    test('signs a JSON transaction object', async () => {
        const tx = { txID: 'abc123', raw_data: {} };
        window.iTron.sign = jest.fn((data, cbName) => {
            setTimeout(() => window[cbName](JSON.stringify({ ...tx, signature: ['sig'] })), 5);
        });

        const result = await proxySignTransaction(tx);
        expect(result).toEqual({ ...tx, signature: ['sig'] });
        expect(window.iTron.sign).toHaveBeenCalledTimes(1);
    });

    test('signs a hex string directly', async () => {
        window.iTron.sign = jest.fn((data, cbName) => {
            setTimeout(() => window[cbName]('0xsigned'), 5);
        });

        const result = await proxySignTransaction('0xdeadbeef');
        expect(result).toBe('0xsigned');
    });

    test('signMessageV2 calls iTron.signMessageV2', async () => {
        const result = await proxySignTransaction('hello world', null, 'signMessageV2');
        expect(window.iTron.signMessageV2).toHaveBeenCalledTimes(1);
        expect(result).toBe('signed_hello world');
    });

    test('signMessageV2 with hex string sets type 1', async () => {
        await proxySignTransaction('0xabcdef', null, 'signMessageV2');
        const callArgs = window.iTron.signMessageV2.mock.calls[0];
        expect(callArgs[2]).toBe('1'); // signMessageType
    });

    test('signMessageV2 with non-hex string sets type 3', async () => {
        await proxySignTransaction(12345, null, 'signMessageV2');
        const callArgs = window.iTron.signMessageV2.mock.calls[0];
        expect(callArgs[2]).toBe('3'); // signMessageType
    });

    test('supports callback-style (cb parameter)', async () => {
        const cb = jest.fn();
        window.iTron.sign = jest.fn((data, cbName) => {
            setTimeout(() => window[cbName]('0xresult'), 5);
        });

        await proxySignTransaction('0xdata', cb);
        expect(cb).toHaveBeenCalledWith(null, '0xresult');
    });

    test('rejects on native error', async () => {
        window.iTron.sign = jest.fn((data, cbName) => {
            setTimeout(() => window.onerror('Sign failed'), 5);
        });

        await expect(proxySignTransaction({ txID: 'x' })).rejects.toBe('Sign failed');
    });

    test('uses unique callback names (no global conflicts)', async () => {
        const callbackNames = [];
        window.iTron.sign = jest.fn((data, cbName) => {
            callbackNames.push(cbName);
            setTimeout(() => window[cbName](data), 5);
        });

        await Promise.all([
            proxySignTransaction('0xaa'),
            proxySignTransaction('0xbb'),
        ]);

        expect(callbackNames[0]).not.toBe(callbackNames[1]);
    });

    test('cleans up window callbacks after resolve', async () => {
        const origOnError = window.onerror;
        let capturedCb;
        window.iTron.sign = jest.fn((data, cbName) => {
            capturedCb = cbName;
            setTimeout(() => window[cbName]('ok'), 5);
        });

        await proxySignTransaction('0xdata');
        expect(window[capturedCb]).toBeUndefined();
        expect(window.onerror).toBe(origOnError);
    });
});



describe('proxySignTypedData', () => {
    test('constructs EIP712 data and signs', async () => {
        window.iTron.sign = jest.fn((data, cbName) => {
            const parsed = JSON.parse(data);
            expect(parsed.primaryType).toBe('Mail');
            expect(parsed.types).toHaveProperty('EIP712Domain');
            setTimeout(() => window[cbName]('0xtyped_sig'), 5);
        });

        const domain = { name: 'Test', version: '1', chainId: 1 };
        const types = { Mail: [{ name: 'contents', type: 'string' }] };
        const value = { contents: 'Hello' };

        const result = await proxySignTypedData(domain, types, value);
        expect(result).toBe('0xtyped_sig');
    });

    test('EIP712 domain skips null fields', async () => {
        window.iTron.sign = jest.fn((data, cbName) => {
            const parsed = JSON.parse(data);
            expect(parsed.domain).not.toHaveProperty('salt');
            expect(parsed.domain).toHaveProperty('name');
            setTimeout(() => window[cbName]('sig'), 5);
        });

        const domain = { name: 'X', salt: null };
        const types = { Foo: [{ name: 'a', type: 'uint256' }] };
        await proxySignTypedData(domain, types, { a: 1 });
    });
});

describe('applySignProxy', () => {
    test('replaces all signing methods on trx object', () => {
        const trx = {
            sign: null, signTransaction: null,
            multiSign: null, signMessageV2: null,
            _signTypedData: null,
        };

        applySignProxy(trx);

        expect(trx.sign).toBe(proxySignTransaction);
        expect(trx.signTransaction).toBe(proxySignTransaction);
        expect(trx.multiSign).toBe(proxySignTransaction);
        expect(typeof trx.signMessageV2).toBe('function');
        expect(trx._signTypedData).toBe(proxySignTypedData);
    });
});
