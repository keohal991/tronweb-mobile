import { setupTip6963 } from '../src/tip6963';

describe('TIP-6963', () => {
    let mockProvider;
    let teardown;

    beforeEach(() => {
        mockProvider = {
            request: jest.fn(),
            on: jest.fn(),
        };
    });

    afterEach(() => {
        if (teardown) teardown();
        teardown = null;
    });

    test('dispatches TIP6963:announceProvider on setup', () => {
        const handler = jest.fn();
        window.addEventListener('TIP6963:announceProvider', handler);
        teardown = setupTip6963(mockProvider);
        window.removeEventListener('TIP6963:announceProvider', handler);

        expect(handler).toHaveBeenCalledTimes(1);
        const detail = handler.mock.calls[0][0].detail;
        expect(detail.info.name).toBe('TronLink');
        expect(detail.info.rdns).toBe('io.tronlink');
        expect(detail.provider).toBe(mockProvider);
    });



    test('info object is frozen', () => {
        const handler = jest.fn();
        window.addEventListener('TIP6963:announceProvider', handler);
        teardown = setupTip6963(mockProvider);
        window.removeEventListener('TIP6963:announceProvider', handler);

        const detail = handler.mock.calls[0][0].detail;
        expect(Object.isFrozen(detail)).toBe(true);
        expect(Object.isFrozen(detail.info)).toBe(true);
    });

    test('info has a valid uuid', () => {
        const handler = jest.fn();
        window.addEventListener('TIP6963:announceProvider', handler);
        teardown = setupTip6963(mockProvider);
        window.removeEventListener('TIP6963:announceProvider', handler);

        const { uuid } = handler.mock.calls[0][0].detail.info;
        expect(typeof uuid).toBe('string');
        expect(uuid.length).toBeGreaterThan(0);
    });

    test('re-announces on TIP6963:requestProvider', () => {
        const handler = jest.fn();
        window.addEventListener('TIP6963:announceProvider', handler);
        teardown = setupTip6963(mockProvider);

        // Should have been called once on setup
        expect(handler).toHaveBeenCalledTimes(1);

        // Trigger re-request
        window.dispatchEvent(new Event('TIP6963:requestProvider'));
        expect(handler).toHaveBeenCalledTimes(2);

        window.removeEventListener('TIP6963:announceProvider', handler);
    });



    test('teardown removes event listeners', () => {
        const handler = jest.fn();
        window.addEventListener('TIP6963:announceProvider', handler);
        teardown = setupTip6963(mockProvider);

        expect(handler).toHaveBeenCalledTimes(1);

        teardown();
        teardown = null;

        window.dispatchEvent(new Event('TIP6963:requestProvider'));
        // Should not have been called again after teardown
        expect(handler).toHaveBeenCalledTimes(1);

        window.removeEventListener('TIP6963:announceProvider', handler);
    });

    test('accepts custom opts (name, icon, rdns)', () => {
        const handler = jest.fn();
        window.addEventListener('TIP6963:announceProvider', handler);
        teardown = setupTip6963(mockProvider, {
            name: 'MyWallet',
            icon: 'data:image/png;base64,abc',
            rdns: 'com.mywallet',
        });
        window.removeEventListener('TIP6963:announceProvider', handler);

        const info = handler.mock.calls[0][0].detail.info;
        expect(info.name).toBe('MyWallet');
        expect(info.icon).toBe('data:image/png;base64,abc');
        expect(info.rdns).toBe('com.mywallet');
    });
});
