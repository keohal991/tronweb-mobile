import { SIGN_TIMEOUT, RPC_ERRORS, netWorks, ChainIds } from '../src/constants';

describe('constants', () => {
    test('SIGN_TIMEOUT is 5 minutes', () => {
        expect(SIGN_TIMEOUT).toBe(5 * 60 * 1000);
    });

    test('RPC_ERRORS has standard EIP-1193 error codes', () => {
        expect(RPC_ERRORS.USER_REJECTED.code).toBe(4001);
        expect(RPC_ERRORS.UNAUTHORIZED.code).toBe(4100);
        expect(RPC_ERRORS.UNSUPPORTED_METHOD.code).toBe(4200);
        expect(RPC_ERRORS.DISCONNECTED.code).toBe(4900);
        expect(RPC_ERRORS.CHAIN_DISCONNECTED.code).toBe(4901);
        expect(RPC_ERRORS.INVALID_PARAMS.code).toBe(-32602);
        expect(RPC_ERRORS.INVALID_CHAIN.code).toBe(4902);
    });

    test('netWorks contains all supported networks', () => {
        expect(netWorks).toHaveProperty('MainNet');
        expect(netWorks).toHaveProperty('NileNet');
        expect(netWorks).toHaveProperty('ShastaNet');
        expect(netWorks.MainNet).toContain('trongrid.io');
        expect(netWorks.NileNet).toContain('nile');
        expect(netWorks.ShastaNet).toContain('shasta');
    });

    test('ChainIds are hex strings', () => {
        Object.values(ChainIds).forEach((id) => {
            expect(id).toMatch(/^0x[0-9a-f]+$/);
        });
        expect(Object.keys(ChainIds)).toEqual(['MainNet', 'NileNet', 'ShastaNet']);
    });
});
