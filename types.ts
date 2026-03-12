export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved' | 'Contained';
export type IncidentType = 'Ransomware' | 'DDoS' | 'Phishing' | 'Data Breach' | 'Malware' | 'Insider Threat' | 'Espionage';
export type Sector = 'Finance' | 'Healthcare' | 'Technology' | 'Government' | 'Retail' | 'Energy' | 'Education';

export interface GeoLocation {
  lat: number;
  lng: number;
  country: string;
  city: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  date: string; // ISO Date string
  severity: Severity;
  status: IncidentStatus;
  type: IncidentType;
  sector: Sector;
  source: string;
  threatActor?: string;
  location: GeoLocation;
  impactScore: number; // 0-100
}

export interface FilterState {
  search: string;
  severity: Severity | 'All';
  sector: Sector | 'All';
  dateRange: 'All' | '24h' | '7d' | '30d';
}