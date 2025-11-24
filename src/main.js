// Mock Data
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

// State
let isDemoMode = true; // Start in demo mode by default
let currentTab = 'bill-to';

// DOM Elements
const toggleDemoBtn = document.getElementById('toggle-demo');
const tabs = document.querySelectorAll('.tab');
const searchForms = document.querySelectorAll('.search-form');
const resultsArea = document.getElementById('results-area');

// Event Listeners
toggleDemoBtn.addEventListener('click', toggleDemo);

tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.target));
});

document.getElementById('btn-search-bill-to').addEventListener('click', () => handleSearch('bill-to'));
document.getElementById('btn-search-contract').addEventListener('click', () => handleSearch('contract'));
document.getElementById('btn-search-serial').addEventListener('click', () => handleSearch('serial'));

// Functions
function toggleDemo() {
    isDemoMode = !isDemoMode;
    toggleDemoBtn.textContent = isDemoMode ? 'Disable Demo Mode' : 'Enable Demo Mode';
    toggleDemoBtn.classList.toggle('active');
}

function switchTab(targetId) {
    currentTab = targetId;

    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.target === targetId);
    });

    searchForms.forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`search-${targetId}`).classList.add('active');

    resultsArea.innerHTML = '<div class="empty-state"><p>Enter search criteria to view contract details.</p></div>';
}

async function handleSearch(type) {
    if (!isDemoMode) {
        alert('API access is not yet configured. Please use Demo Mode.');
        return;
    }

    setLoading(true);

    try {
        await new Promise(resolve => setTimeout(resolve, 800));

        if (type === 'bill-to') {
            renderContracts(mockContracts.contracts);
        } else {
            renderLines(mockLines.lines);
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

// Initialize with demo mode active
toggleDemo();
