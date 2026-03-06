# What is tronweb-mobile？

tronweb-mobile is a JavaScript library provided for use within the **TronLink App**, designed to integrate Tron-related capabilities into DApp environments.

The library is based on [TronWeb](https://tronweb.network), integrating its methods and functions while overriding signature-related capabilities. This allows DApps to invoke **TronLink App’s internal signing workflow** directly through global objects.

## Features

- Integrates core methods and functions from [TronWeb](https://tronweb.network)
- Automatically injected into the page environment when a DApp is opened in the TronLink App
- Exposes unified global objects to maintain compatibility with existing Tron DApps
- Overrides signature methods so that all signing operations are handled internally by the TronLink App

## Injection Mechanism

When a user opens a DApp using the **TronLink App**:

- `tronweb-mobile.js` is automatically injected into the WebView
- DApps do not need to manually import or initialize the library
- TronLink App can be accessed directly through global objects

## Global Objects

tronweb-mobile injects the following global objects into the page environment:

- `window.tronWeb`
- `window.tron`
- `window.tronLink`

DApps can use these objects to interact with the Tron network and perform signing operations.

## Overridden Signature Methods

tronweb-mobile overrides and intercepts the following signature-related methods:

- `sign`
- `multiSign`
- `signTransaction`
- `signMessageV2`
- `_signTypedData`

When a DApp invokes any of these methods, the process is as follows:

1. The call is intercepted by tronweb-mobile
2. The request is forwarded to the TronLink App via global objects (`tron`, `tronLink`, or `tronWeb`)
3. The TronLink App prompts the user for confirmation and completes the signing process internally
4. The signature result is returned to the DApp

All signing operations are completed inside the TronLink App. DApps never have direct access to the user’s private keys.

## Usage Examples

First of all, in your javascript file, define TronWeb:

  ```javascript
    const { tronWeb, tron, tronLink } = window;
  ```

Transaction signing example:

  ```javascript
      const signedTx = await tronWeb.trx.sign(transaction)
  ```

Message signing example:

  ```javascript
      const signature = await tronWeb.trx.signMessageV2(message)
  ```    


When running inside the TronLink App environment, the above calls will automatically trigger the in-app signing confirmation flow.

## Applicable Scenarios

- DApps running inside the **TronLink App WebView**
- Decentralized applications that need to interact with the Tron network
- Projects built on [TronWeb](https://tronweb.network) that require API compatibility

## Notes

- tronweb-mobile is only injected in the **TronLink App environment**
- The library will not be available in standard browser environments
- DApps are recommended to detect the existence of `window.tronWeb` or `window.tronLink` at runtime

## Contribution

If you would like to contribute to tronweb-mobile, you can follow these steps:

- Fork this repository and clone it locally
- Install the dependencies: `pnpm install`
- Make your changes to the code
- Build the tronweb-mobile distribution files: `pnpm build`
- (Optional) Open a DApp inside the TronLink App to verify that the injection works correctly
- Run the tests (if applicable)
- Push your changes and submit a Pull Request

## License

tronweb-mobile is distributed under the MIT License.
