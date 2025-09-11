"use node";

import { DNS } from '@google-cloud/dns';
import { GoogleCredentials } from '@/convex/application/machine/action/services/create';

export async function cleanupDNSRecord(repositoryName: string, credentials: GoogleCredentials): Promise<void> {
  console.log(`🗑️ Starting DNS cleanup for repository: ${repositoryName}`);

  try {
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

    const sanitizedName = repositoryName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 63);

    const subdomain = `${sanitizedName}.${dnsName}`;

    // First get the existing record
    const [records] = await zone.getRecords({
      name: `${subdomain}.`,
      type: 'A'
    });

    if (records.length > 0) {
      // Create a change to delete the record
      const change = await zone.createChange({
        delete: records
      });

      console.log(`🗑️ DNS record deleted: ${subdomain}`);
      console.log(`📝 Change ID: ${change[0].id}`);
    } else {
      console.log(`⚠️ No DNS record found for: ${subdomain}`);
    }
  } catch (dnsError) {
    console.log(`⚠️ DNS cleanup failed (might not exist): ${dnsError instanceof Error ? dnsError.message : dnsError}`);
  }

  console.log(`✅ DNS cleanup completed for repository: ${repositoryName}`);
}
