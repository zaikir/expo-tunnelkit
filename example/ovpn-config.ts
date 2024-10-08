export const ovpnConfig = `# Automatically generated OpenVPN client config file
# Generated on Sun Sep  8 22:34:04 2024 by c16d4526de5a
# Note: this config file contains inline private keys
#       and therefore should be kept confidential!
#       Certificate serial: 7152700595366769375, certificate common name: openvpn
#       Expires 2034-09-06 22:34:04
# Note: this configuration is user-locked to the username below
# OVPN_ACCESS_SERVER_USERNAME=openvpn
# Define the profile name of this particular configuration file
# OVPN_ACCESS_SERVER_PROFILE=openvpn@172.17.0.2

# Default Cipher
cipher AES-256-CBC
# OVPN_ACCESS_SERVER_CLI_PREF_ALLOW_WEB_IMPORT=True
# OVPN_ACCESS_SERVER_CLI_PREF_BASIC_CLIENT=False
# OVPN_ACCESS_SERVER_CLI_PREF_ENABLE_CONNECT=False
# OVPN_ACCESS_SERVER_CLI_PREF_ENABLE_XD_PROXY=True
# OVPN_ACCESS_SERVER_WSHOST=172.17.0.2:443
# OVPN_ACCESS_SERVER_WEB_CA_BUNDLE_START
# -----BEGIN CERTIFICATE-----
# MIIByzCCAVGgAwIBAgIEZt3xmDAKBggqhkjOPQQDAjA+MTwwOgYDVQQDDDNPcGVu
# VlBOIFdlYiBDQSAyMDI0LjA5LjA4IDE4OjQ4OjU2IFVUQyBjMTZkNDUyNmRlNWEw
# HhcNMjQwOTA3MTg0ODU2WhcNMzQwOTA2MTg0ODU2WjA+MTwwOgYDVQQDDDNPcGVu
# VlBOIFdlYiBDQSAyMDI0LjA5LjA4IDE4OjQ4OjU2IFVUQyBjMTZkNDUyNmRlNWEw
# djAQBgcqhkjOPQIBBgUrgQQAIgNiAATCGBr4bn5jZ1qIZFCHZgqrlkTWz2u1vU1u
# npDNwvZUh+RW/5Idp3bTfX+gcnSKTwMe5Qlfnb6ROaaO8nG8DG7ih/EDdEGdsEdw
# F0ZdHkfdSOg/raOm+UQQ1EWPPhl1B+WjIDAeMA8GA1UdEwEB/wQFMAMBAf8wCwYD
# VR0PBAQDAgEGMAoGCCqGSM49BAMCA2gAMGUCMQCxZC70Os10z2pnjfB/ShAC9eEo
# gm7wJRe/MkCH+ibnSU1tVf3sy4hscZmshWmKQaQCMFGrW2Ovg11nBn05PfdKqWFs
# 9nAvoXG324+zyXBM/fm+IplNrrJCJbxVN/HkQW49eg==
# -----END CERTIFICATE-----
# OVPN_ACCESS_SERVER_WEB_CA_BUNDLE_STOP
# OVPN_ACCESS_SERVER_IS_OPENVPN_WEB_CA=1
client
server-poll-timeout 4
nobind
remote 172.17.0.2 1194 udp
remote 172.17.0.2 1194 udp
remote 172.17.0.2 443 tcp
remote 172.17.0.2 1194 udp
remote 172.17.0.2 1194 udp
remote 172.17.0.2 1194 udp
remote 172.17.0.2 1194 udp
remote 172.17.0.2 1194 udp
dev tun
dev-type tun
remote-cert-tls server
tls-version-min 1.2
reneg-sec 604800
tun-mtu 1420
auth-user-pass
verb 3
push-peer-info

<ca>
-----BEGIN CERTIFICATE-----
MIIBeDCB/6ADAgECAgRm3fGVMAoGCCqGSM49BAMCMBUxEzARBgNVBAMMCk9wZW5W
UE4gQ0EwHhcNMjQwOTA3MTg0ODUzWhcNMzQwOTA2MTg0ODUzWjAVMRMwEQYDVQQD
DApPcGVuVlBOIENBMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEU42ItfOmuydnsOuH
JICoVBPaq9AjgreWNPFuOF4dBt5H7PMmlUOjMgkdgJFYuHexK7WVoARPUjB8ISbF
KfnFskbAVsNZkHBOW2cET6hPw7P2A0SLb0aYnzOvmwQHHi3ooyAwHjAPBgNVHRMB
Af8EBTADAQH/MAsGA1UdDwQEAwIBBjAKBggqhkjOPQQDAgNoADBlAjAVivxktxJW
YaeSO9+W5CW8ggHMcEPoocKIoPzLHBO4YPUS7pQ5/E/cbmWnR4FHn8ECMQCb3bE+
l7b2Fk0YCIm2oV9GfqilGlpPUjS0ouuXKcQFe68UD3eKprdK66UeFRwzl1k=
-----END CERTIFICATE-----
</ca>
<cert>
-----BEGIN CERTIFICATE-----
MIIBnjCCASWgAwIBAgIIY0N/S3uPst8wCgYIKoZIzj0EAwIwFTETMBEGA1UEAwwK
T3BlblZQTiBDQTAeFw0yNDA5MDcyMjM0MDRaFw0zNDA5MDYyMjM0MDRaMBIxEDAO
BgNVBAMMB29wZW52cG4wdjAQBgcqhkjOPQIBBgUrgQQAIgNiAAQrrEjmJfz3n/9y
HZiLz/SFkzid4SCDoCZCXU0cNbo7Cu75l5WtFyHgrQwNnYxsUQbZnGyxSanRoAXD
9n5eVQt6df0aeqbnorOt48olCxz9aoDSsDKisNzCAa9p3kNkCFCjRTBDMAwGA1Ud
EwEB/wQCMAAwCwYDVR0PBAQDAgeAMBMGA1UdJQQMMAoGCCsGAQUFBwMCMBEGCWCG
SAGG+EIBAQQEAwIHgDAKBggqhkjOPQQDAgNnADBkAjBT1n+9+Of2Ltoes7FC9ZZ2
oV+yyhOPmAUsu0IYX/5ofgHyNznTL7ge3h5MyP3npL8CMCedoKLY9i0INTiLcnUW
Y/+EG8mwJfEnHQRm/5EINhxkdcp0hJIv9rPy5ZNgIdafrA==
-----END CERTIFICATE-----
</cert>
<key>
-----BEGIN PRIVATE KEY-----
MIG2AgEAMBAGByqGSM49AgEGBSuBBAAiBIGeMIGbAgEBBDC4eFfkHzqwSJ0oOf2O
nmybQ3FR+jnZBqqkN4sLA2sRxGDRVfI7vI0rp2MNck9aRuWhZANiAAQrrEjmJfz3
n/9yHZiLz/SFkzid4SCDoCZCXU0cNbo7Cu75l5WtFyHgrQwNnYxsUQbZnGyxSanR
oAXD9n5eVQt6df0aeqbnorOt48olCxz9aoDSsDKisNzCAa9p3kNkCFA=
-----END PRIVATE KEY-----
</key>
<tls-crypt>
#
# 2048 bit OpenVPN static key (Server Agent)
#
-----BEGIN OpenVPN Static key V1-----
31f41def3a4b7ada49cd42db0023adaa
801377bb2e60af2e3fa5c4349e32571d
68c8970714f90bcd69225e07d6b5e93e
d989973e694f2fc0b461ce1c961bc2c0
d927538ae09661ed1e675a3f40aaa508
00ca20c389cb40d58560f609e75badce
559e0537cbe3c231f7458b7337db86b3
33d5ffdc6609989adc39e03cd79be826
55caf100c818dff2904c9e463d7498d6
743f40e6ee489f47bc7469005f570ab4
897e7f37369e4cf5cd60415ddebd7d93
097de54ce5d9cd0e36cf97770584bb4f
ef6365642b49064bbc1ac5ec225247a6
52d96cb004ed29ed40ed32dd3c89c18b
fdd0eeba51ced21ee92aa7c3ac65166b
f2c2f4d17eb3c76d6b4dfe26a98f7c2f
-----END OpenVPN Static key V1-----
</tls-crypt>
## -----BEGIN RSA SIGNATURE-----
## DIGEST:sha256
## MGUCMQCxXms8AOSjSz/fO+Nw9Ao501lqDJ7HzTCFJ4/PYnxGc/
## 3BeREces2H4qZJn6k/knQCMH43S0GYVezSxfjfoQemP38+P8ok
## b2ew+Z62yPi3EWnvO0Jp75Qbuo4DgCCqBJl1cw==
## -----END RSA SIGNATURE-----
## -----BEGIN CERTIFICATE-----
## MIIBzTCCAVKgAwIBAgIFAM3ED6UwCgYIKoZIzj0EAwIwPjE8MDoGA1UEAwwzT3Bl
## blZQTiBXZWIgQ0EgMjAyNC4wOS4wOCAxODo0ODo1NiBVVEMgYzE2ZDQ1MjZkZTVh
## MB4XDTI0MDkwNzE4NDg1OVoXDTI1MDkwODE4NDg1OVowFTETMBEGA1UEAwwKMTcy
## LjE3LjAuMjB2MBAGByqGSM49AgEGBSuBBAAiA2IABEoWkR6Kx+LRMliJxP34ROdy
## FTpS6Ptk5iUkgSedi9ktlreEmnSV58II08pdMoD6QBfg2/fCsSTdtCMwSWjNNLWc
## E43ntS1A+ykwcxQp/z4re2HKGwJNtkoAizBEaPyiJaNJMEcwDAYDVR0TAQH/BAIw
## ADALBgNVHQ8EBAMCBaAwEwYDVR0lBAwwCgYIKwYBBQUHAwEwFQYDVR0RBA4wDIIK
## MTcyLjE3LjAuMjAKBggqhkjOPQQDAgNpADBmAjEA/IVItFkYfTVn/EsVaZU+Uzyn
## y/D4RaJuDH7wvqtKgU5WnhdA7eZrh6RQx7D8dXT6AjEApZ/B9EhncFWxptDw65wx
## jIEEC9qpLibT7993d51oXJUEhAxVdVqx925lDCOQqMM0
## -----END CERTIFICATE-----
## -----BEGIN CERTIFICATE-----
## MIIByzCCAVGgAwIBAgIEZt3xmDAKBggqhkjOPQQDAjA+MTwwOgYDVQQDDDNPcGVu
## VlBOIFdlYiBDQSAyMDI0LjA5LjA4IDE4OjQ4OjU2IFVUQyBjMTZkNDUyNmRlNWEw
## HhcNMjQwOTA3MTg0ODU2WhcNMzQwOTA2MTg0ODU2WjA+MTwwOgYDVQQDDDNPcGVu
## VlBOIFdlYiBDQSAyMDI0LjA5LjA4IDE4OjQ4OjU2IFVUQyBjMTZkNDUyNmRlNWEw
## djAQBgcqhkjOPQIBBgUrgQQAIgNiAATCGBr4bn5jZ1qIZFCHZgqrlkTWz2u1vU1u
## npDNwvZUh+RW/5Idp3bTfX+gcnSKTwMe5Qlfnb6ROaaO8nG8DG7ih/EDdEGdsEdw
## F0ZdHkfdSOg/raOm+UQQ1EWPPhl1B+WjIDAeMA8GA1UdEwEB/wQFMAMBAf8wCwYD
## VR0PBAQDAgEGMAoGCCqGSM49BAMCA2gAMGUCMQCxZC70Os10z2pnjfB/ShAC9eEo
## gm7wJRe/MkCH+ibnSU1tVf3sy4hscZmshWmKQaQCMFGrW2Ovg11nBn05PfdKqWFs
## 9nAvoXG324+zyXBM/fm+IplNrrJCJbxVN/HkQW49eg==
## -----END CERTIFICATE-----`;
