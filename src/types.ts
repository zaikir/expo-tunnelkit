export type SetupOptions = {
  configurationName: string;
  tunnelIdentifier?: string;
  appGroup?: string;
};

export type ConnectOptions = {
  config: string;
  hostname: string;
  username: string;
  password: string;
};

export type VpnStatus =
  | 'invalid'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reasserting'
  | 'disconnecting'
  | 'none'
  | 'unknown';
