import type { Request, Response } from 'express';
import axios from 'axios';

const IG_APP_ID     = process.env['IG_APP_ID']     ?? '';
const IG_APP_SECRET = process.env['IG_APP_SECRET'] ?? '';
const REDIRECT_URI  = process.env['IG_REDIRECT_URI'] ?? 'http://localhost:3001/auth/instagram/callback';

// ─── Check if Instagram OAuth is configured ───────────────────────────────────
export function instagramStatusHandler(_req: Request, res: Response) {
  res.json({ configured: !!IG_APP_ID });
}

// ─── Step 1: Redirect to Instagram OAuth ─────────────────────────────────────
export function instagramAuthHandler(_req: Request, res: Response) {
  if (!IG_APP_ID) {
    res.status(500).send(closePopup('error', 'Instagram app no configurada. Agrega IG_APP_ID en .env'));
    return;
  }
  const params = new URLSearchParams({
    client_id:     IG_APP_ID,
    redirect_uri:  REDIRECT_URI,
    scope:         'user_profile,user_media',
    response_type: 'code',
  });
  res.redirect(`https://api.instagram.com/oauth/authorize?${params}`);
}

// ─── Step 2: Handle OAuth callback ───────────────────────────────────────────
export async function instagramCallbackHandler(req: Request, res: Response) {
  const { code, error, error_reason } = req.query as Record<string, string>;

  if (error || !code) {
    res.send(closePopup('error', error_reason ?? error ?? 'cancelled'));
    return;
  }

  try {
    // Exchange code for short-lived token
    const tokenForm = new URLSearchParams({
      client_id:     IG_APP_ID,
      client_secret: IG_APP_SECRET,
      grant_type:    'authorization_code',
      redirect_uri:  REDIRECT_URI,
      code,
    });

    const { data: tokenData } = await axios.post<{ access_token: string; user_id: number }>(
      'https://api.instagram.com/oauth/access_token',
      tokenForm.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, user_id } = tokenData;

    // Fetch profile (Basic Display API)
    const { data: profile } = await axios.get<{
      id: string; username: string; account_type: string; media_count: number;
    }>(
      `https://graph.instagram.com/${user_id}`,
      { params: { fields: 'id,username,account_type,media_count', access_token } }
    );

    // Basic Display API doesn't expose profile pictures for personal accounts.
    // We generate a nice avatar using DiceBear (free, no tracking).
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}&backgroundColor=7C3AED&textColor=ffffff&fontSize=40`;

    const user = {
      id:          profile.id,
      username:    profile.username,
      name:        profile.username, // IG Basic Display doesn't give full name
      avatar:      avatarUrl,
      mediaCount:  profile.media_count,
      accountType: profile.account_type,
    };

    res.send(closePopup('success', JSON.stringify(user)));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[IG OAuth]', msg);
    res.send(closePopup('error', msg));
  }
}

// ─── Helper: generate a page that messages the opener and closes ──────────────
function closePopup(type: 'success' | 'error', payload: string): string {
  const escaped = payload.replace(/'/g, "\\'").replace(/\n/g, '');
  return `<!DOCTYPE html><html><body><script>
    try {
      var data = ${type === 'success' ? payload : `{type:'ig-auth-error',error:'${escaped}'}`};
      if (${type === 'success'}) data = {type:'ig-auth-success', user: data};
      window.opener && window.opener.postMessage(data, 'http://localhost:5173');
    } catch(e) {
      window.opener && window.opener.postMessage({type:'ig-auth-error',error:e.message}, 'http://localhost:5173');
    }
    window.close();
  </script><p>Cerrando...</p></body></html>`;
}
