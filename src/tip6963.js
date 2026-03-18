/**
 * TIP-6963: Multi Injected Provider Discovery for TRON
 *
 * Mirrors EIP-6963 for the TRON ecosystem.
 * Allows DApps to discover injected wallet providers via window events
 * instead of racing for window.tronWeb.
 *
 * Flow:
 *   1. Wallet dispatches  TIP6963:announceProvider  on init
 *   2. DApp dispatches    TIP6963:requestProvider    to request (re-)announcement
 *   3. Wallet listens for TIP6963:requestProvider    and re-announces
 */

// TronLink wallet icon (inline SVG data URI)
const TRONLINK_ICON = `data:image/png;base64,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`;

const TIP6963_UUID = 'bfda97b4-3f01-4dde-a3a0-9fc13fb60cb5';

/**
 * Set up TIP-6963 provider discovery.
 *
 * @param {object}  provider - The EIP-1193-style provider object (window.tron)
 * @param {object} [opts]    - Optional overrides
 * @param {string} [opts.name]  - Wallet name   (default: 'TronLink')
 * @param {string} [opts.icon]  - Wallet icon URI
 * @param {string} [opts.rdns]  - Reverse DNS   (default: 'io.tronlink')
 */
export function setupTip6963(provider, opts) {
    const info = Object.freeze({
        uuid: TIP6963_UUID,
        name: (opts && opts.name) || 'TronLink',
        icon: (opts && opts.icon) || TRONLINK_ICON,
        rdns: (opts && opts.rdns) || 'io.tronlink',
    });

    function announceProvider() {
        const detail = Object.freeze({
            info: info,
            provider: provider,
        });

        // TRON-specific event (TIP-6963)
        window.dispatchEvent(
            new CustomEvent('TIP6963:announceProvider', { detail })
        );
    }

    // Listen for DApp discovery requests
    window.addEventListener('TIP6963:requestProvider', announceProvider);

    // Announce immediately on setup
    announceProvider();

    // Return a teardown function for cleanup if ever needed
    return function teardown() {
        window.removeEventListener('TIP6963:requestProvider', announceProvider);
    };
}
