import Papa from 'papaparse';
import type { LeadCSVRow } from '@types/lead';

const headerMap: Record<string, keyof LeadCSVRow> = {
  fullname: 'fullName',
  title: 'title',
  email: 'email',
  phone: 'phone',
  companyname: 'companyName',
  associatedcompanyid: 'associatedCompanyId',
  linkedin: 'linkedIn',
  personalnotes: 'personalNotes'
};

export function parseLeadCsv(file: File): Promise<LeadCSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<LeadCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader(header: string) {
        const normalized = header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return headerMap[normalized] ?? header;
      },
      complete(result) {
        if (result.errors.length > 0) {
          reject(result.errors);
        } else {
          resolve(result.data);
        }
      },
      error(error) {
        reject(error);
      }
    });
  });
}
