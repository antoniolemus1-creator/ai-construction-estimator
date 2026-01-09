// Generate a unique browser/hardware fingerprint
export async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  // Screen resolution
  components.push(`${window.screen.width}x${window.screen.height}`);
  components.push(`${window.screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware concurrency
  components.push(String(navigator.hardwareConcurrency || 0));

  // User agent
  components.push(navigator.userAgent);

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
      components.push(canvas.toDataURL());
    }
  } catch (e) {
    components.push('canvas-error');
  }

  // Combine all components
  const fingerprint = components.join('|');
  
  // Hash the fingerprint
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
