import { PageHeader } from '@components/layout/PageHeader';
import { LeadsDashboard } from './LeadsDashboard';

export default function LeadsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Leads"
        subtitle="Unified view of prospects, enriched with AI insights and real-time engagement history."
      />
      <LeadsDashboard />
    </div>
  );
}
