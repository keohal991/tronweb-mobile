import state from '../src/state';
import { injectTronWeb, requestAccount } from '../src/injection';
import { ChainIds, netWorks } from '../src/constants';

beforeEach(() => {
    // Reset state
    const { TronWeb } = require('../dist/TronWeb');
    state.tronWeb = new TronWeb({ fullNode: {}, solidityNode: {}, eventServer: {} });
    state.cNetwork = 'MainNet';
    state.httpUrl = netWorks.MainNet;
    state.connected = false;
    state.ee.removeAllListeners();

    // Set up minimal window.tronLink and window.tron
    window.tronLink = { ready: false };
    window.tron = { ready: false };

    window.iTron = {
        getCurrentAccount: jest.fn(() => 'TAddr1234567890'),
        requestAddress: jest.fn((cbName) => {
            setTimeout(() => window[cbName]('TNewAddr999'), 10);
        }),
    };
});

afterEach(() => {
    delete window.iTron;
    delete window.tronWeb;
    delete window.onRequestAddressCallBack;
});

describe('injectTronWeb', () => {
    test('sets address and ready state when given an address', () => {
        injectTronWeb('TTestAddr');
        expect(state.tronWeb.defaultAddress.base58).toBe('TTestAddr');
        expect(state.tronWeb.ready).toBe(true);
        expect(window.tronWeb).toBe(state.tronWeb);
        expect(window.tronLink.ready).toBe(true);
        expect(window.tron.ready).toBe(true);
        expect(state.connected).toBe(true);
    });

    test('falls back to iTron.getCurrentAccount when no address given', () => {
        injectTronWeb();
        expect(window.iTron.getCurrentAccount).toHaveBeenCalled();
        expect(state.tronWeb.defaultAddress.base58).toBe('TAddr1234567890');
    });

    test('does nothing if no address available', () => {
        window.iTron.getCurrentAccount = jest.fn(() => '');
        injectTronWeb();
        expect(state.tronWeb.ready).toBeFalsy();
    });

    test('emits connect event when address is provided', () => {
        const handler = jest.fn();
        state.ee.on('connect', handler);
        injectTronWeb('TTestAddr');
        expect(handler).toHaveBeenCalledWith({ chainId: ChainIds.MainNet });
    });
});

describe('requestAccount', () => {
    test('tronLink type resolves with code 200', async () => {
        const result = await requestAccount('tronLink');
        expect(result).toEqual({ code: 200, message: 'User allowed the request.' });
    });

    test('tron type resolves with address array', async () => {
        const result = await requestAccount('tron');
        expect(result).toEqual(['TNewAddr999']);
    });

    test('rejects with USER_REJECTED for invalid address', async () => {
        window.iTron.requestAddress = jest.fn((cbName) => {
            setTimeout(() => window[cbName]('invalid'), 10);
        });
        await expect(requestAccount('tron')).rejects.toEqual(
            expect.objectContaining({ code: 4001 })
        );
    });
});


