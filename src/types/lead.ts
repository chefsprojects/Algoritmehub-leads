// Lead data types - updated for Algoritmeregister 2026-01-02 format
export interface Lead {
    name: string;
    type: string;
    algorithm_count: number;
    impactful_count: number;
    high_risk_count: number;
    has_iama: boolean;
    latest_date: string | null;
    first_date: string | null;
    lead_score: number;
    priority: string;
    categories: Record<string, number>;
    recent_algorithms: Array<{
        name: string;
        date: string | null;
        category: string;
    }>;
    // Legacy fields (optional for backwards compatibility)
    email?: string | null;
    website?: string | null;
    high_risk?: number;
    impactful?: number;
    other?: number;
    missing_iama?: number;
    tender_count?: number;
    tender_ai?: number;
    tender_governance?: number;
    tender_ict?: number;
    buying_signal?: number;
    lead_score_original?: number;
}

export interface LeadData {
    generated_date: string;
    source_file?: string;
    total_leads: number;
    total_algorithms: number;
    matched_with_tenderned?: number;
    enriched_with_signals?: number;
    leads: Lead[];
}
