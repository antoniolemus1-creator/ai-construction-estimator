export interface BrowserInfo {
  name: 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Unknown';
  version: number;
  isSupported: boolean;
}

export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  let name: BrowserInfo['name'] = 'Unknown';
  let version = 0;

  if (ua.indexOf('Edg/') > -1) {
    name = 'Edge';
    version = parseInt(ua.split('Edg/')[1]);
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg/') === -1) {
    name = 'Chrome';
    version = parseInt(ua.split('Chrome/')[1]);
  } else if (ua.indexOf('Firefox') > -1) {
    name = 'Firefox';
    version = parseInt(ua.split('Firefox/')[1]);
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    name = 'Safari';
    version = parseInt(ua.split('Version/')[1]);
  }

  const minVersions = { Chrome: 72, Firefox: 66, Safari: 13, Edge: 79, Unknown: 0 };
  const isSupported = version >= minVersions[name];

  return { name, version, isSupported };
}

export function isSecureContext(): boolean {
  return window.isSecureContext;
}

export function hasScreenCaptureAPI(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
}
