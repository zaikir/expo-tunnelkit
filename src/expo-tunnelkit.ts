import Constants from 'expo-constants';
import { EventEmitter, requireNativeModule } from 'expo-modules-core';

import { ConnectOptions, SetupOptions, VpnStatus } from './types';

const ExpoTunnelkitModule = requireNativeModule('ExpoTunnelkit');
const ExpoTunnelkitEmitter = new EventEmitter(ExpoTunnelkitModule);

const NETWORK_EXTENSION_TARGET_NAME = 'VpnProviderExtension';

/**
 * Setup VPN module with appGroup, tunnelIdentifier and configurationName.
 * This method should be called before any other VPN module methods.
 *
 * @param {SetupOptions} options - The setup options.
 * @param {string} options.tunnelIdentifier - Identifier of the network extension.
 * @param {string} options.appGroup - Group identifier shared between the app and the app extension.
 * @param {string} options.configurationName - Name of the VPN configuration.
 *
 * @example
 * // Example usage:
 * setup({
 *  tunnelIdentifier: 'com.example.app.tunnelExtension',
 *  appGroup: 'group.com.example.app.tunnelExtension',
 *  configurationName: 'Your App VPN',
 * });
 */
async function setup(options?: SetupOptions) {
  const { tunnelIdentifier, appGroup, configurationName } = options ?? {};
  const bundle =
    Constants.expoConfig?.ios?.bundleIdentifier ??
    Constants.manifest.ios.bundleIdentifier;

  const resulTtunnelIdentifier =
    tunnelIdentifier ?? `${bundle}.${NETWORK_EXTENSION_TARGET_NAME}`;

  await ExpoTunnelkitModule.setup(
    resulTtunnelIdentifier,
    appGroup ?? `group.${resulTtunnelIdentifier}`,
    configurationName ?? Constants.expoConfig?.name ?? 'Vpn',
  );
}

/**
 * Connect to the VPN server.
 *
 * @param {ConnectOptions} options - The connection options.
 * @param {string} options.config - The OpenVPN configuration.
 * @param {string} options.hostname - The hostname of the VPN server.
 * @param {string} options.username - The username for the VPN server.
 * @param {string} options.password - The password for the VPN server.
 * @throws {Error} If the connection fails or if configuration is invalid.
 * @example
 * // Example usage:
 * connect({
 *  config: '...the OpenVPN configuration...',
 *  hostname: 'example.com',
 *  username: 'user',
 *  password: 'pass',
 * });
 */
async function connect({
  config,
  hostname,
  username,
  password,
}: ConnectOptions) {
  await ExpoTunnelkitModule.connect(config, hostname, username, password);
}

/**
 * Disconnect from the VPN server.
 */
async function disconnect() {
  await ExpoTunnelkitModule.disconnect();
}

/**
 * Get the current VPN status.
 */
function getVpnStatus(): VpnStatus {
  return ExpoTunnelkitModule.getVpnStatus() ?? 'unknown';
}

/**
 * Get the current VPN status.
 */
async function requestBytesCount(): Promise<{
  received: number;
  sent: number;
}> {
  return await ExpoTunnelkitModule.requestBytesCount();
}

/**
 * Add a listener to VPN status changes.
 * @param listener a function that will be called when the VPN status changes
 * @returns `Subscription` object that can be used to unsubscribe the listener
 * @example addVpnStatusListener((state) => console.log(state.VPNStatus));
 */
function addVpnStatusListener(
  listener: (state: { status: VpnStatus }) => void,
) {
  return ExpoTunnelkitEmitter.addListener('VPNStatusDidChange', listener);
}

export const ExpoTunnelkit = {
  setup,
  connect,
  disconnect,
  addVpnStatusListener,
  getVpnStatus,
  requestBytesCount,
};
