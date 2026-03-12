import { Incident, Severity, IncidentType, Sector, IncidentStatus } from '../types';

const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
const TYPES: IncidentType[] = ['Ransomware', 'DDoS', 'Phishing', 'Data Breach', 'Malware', 'Insider Threat', 'Espionage'];
const SECTORS: Sector[] = ['Finance', 'Healthcare', 'Technology', 'Government', 'Retail', 'Energy', 'Education'];
const STATUSES: IncidentStatus[] = ['Open', 'Investigating', 'Resolved', 'Contained'];
const THREAT_ACTORS = ['APT29', 'Lazarus Group', 'Fancy Bear', 'Anonymous', 'DarkSide', 'REvil', 'Unknown', 'Cobalt Spider'];
const CITIES = [
  { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
  { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { city: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },
  { city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
  { city: 'Sao Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  { city: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
];

const SOURCES = ['SIEM Alert', 'User Report', 'Threat Intel Feed', 'Dark Web Monitoring', 'Automated Scanner'];

export const generateMockIncidents = (count: number): Incident[] => {
  const incidents: Incident[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
    const location = CITIES[Math.floor(Math.random() * CITIES.length)];
    
    // Weight severity based on type
    let severity: Severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
    if (type === 'Ransomware' || type === 'Data Breach') {
       severity = Math.random() > 0.3 ? 'Critical' : 'High';
    }

    incidents.push({
      id: `INC-${10000 + i}`,
      title: `${type} Activity Detected in ${sector} Sector`,
      description: `Anomalous behavior indicative of ${type} was detected originating from ${location.city}. Preliminary analysis suggests potential involvement of ${THREAT_ACTORS[Math.floor(Math.random() * THREAT_ACTORS.length)]}.`,
      date: date.toISOString(),
      severity,
      status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
      type,
      sector,
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      threatActor: Math.random() > 0.4 ? THREAT_ACTORS[Math.floor(Math.random() * THREAT_ACTORS.length)] : undefined,
      location: {
        ...location,
        lat: location.lat + (Math.random() - 0.5) * 5, // Randomize slightly for map spread
        lng: location.lng + (Math.random() - 0.5) * 5,
      },
      impactScore: Math.floor(Math.random() * 100),
    });
  }

  // Sort by date desc
  return incidents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};