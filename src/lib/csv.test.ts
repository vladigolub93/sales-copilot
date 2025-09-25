import { parseLeadCsv } from './csv';

describe('parseLeadCsv', () => {
  it('should correctly parse CSV data with standard headers', async () => {
    const csvData = 'Full Name,Email\nJohn Doe,john.doe@example.com';
    const result = await parseLeadCsv(csvData);
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('John Doe');
    expect(result[0].email).toBe('john.doe@example.com');
  });

  it('should normalize headers that are not in the headerMap', async () => {
    const csvData = '"Full Name","Custom Field"\n"Jane Doe","some value"';
    const result = await parseLeadCsv(csvData);
    expect(result[0].fullName).toBe('Jane Doe');
    expect(result[0].customfield).toBe('some value');
  });
});