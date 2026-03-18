import state from '../src/state';
import { ChainIds, RPC_ERRORS } from '../src/constants';
import { setupTronLinkProvider, setupTronProvider } from '../src/providers';

beforeEach(() => {
    const { TronWeb } = require('../dist/TronWeb');
    state.tronWeb = new TronWeb({ fullNode: {}, solidityNode: {}, eventServer: {} });
    state.tronWeb.setAddress('TProviderAddr');
    state.cNetwork = 'MainNet';
    state.connected = true;
    state.ee.removeAllListeners();

    window.iTron = {
        requestAddress: jest.fn((cbName) => {
            setTimeout(() => window[cbName]('TProviderAddr'), 10);
        }),
    };

    setupTronLinkProvider();
    setupTronProvider();
});

afterEach(() => {
    delete window.iTron;
    delete window.tronLink;
    delete window.tron;
    delete window.tronWeb;
    delete window.onRequestAddressCallBack;
});

describe('window.tronLink', () => {
    test('has initial ready false', () => {
        expect(window.tronLink.ready).toBe(false);
    });

    test('tron_requestAccounts resolves on valid address', async () => {
        const result = await window.tronLink.request({ method: 'tron_requestAccounts' });
        expect(result).toEqual({ code: 200, message: 'User allowed the request.' });
    });

    test('unsupported method rejects', async () => {
        await expect(
            window.tronLink.request({ method: 'unknown_method' })
        ).rejects.toEqual(RPC_ERRORS.UNSUPPORTED_METHOD);
    });
});

describe('window.tron', () => {
    test('has initial structure', () => {
        expect(window.tron.ready).toBe(false);
        expect(window.tron.isTronLink).toBe(true);
        expect(typeof window.tron.on).toBe('function');
        expect(typeof window.tron.removeListener).toBe('function');
        expect(typeof window.tron.isConnected).toBe('function');
    });

    test('isConnected returns state.connected', () => {
        state.connected = true;
        expect(window.tron.isConnected()).toBe(true);
        state.connected = false;
        expect(window.tron.isConnected()).toBe(false);
    });

    test('eth_requestAccounts resolves with address array', async () => {
        const result = await window.tron.request({ method: 'eth_requestAccounts' });
        expect(result).toEqual(['TProviderAddr']);
    });

    test('wallet_switchEthereumChain rejects invalid params', async () => {
        await expect(
            window.tron.request({ method: 'wallet_switchEthereumChain' })
        ).rejects.toEqual(RPC_ERRORS.INVALID_PARAMS);
    });

    test('wallet_switchEthereumChain rejects unknown chainId', async () => {
        await expect(
            window.tron.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xdeadbeef' }],
            })
        ).rejects.toEqual(RPC_ERRORS.INVALID_CHAIN);
    });

    test('wallet_switchEthereumChain rejects with UNSUPPORTED for valid chainId', async () => {
        await expect(
            window.tron.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ChainIds.NileNet }],
            })
        ).rejects.toEqual(RPC_ERRORS.UNSUPPORTED_METHOD);
    });

    test('unknown method rejects with UNSUPPORTED_METHOD', async () => {
        await expect(
            window.tron.request({ method: 'foo_bar' })
        ).rejects.toEqual(RPC_ERRORS.UNSUPPORTED_METHOD);
    });
});
