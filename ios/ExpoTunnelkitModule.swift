import ExpoModulesCore

public class ExpoTunnelkitModule: Module {
  private var appGroup: String?
  private var tunnelIdentifier: String?
  private var configurationName: String?

  private var keychain: Keychain?

  private var vpn: OpenVPNProvider?

  @objc private func VPNStatusDidChange(notification: NSNotification) {
    sendEvent("VPNStatusDidChange", ["status": vpn.status.rawValue])
  }
}
