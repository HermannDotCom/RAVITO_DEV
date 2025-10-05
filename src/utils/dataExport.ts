export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = columns
    ? columns.map((col) => col.key)
    : (Object.keys(data[0]) as (keyof T)[]);

  const headers = columns
    ? columns.map((col) => col.header)
    : keys.map((key) => String(key));

  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          if (value === null || value === undefined) return '';

          const stringValue = String(value);

          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }

          return stringValue;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const exportToJSON = <T>(data: T[], filename: string): void => {
  const jsonContent = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonContent], {
    type: 'application/json',
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1',
  columns?: { key: keyof T; header: string }[]
): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = columns
    ? columns.map((col) => col.key)
    : (Object.keys(data[0]) as (keyof T)[]);

  const headers = columns
    ? columns.map((col) => col.header)
    : keys.map((key) => String(key));

  let xmlContent = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${sheetName}">
  <Table>
   <Row>`;

  headers.forEach((header) => {
    xmlContent += `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`;
  });

  xmlContent += '</Row>';

  data.forEach((row) => {
    xmlContent += '<Row>';
    keys.forEach((key) => {
      const value = row[key];
      const stringValue = value === null || value === undefined ? '' : String(value);
      const type = typeof value === 'number' ? 'Number' : 'String';
      xmlContent += `<Cell><Data ss:Type="${type}">${escapeXml(stringValue)}</Data></Cell>`;
    });
    xmlContent += '</Row>';
  });

  xmlContent += `
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], {
    type: 'application/vnd.ms-excel',
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
};

export const printTable = <T extends Record<string, any>>(
  data: T[],
  title: string,
  columns?: { key: keyof T; header: string }[]
): void => {
  if (data.length === 0) {
    console.warn('No data to print');
    return;
  }

  const keys = columns
    ? columns.map((col) => col.key)
    : (Object.keys(data[0]) as (keyof T)[]);

  const headers = columns
    ? columns.map((col) => col.header)
    : keys.map((key) => String(key));

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Unable to open print window');
    return;
  }

  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #4CAF50;
      color: white;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    @media print {
      button {
        display: none;
      }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <table>
    <thead>
      <tr>
        ${headers.map((header) => `<th>${header}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (row) =>
            `<tr>${keys
              .map((key) => {
                const value = row[key];
                return `<td>${value === null || value === undefined ? '' : value}</td>`;
              })
              .join('')}</tr>`
        )
        .join('')}
    </tbody>
  </table>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
