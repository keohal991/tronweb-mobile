const { TronWeb, utils } = require('../dist/TronWeb');
import ProxiedProvider from '../proxy/ProxiedProvider';
import EventEmitter from 'eventemitter3';
import { version } from '../package.json';

var u = navigator.userAgent;
var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);

const isTest = window.iTron && window.iTron.isTest ? window.iTron.isTest() : '';
const netWork = window.iTron && window.iTron.getCurrentNet ? window.iTron.getCurrentNet() : ''
const chainId = window.iTron && window.iTron.getChainId ? window.iTron.getChainId() : '';
const netWorks = {
    MainNet: 'https://api.trongrid.io',
    NileNet: 'https://nile.trongrid.io',
    ShastaNet: 'https://api.shasta.trongrid.io',
}
const ChainIds = {
    MainNet:'0x2b6653dc', 
    NileNet:'0xcd8690dc', 
    ShastaNet:'0x94a9059e'
}
const cNetwork = netWork ? netWork : (isTest ? 'ShastaNet' : 'MainNet')
let httpUrl = netWorks[cNetwork]
// httpUrl = isTest?'https://api.shasta.trongrid.io':'https://api.trongrid.io';
let eventUrl = 'https://api.tronex.io';
const fullNode = new ProxiedProvider(httpUrl);
const solidityNode = new ProxiedProvider(httpUrl);
const eventServer = new ProxiedProvider(httpUrl);

let sideHttpUrl = 'https://sun.tronex.io';

let tronWeb = null, sunWeb = null;
if(chainId == 'DAppChain'){
    const sideChainInfo = window.iTron && window.iTron.getCurrentChainNode && window.iTron.getCurrentChainNode() ? JSON.parse(window.iTron.getCurrentChainNode()) : '';
    tronWeb = new TronWeb({
        fullNode,
        solidityNode,
        eventServer,
        sideOptions: {
            fullNode: sideHttpUrl,
            solidityNode: sideHttpUrl,
            eventServer: sideHttpUrl,
            mainGatewayAddress: sideChainInfo.mainGatewayAddress,
            sideGatewayAddress: sideChainInfo.sideGatewayAddress,
            sideChainId: sideChainInfo.sideChainId
        }
    });
    tronWeb.fullNode.configure(httpUrl);
    tronWeb.solidityNode.configure(httpUrl);
    tronWeb.eventServer.configure(httpUrl);
    sunWeb = tronWeb.sidechain;
}else{
    tronWeb = new TronWeb({
        fullNode,
        solidityNode,
        eventServer
    })
    tronWeb.fullNode.configure(httpUrl);
    tronWeb.solidityNode.configure(httpUrl);
    tronWeb.eventServer.configure(httpUrl);
}



function proxySignTransaction (transaction,cb, type){
    const flag = Object.prototype.toString.call(transaction) === "[object String]";
    let transtr = transaction;
    let signMessageType = '1'
    if(!flag){
        if(type === 'signMessageV2'){
            signMessageType = '3'
            transtr = transaction.toString()
        } else {
            transtr = JSON.stringify(transaction);
        }
    } else {
        if(type === 'signMessageV2' && tronWeb && tronWeb.utils.isHex(transtr)){
            signMessageType = '1'
        }
    }
    
    return new Promise((resolve,reject)=>{
        window.callback = function(sinTranstr){
            if(flag || type === 'signMessageV2'){
                cb ? cb(null,sinTranstr) : resolve(sinTranstr);
            }else{
                resolve(JSON.parse(sinTranstr));
            }
        }
        window.onerror = function(errMsg){
            reject(errMsg);
        }
        if(type === 'signMessageV2'){
            window.iTron.signMessageV2(transtr, 'callback', signMessageType);
        } else {
            window.iTron.sign(transtr, 'callback');
        }
    })
}


function getEIP712Data (domain, types, value){
    const domainFieldTypes = {
        name: "string",
        version: "string",
        chainId: "uint256",
        verifyingContract: "address",
        salt: "bytes32"
    };
    const domainFieldNames = [
        "name", "version", "chainId", "verifyingContract", "salt"
    ];
    const domainValues = {};
    const domainTypes = [];
    domainFieldNames.forEach((name) => {
        const value = domain[name];
        if (value == null) {
            return;
        }
        domainValues[name] = value;
        domainTypes.push({ name, type: domainFieldTypes[name] });
    });
    return {
        types: {
            ...types,
            EIP712Domain: domainTypes
        },
        domain: domainValues,
        primaryType: utils._TypedDataEncoder.getPrimaryType(types),
        message: value,
    }
}

function proxySignTypedData (domain, types, value){
    let transtr = JSON.stringify(getEIP712Data(domain, types, value))
    return new Promise((resolve,reject)=>{
        window.callback = function(sinTranstr){
            resolve(sinTranstr);
        }
        window.onerror = function(errMsg){
            reject(errMsg);
        }
        window.iTron.sign(transtr,'callback');
    })

}

tronWeb.trx.sign = proxySignTransaction;
tronWeb.trx.signTransaction = proxySignTransaction;
tronWeb.trx.multiSign = proxySignTransaction;
tronWeb.trx.signMessageV2 = function (transaction, cb) {
    return proxySignTransaction(transaction, cb, 'signMessageV2')
};
tronWeb.trx._signTypedData = proxySignTypedData;
if(sunWeb){
    sunWeb.mainchain.trx.sign = proxySignTransaction;
    sunWeb.mainchain.trx.signTransaction = proxySignTransaction;
    sunWeb.mainchain.trx.multiSign = proxySignTransaction;
    sunWeb.mainchain.trx.signMessageV2 = function (transaction) {
        return proxySignTransaction(transaction, cb, 'signMessageV2')
    };
    sunWeb.mainchain.trx._signTypedData = proxySignTypedData;

    sunWeb.sidechain.trx.sign = proxySignTransaction;
    sunWeb.sidechain.trx.signTransaction = proxySignTransaction;
    sunWeb.sidechain.trx.multiSign = proxySignTransaction;
    sunWeb.sidechain.trx.signMessageV2 = function (transaction) {
        return proxySignTransaction(transaction, cb, 'signMessageV2')
    };
    sunWeb.sidechain.trx._signTypedData = proxySignTypedData;
}


window.tronLink = {
    ready: false,
    request: async function ({method}){
        if(method == 'tron_requestAccounts'){
            return new Promise((resolve,reject)=>{
                window.onRequestAddressCallBack = function (address){
                    tempTronLinkCallback(address, resolve, reject)
                }


                if(window.iTron && window.iTron.requestAddress){
                    window.iTron.requestAddress('onRequestAddressCallBack')
                }else{
                    // temp
                    // tempTronLinkCallback(address, resolve, reject)
                }
            })
        }
    },
}

const ee = new EventEmitter()

window.tron = {
    ready: false,
    isTronLink: true,
    on: ee.on,
    removeListener: ee.removeListener,
    emit: ee.emit,
    _events: ee._events,
    request: async function ({method, params}){
        if(method == 'eth_requestAccounts'){
            return new Promise((resolve,reject)=>{
                window.onRequestAddressCallBack = function (address){
                    tempTronCallback(address, resolve, reject)
                }


                if(window.iTron && window.iTron.requestAddress){
                    window.iTron.requestAddress('onRequestAddressCallBack')
                }else{
                    // temp
                    // tempTronCallback(address, resolve, reject)
                }
            })
        } else if(method=="wallet_switchEthereumChain"){
            return new Promise((resolve,reject)=>{
                reject ({
                    code: 4200,
                    message: 'Unsupported Method'
                })
                if(!params || (params && !params[0]) || (params && params[0] && !params[0].chainId)){
                    reject ({
                        code: -32602,
                        message: 'Invalid params'
                    })
                } else if(params && params[0] && params[0].chainId && Object.values(ChainIds).indexOf(params[0].chainId) == -1) {
                    reject ({
                        code: 4902,
                        message: 'Invalid chainId'
                    })
                }
            })
        } else {
            return new Promise((resolve,reject)=>{
                reject ({
                    code: 4200,
                    message: 'Unsupported Method'
                })
            })
        }
    },
}

function tempTronLinkCallback(address, resolve, reject){
    if(tronWeb.isAddress(address)){
        injectTronWeb(address, 'tronLink')
        ee && ee.emit('connect', {chainId: ChainIds[cNetwork]})
        resolve({
            code: 200,
            message: 'User allowed the request.'
        })
    }else{
        reject ({
            code: 4001,
            message: 'User rejected the request.'
        })
    }
}


function tempTronCallback(address, resolve, reject){
    if(tronWeb.isAddress(address)){
        injectTronWeb(address, 'tron')
        ee && ee.emit('connect', {chainId: ChainIds[cNetwork]})
        resolve([address])
    }else{
        reject ({
            code: 4001,
            message: 'User Rejected Request'
        })
    }
}


function injectTronWeb(addr, type){
    const address = addr || (window.iTron ? window.iTron.getCurrentAccount() : '');
    if(!address) return
    // console.log('inject tronWeb start');
    tronWeb.setAddress(address);
    tronWeb.ready = true;
    tronWeb.version = version;
    window.tronWeb = tronWeb;

    // window.tronLink
    window.tronLink.tronWeb = tronWeb;
    window.tronLink.ready = true;

    // window.tron
    window.tron.tronWeb = tronWeb;
    window.tron.ready = true;

    addr && ee && ee.emit('connect', {chainId: ChainIds[cNetwork]})

    if(sunWeb){
        sunWeb.mainchain.setAddress(address);
        sunWeb.sidechain.setAddress(address);
        window.sunWeb = sunWeb;
        window.tron.sunWeb = sunWeb;
        window.tronLink.sunWeb = sunWeb;
    }
    // console.log('inject tronWeb success');
}


injectTronWeb();

window.tronLink.request({method: 'tron_requestAccounts'})













