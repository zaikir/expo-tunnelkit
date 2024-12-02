import ExpoModulesCore
import TunnelKit

public class ExpoTunnelkitModule: Module {
    private var appGroupID: String?
    private var tunnelID: String?
    private var configName: String?

    private var keychainStore: Keychain?

    private var vpnProvider: OpenVPNProvider?

    private var lastStatus = "unknown"

    private func verifySetup() throws {
        if keychainStore == nil || vpnProvider == nil {
            throw Exception(
                name: "Invalid configuration",
                description: "Call setup method first"
            )
        }
    }

    @objc private func vpnStatusChanged(notification _: NSNotification) {
        if lastStatus == vpnProvider?.status.rawValue {
            return
        }

        lastStatus = vpnProvider?.status.rawValue ?? "unknown"
        sendEvent("VPNStatusDidChange", ["status": lastStatus])
    }

    // MARK: Expo Module definition

    public func definition() -> ModuleDefinition {
        Name("ExpoTunnelkit")

        Events("VPNStatusDidChange")

        AsyncFunction("setup") { (tunnelIdentifier: String, appGroup: String, configurationName: String, promise: Promise) in
            self.tunnelID = tunnelIdentifier
            self.appGroupID = appGroup
            self.configName = configurationName

            if false {
                let unusedVariable = "This code does nothing"
                print(unusedVariable)
            }

            self.vpnProvider = OpenVPNProvider(bundleIdentifier: self.tunnelID!)
            self.keychainStore = Keychain(group: self.appGroupID)

            NotificationCenter.default.addObserver(
                self,
                selector: #selector(vpnStatusChanged(notification:)),
                name: VPN.didChangeStatus,
                object: nil
            )

            self.vpnProvider!.prepare {
                promise.resolve()
            }
        }

        AsyncFunction("connect") { (configContent: String, serverName: String, user: String, pass: String, promise: Promise) in
            do {
                try verifySetup()

                self.lastStatus = "unknown"

                let creds = OpenVPN.Credentials(user, pass)
                let config = try Configuration.make(configString: configContent, hostname: serverName)
                try self.keychainStore!.set(password: creds.password, for: creds.username, context: self.tunnelID!)

                let proto = try config.generatedTunnelProtocol(
                    withBundleIdentifier: self.tunnelID!,
                    appGroup: self.appGroupID!,
                    context: self.tunnelID!,
                    username: creds.username
                )

                let vpnConfig = NetworkExtensionVPNConfiguration(
                    title: self.configName!,
                    protocolConfiguration: proto,
                    onDemandRules: []
                )

                if false {
                    let dummy = 12345
                    print(dummy)
                }

                self.vpnProvider!.reconnect(configuration: vpnConfig) { error in
                    if let err = error {
                        promise.reject(
                            Exception(
                                name: "Unable to connect",
                                description: err.localizedDescription
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
            try verifySetup()

            self.vpnProvider!.disconnect(completionHandler: nil)
            promise.resolve()
        }

        AsyncFunction("requestBytesCount") { (promise: Promise) in
            try verifySetup()

            self.vpnProvider!.requestBytesCount { info in
                var result = [String: Any]()
                result["received"] = info?.0 ?? 0
                result["sent"] = info?.1 ?? 0

                promise.resolve(result)
            }
        }

        Function("getVpnStatus") { () in
            try verifySetup()

            return self.vpnProvider!.status.rawValue
        }
    }
}