// Mock TronWeb for unit tests
class MockHttpProvider {
    constructor(url) {
        this.host = url;
        this.ready = false;
    }
    configure(url) { this.host = url; this.ready = true; }
    request() { return Promise.resolve({}); }
}

class MockTronWeb {
    constructor(opts) {
        this.fullNode = opts.fullNode || new MockHttpProvider('');
        this.solidityNode = opts.solidityNode || new MockHttpProvider('');
        this.eventServer = opts.eventServer || new MockHttpProvider('');
        this.defaultAddress = { base58: '', hex: '' };
        this.ready = false;
        this.version = '';
        this.trx = {
            sign: jest.fn(),
            signTransaction: jest.fn(),
            multiSign: jest.fn(),
            signMessageV2: jest.fn(),
            _signTypedData: jest.fn(),
        };
        this.utils = {
            isHex: jest.fn((v) => /^(0x)?[0-9a-fA-F]+$/.test(v)),
        };
        if (opts.sideOptions) {
            this.sidechain = {
                mainchain: {
                    trx: { sign: jest.fn(), signTransaction: jest.fn(), multiSign: jest.fn(), signMessageV2: jest.fn(), _signTypedData: jest.fn() },
                    setAddress: jest.fn(),
                },
                sidechain: {
                    trx: { sign: jest.fn(), signTransaction: jest.fn(), multiSign: jest.fn(), signMessageV2: jest.fn(), _signTypedData: jest.fn() },
                    setAddress: jest.fn(),
                },
            };
        }
    }
    setAddress(addr) {
        this.defaultAddress = { base58: addr, hex: addr };
    }
    isAddress(addr) {
        return typeof addr === 'string' && addr.length > 0 && addr !== 'invalid';
    }
}

const utils = {
    _TypedDataEncoder: {
        getPrimaryType: jest.fn((types) => {
            const keys = Object.keys(types).filter(k => k !== 'EIP712Domain');
            return keys[0] || '';
        }),
    },
};

const providers = {
    HttpProvider: MockHttpProvider,
};

module.exports = { TronWeb: MockTronWeb, utils, providers };
