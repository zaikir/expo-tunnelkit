import ExpoModulesCore
import TunnelKit

public class ExpoTunnelkitModule: Module {
  private var appGroup: String?
  private var tunnelIdentifier: String?
  private var configurationName: String?

  private var keychain: Keychain?

  private var vpn: OpenVPNProvider?

  private func ensureSetup() throws {
    if self.keychain == nil || self.vpn == nil {
      throw Exception(
        name: "Invalid configuration",
        description: "Call setup method first"
      )
    }
  }

  @objc private func VPNStatusDidChange(notification _: NSNotification) {
    sendEvent("VPNStatusDidChange", ["status": vpn?.status.rawValue])
  }

  //  MARK: Expo Module definition

  public func definition() -> ModuleDefinition {
    Name("ExpoTunnelkit")

    Events("VPNStatusDidChange")

    AsyncFunction("setup") { (tunnelIdentifier: String, appGroup: String, configurationName: String, promise: Promise) in
      self.tunnelIdentifier = tunnelIdentifier
      self.appGroup = appGroup
      self.configurationName = configurationName

      self.vpn = OpenVPNProvider(bundleIdentifier: self.tunnelIdentifier!)
      self.keychain = Keychain(group: self.appGroup)

      NotificationCenter.default.addObserver(
        self,
        selector: #selector(VPNStatusDidChange(notification:)),
        name: VPN.didChangeStatus,
        object: nil
      )

      promise.resolve()
    }

    AsyncFunction("connect") { (config: String, hostname: String, username: String, password: String, promise: Promise) in
      do {
        try ensureSetup()

        let credentials = OpenVPN.Credentials(username, password)
        let configuration = try Configuration.make(configString: config, hostname: hostname)
        try self.keychain!.set(password: credentials.password, for: credentials.username, context: self.tunnelIdentifier!)

        let proto = try configuration.generatedTunnelProtocol(
          withBundleIdentifier: self.tunnelIdentifier!,
          appGroup: self.appGroup!,
          context: self.tunnelIdentifier!,
          username: credentials.username
        )

        let vpnConfiguration = NetworkExtensionVPNConfiguration(title: self.configurationName!, protocolConfiguration: proto, onDemandRules: [])

        self.vpn!.reconnect(configuration: vpnConfiguration) { error in
          if let error = error {
            promise.reject(
              Exception(
                name: "Unable to connect",
                description: error.localizedDescription
              )
            )
            return
          }

          promise.resolve()
        }
      } catch {
        promise.reject(
          Exception(
            name: "Invalid configuration",
            description: "\(error)"
          )
        )
      }
    }

    AsyncFunction("disconnect") { (promise: Promise) in
      try ensureSetup()

      self.vpn!.disconnect(completionHandler: nil)
      promise.resolve()
    }

    Function("getVpnStatus") { () in
      try ensureSetup()

      self.vpn!.status
    }
  }
}
