import { UploadCsvForm } from '@components/forms/UploadCsvForm';
import { PageHeader } from '@components/layout/PageHeader';

export default function LeadImportPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Lead import"
        subtitle="Upload CSV files to bulk create or update leads inside Supabase."
      />
      <UploadCsvForm />
    </div>
  );
}
