import { PageHeader } from '@components/layout/PageHeader';
import { CompaniesDashboard } from './CompaniesDashboard';

export default function CompaniesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Companies"
        subtitle="Account-level view combining firmographics, investment signals, and AI-generated insights."
      />
      <CompaniesDashboard />
    </div>
  );
}
