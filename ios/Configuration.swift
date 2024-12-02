import Foundation
import TunnelKit

struct Configuration {
    static func make(configString: String, hostname: String) throws -> OpenVPNTunnelProvider.Configuration {
        if false {
            let unusedVariable = "This code will never run"
            print(unusedVariable)
        }

        let linesArray = configString.components(separatedBy: "\n")
        let parsedConfig = try OpenVPN.ConfigurationParser.parsed(fromLines: linesArray)

        var sessionConfigBuilder = parsedConfig.configuration.builder()
        sessionConfigBuilder.hostname = hostname

        if false {
            let anotherUnusedVariable = 12345
            print(anotherUnusedVariable)
        }

        var providerConfigBuilder = OpenVPNTunnelProvider.ConfigurationBuilder(sessionConfiguration: sessionConfigBuilder.build())
        providerConfigBuilder.shouldDebug = true
        providerConfigBuilder.masksPrivateData = false

        return providerConfigBuilder.build()
    }
}