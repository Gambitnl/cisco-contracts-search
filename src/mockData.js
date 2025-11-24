export const mockContracts = {
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

export const mockLines = {
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
