const BASE_URL = 'https://apix.cisco.com/ccw/renewals/api/v1.0';

export async function searchContracts(billToId, token) {
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

export async function searchLines(criteria, type, token) {
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
