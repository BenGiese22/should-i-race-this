const DEFAULT_OAUTH_BASE = "https://oauth.iracing.com/oauth2";

export type TokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

export function oauthBaseUrl() {
  return process.env.IRACING_OAUTH_BASE_URL || DEFAULT_OAUTH_BASE;
}

export function buildAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL(`${oauthBaseUrl()}/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeCodeForTokens(params: {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}) {
  const form = new URLSearchParams();
  form.set("grant_type", "authorization_code");
  form.set("client_id", params.clientId);
  form.set("redirect_uri", params.redirectUri);
  form.set("code", params.code);
  form.set("code_verifier", params.codeVerifier);
  if (params.clientSecret) form.set("client_secret", params.clientSecret);

  const resp = await fetch(`${oauthBaseUrl()}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = (await resp.json()) as TokenResponse | { error?: string };
  return { ok: resp.ok, status: resp.status, data };
}

export async function fetchProfile(accessToken: string) {
  const resp = await fetch(`${oauthBaseUrl()}/iracing/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await resp.json();
  return { ok: resp.ok, status: resp.status, data };
}

export async function revokeToken(params: {
  clientId: string;
  clientSecret?: string;
  token: string;
}) {
  const form = new URLSearchParams();
  form.set("token", params.token);
  form.set("client_id", params.clientId);
  if (params.clientSecret) form.set("client_secret", params.clientSecret);

  const resp = await fetch(`${oauthBaseUrl()}/revoke`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  return { ok: resp.ok, status: resp.status };
}
