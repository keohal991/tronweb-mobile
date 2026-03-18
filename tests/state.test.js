import state from '../src/state';

describe('state', () => {
    test('initial state has correct shape', () => {
        expect(state).toHaveProperty('tronWeb', null);
        expect(state).toHaveProperty('utils', null);
        expect(state).toHaveProperty('cNetwork', '');
        expect(state).toHaveProperty('httpUrl', '');
        expect(state).toHaveProperty('connected', false);
        expect(state).toHaveProperty('ee');
    });

    test('ee is an EventEmitter', () => {
        expect(typeof state.ee.on).toBe('function');
        expect(typeof state.ee.emit).toBe('function');
        expect(typeof state.ee.removeListener).toBe('function');
    });

    test('state is mutable', () => {
        state.connected = true;
        expect(state.connected).toBe(true);
        state.connected = false;
    });
});
