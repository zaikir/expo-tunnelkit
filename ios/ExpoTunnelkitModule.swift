import ExpoModulesCore
import TunnelKit

public class ExpoTunnelkitModule: Module {
  private var appGroup: String?
  private var tunnelIdentifier: String?
  private var configurationName: String?

  private var keychain: Keychain?

  private var vpn: OpenVPNProvider?

  private var previousStatus = "unknown"

  private func ensureSetup() throws {
    if keychain == nil || vpn == nil {
      throw Exception(
        name: "Invalid configuration",
        description: "Call setup method first"
      )
    }
  }

  @objc private func VPNStatusDidChange(notification _: NSNotification) {
    if (previousStatus == vpn?.status.rawValue) {
      return
    }
    
    previousStatus = vpn?.status.rawValue ?? "unknown"
    sendEvent("VPNStatusDidChange", ["status": previousStatus])
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

      self.vpn!.prepare {
          promise.resolve()
      }
    }

    AsyncFunction("connect") { (config: String, hostname: String, username: String, password: String, promise: Promise) in
      do {
        try ensureSetup()

        self.previousStatus = "unknown"

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

    AsyncFunction("requestBytesCount") { (promise: Promise) in
      try ensureSetup()

      self.vpn!.requestBytesCount { info in
        var result = [String: Any]()
        result["received"] = info?.0 ?? 0
        result["sent"] = info?.1 ?? 0

        promise.resolve(result)
      }
    }

    Function("getVpnStatus") { () in
      try ensureSetup()

      return self.vpn!.status
    }
  }
}
