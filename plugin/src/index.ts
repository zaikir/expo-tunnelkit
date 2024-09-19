import {
  ConfigPlugin,
  withDangerousMod,
  withEntitlementsPlist,
  withPodfile,
  withXcodeProject,
} from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { NETWORK_EXTENSION_TARGET_NAME } from './constants';

/**
 * Add "Network Extension -> Packet Tunnel Provider"
 */
const withNetworkExtensionCapabilities: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (newConfig) => {
    const KEY = 'com.apple.developer.networking.networkextension';
    if (!Array.isArray(newConfig.modResults[KEY])) {
      newConfig.modResults[KEY] = [];
    }
    if (!newConfig.modResults[KEY].includes('packet-tunnel-provider')) {
      newConfig.modResults[KEY].push('packet-tunnel-provider');
    }
    return newConfig;
  });
};

/**
 * Add App Group capability
 */
const withAppGroupCapabilities: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (newConfig) => {
    const KEY = 'com.apple.security.application-groups';
    if (!Array.isArray(newConfig.modResults[KEY])) {
      newConfig.modResults[KEY] = [];
    }
    const entitlement = `group.${newConfig?.ios?.bundleIdentifier || ''}.${NETWORK_EXTENSION_TARGET_NAME}`;
    if (!newConfig.modResults[KEY].includes(entitlement)) {
      newConfig.modResults[KEY].push(entitlement);
    }
    return newConfig;
  });
};

/**
 * Add "Keychain Sharing" capability and Keychain Access Groups
 */
const withKeychainSharingCapabilities: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (newConfig) => {
    const KEY = 'keychain-access-groups';
    if (!Array.isArray(newConfig.modResults[KEY])) {
      newConfig.modResults[KEY] = [];
    }
    const entitlement = `$(AppIdentifierPrefix)group.${newConfig?.ios?.bundleIdentifier || ''}.${NETWORK_EXTENSION_TARGET_NAME}`;
    if (!newConfig.modResults[KEY].includes(entitlement)) {
      newConfig.modResults[KEY].push(entitlement);
    }
    return newConfig;
  });
};

/**
 * Add Network Extension
 */
const withNetworkExtensionFiles: ConfigPlugin = (config) => {
  const modulePath = getModulePath();
  const extensionSourcePath = path.join(modulePath, 'extension-files');
  const files = fs.readdirSync(extensionSourcePath);
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosPath = path.join(config.modRequest.projectRoot, 'ios');
      const extensionPath = path.join(iosPath, NETWORK_EXTENSION_TARGET_NAME);
      if (!fs.existsSync(extensionPath)) {
        fs.mkdirSync(extensionPath, { recursive: true });
      }
      for (const file of files) {
        const source = path.join(extensionSourcePath, file);
        const destination = path.join(extensionPath, file);
        if (!fs.existsSync(destination)) {
          try {
            fs.copyFileSync(source, destination);
            // Modify the file content to replace {{GROUP_NAME}} with the actual group name
            const content = fs.readFileSync(destination, 'utf8');
            const replacedContent = content.replace(
              /{{GROUP_NAME}}/gm,
              `group.${config?.ios?.bundleIdentifier || ''}.${NETWORK_EXTENSION_TARGET_NAME}`,
            );
            fs.writeFileSync(destination, replacedContent);
          } catch (e) {
            console.error(`Failed to copy ${source} to ${destination}`);
            console.error(e);
          }
        }
      }
      return config;
    },
  ]);
};

/**
 * Modify Podfile to include the Network Extension target and add the necessary dependencies
 */
const withUpdatedPodfile: ConfigPlugin = (config) => {
  let modulePath = getModulePath();
  if (modulePath === '../') {
    modulePath = '../../';
  }
  const newPodLine = `pod 'TunnelKit', :podspec => 'https://raw.githubusercontent.com/zaikir/ios-openvpn/master/TunnelKit.podspec'`;
  const reactNativeLine = 'use_react_native!';
  const newTargetSnippet = `target '${NETWORK_EXTENSION_TARGET_NAME}' do
  ${newPodLine}
end`;

  return withPodfile(config, (newConfig) => {
    let { contents } = newConfig.modResults;

    const mainTarget =
      newConfig.modRequest.projectName ?? extractMainTarget(contents);

    if (!mainTarget) {
      console.error('Failed to extract the main target from the Podfile');
      return newConfig;
    }

    const targetLine = `target '${mainTarget}' do`;

    if (!contents.includes(newPodLine)) {
      const lines = contents.split('\n');
      const targetIndex = lines.findIndex((line) => line.includes(targetLine));
      if (targetIndex === -1) {
        console.error(`Failed to find the target line: ${targetLine}`);
        return newConfig;
      }
      const reactNativeIndex = lines
        .slice(targetIndex)
        .findIndex((line) => line.includes(reactNativeLine));
      if (reactNativeIndex === -1) {
        console.error(
          `Failed to find the react native line: ${reactNativeLine}`,
        );
        return newConfig;
      }
      const actualIndex = targetIndex + reactNativeIndex;
      // Capture the leading indentation of the `use_react_native!` line
      const reactNativeLineIndentation =
        lines[actualIndex].match(/^\s*/)?.[0] || '';

      lines.splice(
        actualIndex,
        0,
        `${reactNativeLineIndentation}${newPodLine}\n`,
      );
      newConfig.modResults.contents = lines.join('\n');
    }

    contents = newConfig.modResults.contents;

    if (!contents.includes(newTargetSnippet.split('\n')[0])) {
      const newContents = `${contents}\n${newTargetSnippet}\n`;
      newConfig.modResults.contents = newContents;
    }

    return newConfig;
  });
};

/**
 * Add target to xcode project
 */
const withXcodeProjectTarget: ConfigPlugin = (config) => {
  const modulePath = getModulePath();
  const extensionSourcePath = path.join(modulePath, 'extension-files');
  const files = fs.readdirSync(extensionSourcePath);

  return withXcodeProject(config, (newConfig) => {
    const xcodeProject = newConfig.modResults;

    if (xcodeProject.pbxTargetByName(NETWORK_EXTENSION_TARGET_NAME)) {
      return newConfig;
    }

    // Create new PBXGroup for the extension
    const extGroup = xcodeProject.addPbxGroup(
      files,
      NETWORK_EXTENSION_TARGET_NAME,
      NETWORK_EXTENSION_TARGET_NAME,
    );

    // Add the new PBXGroup to the top level group. This makes the
    // files / folder appear in the file explorer in Xcode.
    const groups = xcodeProject.hash.project.objects['PBXGroup'];
    Object.keys(groups).forEach(function (key) {
      if (
        typeof groups[key] === 'object' &&
        groups[key].name === undefined &&
        groups[key].path === undefined
      ) {
        xcodeProject.addToPbxGroup(extGroup.uuid, key);
      }
    });

    // WORK AROUND for codeProject.addTarget BUG
    // Xcode projects don't contain these if there is only one target
    // An upstream fix should be made to the code referenced in this link:
    //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
    const projObjects = xcodeProject.hash.project.objects;
    projObjects['PBXTargetDependency'] =
      projObjects['PBXTargetDependency'] || {};
    projObjects['PBXContainerItemProxy'] =
      projObjects['PBXTargetDependency'] || {};

    // Add the NSE target
    // This adds PBXTargetDependency and PBXContainerItemProxy for you
    const nseTarget = xcodeProject.addTarget(
      NETWORK_EXTENSION_TARGET_NAME,
      'app_extension',
      NETWORK_EXTENSION_TARGET_NAME,
      `${config.ios?.bundleIdentifier}.${NETWORK_EXTENSION_TARGET_NAME}`,
    );

    // Add build phases
    xcodeProject.addBuildPhase(
      ['PacketTunnelProvider.swift'],
      'PBXSourcesBuildPhase',
      'Sources',
      nseTarget.uuid,
    );

    xcodeProject.addBuildPhase(
      [],
      'PBXResourcesBuildPhase',
      'Resources',
      nseTarget.uuid,
    );

    xcodeProject.addBuildPhase(
      [],
      'PBXFrameworksBuildPhase',
      'Frameworks',
      nseTarget.uuid,
    );

    xcodeProject.addFramework('NetworkExtension.framework', {
      target: nseTarget.uuid,
    });

    // N.B. Untested!
    const devTeam =
      xcodeProject?.getFirstTarget()?.firstTarget?.buildConfigurationList
        ?.buildConfigurations?.[0]?.buildSettings?.DEVELOPMENT_TEAM;

    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== 'undefined' &&
        configurations[key].buildSettings.PRODUCT_NAME ===
          `"${NETWORK_EXTENSION_TARGET_NAME}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings;
        if (devTeam) {
          buildSettingsObj.DEVELOPMENT_TEAM = devTeam;
        }
        buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET = '13.4';
        buildSettingsObj.TARGETED_DEVICE_FAMILY = `"1,2"`;
        buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${NETWORK_EXTENSION_TARGET_NAME}/${NETWORK_EXTENSION_TARGET_NAME}.entitlements`;
        buildSettingsObj.CODE_SIGN_STYLE = 'Automatic';
        buildSettingsObj.SWIFT_VERSION = '5.0';
        buildSettingsObj.INFOPLIST_FILE = `${NETWORK_EXTENSION_TARGET_NAME}/Info.plist`;
        buildSettingsObj.MARKETING_VERSION = '1.0.0';
        buildSettingsObj.CURRENT_PROJECT_VERSION = '1';
      }
    }

    if (devTeam) {
      xcodeProject.addTargetAttribute('DevelopmentTeam', devTeam, nseTarget);
      xcodeProject.addTargetAttribute('DevelopmentTeam', devTeam);
    }
    return newConfig;
  });
};

/**
 * Run all the necessary plugins to add the TunnelKit to the project
 */
const withTunnelKit: ConfigPlugin = (config) => {
  config = withNetworkExtensionFiles(config);
  config = withNetworkExtensionCapabilities(config);
  config = withAppGroupCapabilities(config);
  config = withKeychainSharingCapabilities(config);
  config = withUpdatedPodfile(config);
  config = withXcodeProjectTarget(config);
  return config;
};

export default withTunnelKit;

function getModulePath() {
  let modulePath: string = '';
  try {
    modulePath = path.dirname(
      require.resolve('@kirz/expo-tunnelkit/package.json'),
    );
  } catch {
    console.error(
      `Couldn't find the package "@kirz/expo-tunnelkit". Falling back to the local filesystem.`,
    );
    modulePath = '../';
  }
  return modulePath;
}

function extractMainTarget(podfile: string): string | null {
  // Regular expression to find the main target with "use_expo_modules!"
  const targetRegex = /target ['"]([^'"]+)['"]\s+do[\s\S]*?use_expo_modules!/;

  const match = podfile.match(targetRegex);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}
