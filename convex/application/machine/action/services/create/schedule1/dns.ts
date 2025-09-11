"use node";

import { DNS } from '@google-cloud/dns';
import { GoogleCredentials } from '../../create';

export interface DNSRecord {
  type: 'A';
  name: string;    // subdomain.dokimint.com
  content: string; // IP address
  ttl: number;
}

// Generate domain and create DNS record for WhiteNode repositories
export async function setupWhiteNodeDNS(repoName: string, ipAddress: string, credentials: GoogleCredentials): Promise<string> {
  const dnsClient = new DNS({
    projectId: credentials.project_id,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });
  const zoneName = 'whitenode';        // Your actual zone
  const dnsName = 'dokimint.com';      // Your actual domain

  const zone = dnsClient.zone(zoneName);

  // Convert repo name to valid subdomain
  const sanitizedName = repoName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63);

  const subdomain = `${sanitizedName}.${dnsName}`;

  // Create the DNS record change
  const record = zone.record('A', {
    name: `${subdomain}.`,  // DNS format requires trailing dot
    ttl: 300,               // 5 minutes for fast updates
    data: ipAddress
  });

  // Create a change to add the record
  await zone.createChange({
    add: [record]
  });

  console.log(`✅ DNS record created: ${subdomain} → ${ipAddress}`);

  return subdomain; // Return: "my-repo.dokimint.com"
}


