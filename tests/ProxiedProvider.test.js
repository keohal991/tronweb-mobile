import ProxiedProvider from '../proxy/ProxiedProvider';

// Mock axios
jest.mock('axios', () => ({
    create: jest.fn(() => ({})),
}));

describe('ProxiedProvider', () => {
    let provider;

    beforeEach(() => {
        provider = new ProxiedProvider('https://api.trongrid.io');
    });

    test('starts with ready=false and empty queue', () => {
        expect(provider.ready).toBe(false);
        expect(provider.queue).toEqual([]);
    });

    test('configure sets ready and host', () => {
        provider.configure('https://api.nileex.io');
        expect(provider.ready).toBe(true);
        expect(provider.host).toBe('https://api.nileex.io');
    });

    test('queues requests when not ready', () => {
        const p = provider.request('/wallet/getnowblock');
        expect(provider.queue.length).toBe(1);
        expect(p).toBeInstanceOf(Promise);
    });

    test('drains queue on configure', async () => {
        let callCount = 0;
        // Return a fresh object each time to avoid __payload__ redefinition
        jest.spyOn(
            Object.getPrototypeOf(Object.getPrototypeOf(provider)),
            'request'
        ).mockImplementation(() => Promise.resolve({ blockID: '123', _n: ++callCount }));

        const p1 = provider.request('/wallet/getnowblock');
        const p2 = provider.request('/wallet/getaccount', { address: 'T1' });
        expect(provider.queue.length).toBe(2);

        provider.configure('https://api.trongrid.io');
        expect(provider.queue.length).toBe(0);

        const r1 = await p1;
        const r2 = await p2;
        expect(r1.blockID).toBe('123');
        expect(r2.blockID).toBe('123');
    });

    test('rejects when queue exceeds MAX_QUEUE_SIZE', async () => {
        // Fill queue to 100
        const promises = [];
        for (let i = 0; i < 100; i++) {
            promises.push(provider.request(`/endpoint/${i}`).catch(() => {}));
        }
        expect(provider.queue.length).toBe(100);

        // 101st should reject immediately
        await expect(provider.request('/overflow')).rejects.toThrow('queue is full');
    });

    test('queued requests timeout after QUEUE_TIMEOUT', async () => {
        jest.useFakeTimers();

        const p = provider.request('/wallet/getnowblock');

        // Fast-forward past 30s timeout
        jest.advanceTimersByTime(31000);

        await expect(p).rejects.toThrow('timed out');

        jest.useRealTimers();
    });

    test('adds __payload__ property to response', async () => {
        jest.spyOn(
            Object.getPrototypeOf(Object.getPrototypeOf(provider)),
            'request'
        ).mockResolvedValue({ data: 'ok' });

        provider.configure('https://api.trongrid.io');
        const res = await provider.request('/test', { key: 'val' });

        expect(res.__payload__).toEqual({ key: 'val' });
        // __payload__ should not be enumerable
        expect(Object.keys(res)).not.toContain('__payload__');
    });

    test('adds __payload__ to both res and res.transaction when transaction exists', async () => {
        const tx = { txID: 'abc123', raw_data: {} };
        jest.spyOn(
            Object.getPrototypeOf(Object.getPrototypeOf(provider)),
            'request'
        ).mockResolvedValue({ transaction: tx, result: { result: true } });

        provider.configure('https://api.trongrid.io');
        const res = await provider.request('/wallet/createtransaction', { to: 'T1' });

        expect(res.__payload__).toEqual({ to: 'T1' });
        expect(res.transaction.__payload__).toEqual({ to: 'T1' });
        expect(Object.keys(res)).not.toContain('__payload__');
        expect(Object.keys(res.transaction)).not.toContain('__payload__');
    });
});
