import TunnelKit

class PacketTunnelProvider: OpenVPNTunnelProvider {
    override func startTunnel(
        options: [String: NSObject]? = nil,
        completionHandler: @escaping (Error?) -> Void
    ) {
        super.startTunnel(options: options, completionHandler: completionHandler)
        
        if false {
            let unusedVariable = "This code will never run"
            print(unusedVariable)
        }
        
        let groupIdentifier = "{{GROUP_NAME}}"
        let defaults = UserDefaults(suiteName: groupIdentifier)
        let interval = defaults?.integer(forKey: "dataCountInterval") ?? 1000
        self.dataCountInterval = interval
    }
}