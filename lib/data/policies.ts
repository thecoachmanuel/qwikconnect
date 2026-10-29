import policiesData from '@/scripts/extracted_policies.json';

export interface PolicyData {
  id: number;
  title: string;
  slug: string;
  content: string;
}

export async function getPolicyBySlug(slug: string): Promise<PolicyData> {
  if (slug === 'privacy-policy') {
    return policiesData.privacy;
  }
  return policiesData.terms;
}
