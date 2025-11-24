const CLIENT_ID = '95944116-2495-442b-b82b-092928549302';
const REDIRECT_URI = 'http://localhost:3000/callback';
const AUTH_URL = 'https://id.cisco.com/oauth2/default/v1/authorize';
const TOKEN_URL = 'https://id.cisco.com/oauth2/default/v1/token';
const SCOPES = 'openid profile'; // Adjust scopes as needed

function generateCodeVerifier() {
    const array = new Uint32Array(56 / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    return base64Digest;
}

export async function login() {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store verifier for callback
    sessionStorage.setItem('code_verifier', codeVerifier);

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
    });

    window.location.href = `${AUTH_URL}?${params.toString()}`;
}

export async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const codeVerifier = sessionStorage.getItem('code_verifier');

    if (!code || !codeVerifier) {
        console.error('Missing code or verifier');
        return null;
    }

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
    });

    try {
        const response = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });

        if (!response.ok) {
            throw new Error(`Token Error: ${response.status}`);
        }

        const data = await response.json();
        sessionStorage.setItem('access_token', data.access_token);
        // Clear verifier and code from URL
        sessionStorage.removeItem('code_verifier');
        window.history.replaceState({}, document.title, '/');
        return data.access_token;
    } catch (error) {
        console.error('Token Exchange Error:', error);
        return null;
    }
}

export function getToken() {
    return sessionStorage.getItem('access_token');
}

export function logout() {
    sessionStorage.removeItem('access_token');
    window.location.reload();
}
