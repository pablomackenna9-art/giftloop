import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

const blocked = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 3],
] as const) blocked.addSubnet(address, prefix, 'ipv4');
const globalV6 = new BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');
const blockedV6 = new BlockList();
blockedV6.addSubnet('2001::', 32, 'ipv6');
blockedV6.addSubnet('2001:db8::', 32, 'ipv6');
blockedV6.addSubnet('2002::', 16, 'ipv6');
export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) return !blocked.check(address, 'ipv4');
  if (isIP(address) === 6) return globalV6.check(address, 'ipv6') && !blockedV6.check(address, 'ipv6');
  return false;
}
export function validateProductUrl(raw: string): URL {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      (url.port && !['80', '443'].includes(url.port))) throw new Error('URL no permitida');
  return url;
}

export async function fetchPublicHtml(raw: string): Promise<{ html: string; url: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    let url = validateProductUrl(raw);
    for (let redirects = 0; redirects <= 5; redirects++) {
      const hostname = url.hostname.replace(/^\[|\]$/g, '');
      const addresses = await Promise.race([
        lookup(hostname, { all: true }),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => reject(new Error('Tiempo de espera agotado')), { once: true });
        }),
      ]);
      if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error('Destino no permitido');
      if (controller.signal.aborted) throw new Error('Tiempo de espera agotado');
      const pinned = addresses[0];
      const result = await new Promise<{ html: string; location?: string }>((resolve, reject) => {
        const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
          signal: controller.signal,
          lookup: (_host, options, callback) => {
            if (options.all) callback(null, [pinned]);
            else callback(null, pinned.address, pinned.family);
          },
          headers: { 'User-Agent': 'Mozilla/5.0 GiftLoop/1.0', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'es-CL,es;q=0.9', 'Accept-Encoding': 'identity' },
        }, response => {
          const status = response.statusCode ?? 500;
          if ([301, 302, 303, 307, 308].includes(status)) {
            const location = response.headers.location;
            response.destroy();
            if (!location) reject(new Error('Redirección sin destino'));
            else resolve({ html: '', location });
            return;
          }
          if (status < 200 || status >= 300) { response.destroy(); reject(new Error(`HTTP ${status}`)); return; }
          if (!/text\/html|application\/xhtml\+xml/i.test(response.headers['content-type'] ?? '')) {
            response.destroy(); reject(new Error('La respuesta no es HTML')); return;
          }
          const chunks: Buffer[] = [];
          let size = 0;
          response.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size > 3 * 1024 * 1024) { response.destroy(new Error('Página demasiado grande')); return; }
            chunks.push(chunk);
          });
          response.on('error', reject);
          response.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8') }));
        });
        request.on('error', reject);
        request.end();
      });
      if (!result.location) return { html: result.html, url: url.href };
      url = validateProductUrl(new URL(result.location, url).href);
    }
    throw new Error('Demasiadas redirecciones');
  } finally { clearTimeout(timer); }
}
