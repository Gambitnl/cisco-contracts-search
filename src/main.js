// ==========================================
// Mock Data
// ==========================================
const mockContracts = {
    contracts: [
        {
            contractNumber: "204368924",
            status: "ACTIVE",
            endDate: "2025-12-31",
            billToName: "ACME Corp",
            serviceLevel: "SNT",
            contractType: "Service"
        },
        {
            contractNumber: "987654321",
            status: "EXPIRED",
            endDate: "2023-01-15",
            billToName: "ACME Corp",
            serviceLevel: "SNTP",
            contractType: "Software"
        }
    ]
};

const mockLines = {
    lines: [
        {
            serialNumber: "FOC12345678",
            productNumber: "C9300-24T-A",
            description: "Catalyst 9300 24-port Data Only, Network Advantage",
            contractNumber: "204368924",
            status: "COVERED",
            coverageEndDate: "2025-12-31"
        },
        {
            serialNumber: "FOC87654321",
            productNumber: "C9200-48P-E",
            description: "Catalyst 9200 48-port PoE+, Network Essentials",
            contractNumber: "204368924",
            status: "COVERED",
            coverageEndDate: "2025-12-31"
        }
    ]
};

// ==========================================
// Auth Logic (OAuth PKCE)
// ==========================================
const CLIENT_ID = '95944116-2495-442b-b82b-092928549302';
const REDIRECT_URI = 'http://localhost:3000/callback';
const AUTH_URL = 'https://id.cisco.com/oauth2/default/v1/authorize';
const TOKEN_URL = 'https://id.cisco.com/oauth2/default/v1/token';
const SCOPES = 'openid profile';

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

async function login() {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

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

async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const codeVerifier = sessionStorage.getItem('code_verifier');

    if (!code || !codeVerifier) {
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
        sessionStorage.removeItem('code_verifier');
        window.history.replaceState({}, document.title, '/');
        return data.access_token;
    } catch (error) {
        console.error('Token Exchange Error:', error);
        return null;
    }
}

function getToken() {
    return sessionStorage.getItem('access_token');
}

function logout() {
    sessionStorage.removeItem('access_token');
    window.location.reload();
}

// ==========================================
// API Client
// ==========================================
const BASE_URL = 'https://apix.cisco.com/ccw/renewals/api/v1.0';

async function searchContracts(billToId, token) {
    const url = `${BASE_URL}/search/contractSummary`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Request-Id': crypto.randomUUID()
    };

    const body = JSON.stringify({
        billToId: [billToId]
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Search Contracts Error:', error);
        throw error;
    }
}

async function searchLines(criteria, type, token) {
    const url = `${BASE_URL}/search/lines`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Request-Id': crypto.randomUUID()
    };

    let bodyData = {};
    if (type === 'contract') {
        bodyData = { contractNumber: [criteria] };
    } else if (type === 'serial') {
        bodyData = { serialNumber: [criteria] };
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Search Lines Error:', error);
        throw error;
    }
}

// ==========================================
// Main Application Logic
// ==========================================
let isDemoMode = false;
let currentTab = 'bill-to';
let accessToken = null;

// DOM Elements
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const toggleDemoBtn = document.getElementById('toggle-demo');
const tabs = document.querySelectorAll('.tab');
const searchForms = document.querySelectorAll('.search-form');
const resultsArea = document.getElementById('results-area');

// Event Listeners
toggleDemoBtn.addEventListener('click', toggleDemo);
btnLogin.addEventListener('click', login);
btnLogout.addEventListener('click', logout);

tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.target));
});

document.getElementById('btn-search-bill-to').addEventListener('click', () => handleSearch('bill-to'));
document.getElementById('btn-search-contract').addEventListener('click', () => handleSearch('contract'));
document.getElementById('btn-search-serial').addEventListener('click', () => handleSearch('serial'));

// Initialization
async function init() {
    // Check for callback
    if (window.location.search.includes('code=')) {
        const token = await handleCallback();
        if (token) {
            accessToken = token;
            updateAuthUI();
        }
    } else {
        accessToken = getToken();
        updateAuthUI();
    }
}

function updateAuthUI() {
    if (accessToken) {
        btnLogin.style.display = 'none';
        btnLogout.style.display = 'block';
        userInfo.style.display = 'flex';
    } else {
        btnLogin.style.display = 'block';
        btnLogout.style.display = 'none';
        userInfo.style.display = 'none';
    }
}

function toggleDemo() {
    isDemoMode = !isDemoMode;
    toggleDemoBtn.textContent = isDemoMode ? 'Disable Demo Mode' : 'Enable Demo Mode';
    toggleDemoBtn.classList.toggle('active');

    if (isDemoMode) {
        btnLogin.disabled = true;
    } else {
        btnLogin.disabled = false;
    }
}

function switchTab(targetId) {
    currentTab = targetId;

    // Update Tabs
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.target === targetId);
    });

    // Update Forms
    searchForms.forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`search-${targetId}`).classList.add('active');

    // Clear Results
    resultsArea.innerHTML = '<div class="empty-state"><p>Enter search criteria to view contract details.</p></div>';
}

async function handleSearch(type) {
    if (!isDemoMode && !accessToken) {
        alert('Please login or enable Demo Mode.');
        return;
    }

    setLoading(true);

    try {
        let data;

        if (isDemoMode) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            if (type === 'bill-to') {
                data = mockContracts;
                renderContracts(data.contracts);
            } else {
                data = mockLines;
                renderLines(data.lines);
            }
        } else {
            // Real API Call
            let criteria;
            if (type === 'bill-to') {
                criteria = document.getElementById('bill-to-id').value.trim();
                data = await searchContracts(criteria, accessToken);
                renderContracts(data.contracts || []);
            } else if (type === 'contract') {
                criteria = document.getElementById('contract-number').value.trim();
                data = await searchLines(criteria, 'contract', accessToken);
                renderLines(data.lines || []);
            } else if (type === 'serial') {
                criteria = document.getElementById('serial-number').value.trim();
                data = await searchLines(criteria, 'serial', accessToken);
                renderLines(data.lines || []);
            }
        }
    } catch (error) {
        resultsArea.innerHTML = `<div class="empty-state" style="color: var(--error-color)"><p>Error: ${error.message}</p></div>`;
    } finally {
        setLoading(false);
    }
}

function setLoading(isLoading) {
    if (isLoading) {
        resultsArea.innerHTML = '<div class="empty-state"><p>Searching...</p></div>';
    }
}

function renderContracts(contracts) {
    if (!contracts || contracts.length === 0) {
        resultsArea.innerHTML = '<div class="empty-state"><p>No contracts found.</p></div>';
        return;
    }

    resultsArea.innerHTML = contracts.map(contract => `
    <div class="contract-card">
      <div class="card-header">
        <div class="contract-number">#${contract.contractNumber}</div>
        <div class="status-badge ${contract.status === 'ACTIVE' ? 'status-active' : 'status-expired'}">
          ${contract.status}
        </div>
      </div>
      <div class="card-details">
        <div class="detail-item">
          <label>Bill To Name</label>
          <span>${contract.billToName || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <label>End Date</label>
          <span>${contract.endDate || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <label>Service Level</label>
          <span>${contract.serviceLevel || 'N/A'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderLines(lines) {
    if (!lines || lines.length === 0) {
        resultsArea.innerHTML = '<div class="empty-state"><p>No lines found.</p></div>';
        return;
    }

    resultsArea.innerHTML = lines.map(line => `
    <div class="contract-card">
      <div class="card-header">
        <div class="contract-number">${line.productNumber}</div>
        <div class="status-badge ${line.status === 'COVERED' ? 'status-active' : 'status-expired'}">
          ${line.status}
        </div>
      </div>
      <div class="card-details">
        <div class="detail-item">
          <label>Serial Number</label>
          <span>${line.serialNumber}</span>
        </div>
        <div class="detail-item">
          <label>Description</label>
          <span>${line.description}</span>
        </div>
        <div class="detail-item">
          <label>Contract</label>
          <span>${line.contractNumber}</span>
        </div>
        <div class="detail-item">
          <label>Coverage End</label>
          <span>${line.coverageEndDate}</span>
        </div>
      </div>
    </div>
  `).join('');
}

init();
