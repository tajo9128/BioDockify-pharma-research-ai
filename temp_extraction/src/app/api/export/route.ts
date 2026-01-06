import { NextRequest, NextResponse } from 'next/server';

// Export types
export type ExportFormat = 'pdf' | 'docx' | 'xlsx' | 'txt' | 'markdown';

export async function POST(request: NextRequest) {
  try {
    const { format = 'txt', data, taskId } = await request.json();

    // Validate format
    const validFormats: ExportFormat[] = ['pdf', 'docx', 'xlsx', 'txt', 'markdown'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate data
    if (!data && !taskId) {
      return NextResponse.json(
        { error: 'Either data or taskId must be provided' },
        { status: 400 }
      );
    }

    let exportData = data;

    // Fetch data from database if taskId is provided
    if (taskId && !data) {
      const { db } = await import('@/lib/db');
      const task = await db.researchTask.findUnique({
        where: { id: taskId },
        include: { results: true }
      });

      if (task && task.results) {
        exportData = JSON.parse(task.results);
      } else {
        return NextResponse.json(
          { error: 'Research task not found or has no results' },
          { status: 404 }
        );
      }
    }

    // Generate content based on format
    let content: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'pdf':
        content = generatePDFContent(exportData);
        contentType = 'application/pdf';
        filename = `research-${exportData.topic || 'results'}.pdf`;
        break;

      case 'docx':
        content = generateDOCXContent(exportData);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `research-${exportData.topic || 'results'}.docx`;
        break;

      case 'xlsx':
        content = generateXLSXContent(exportData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `research-${exportData.topic || 'results'}.xlsx`;
        break;

      case 'markdown':
        content = generateMarkdownContent(exportData);
        contentType = 'text/markdown';
        filename = `research-${exportData.topic || 'results'}.md`;
        break;

      case 'txt':
      default:
        content = generateTextContent(exportData);
        contentType = 'text/plain';
        filename = `research-${exportData.topic || 'results'}.txt`;
        break;
    }

    // Return file
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error generating export:', error);
    return NextResponse.json(
      { error: 'Failed to generate export', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generatePDFContent(data: any): string {
  // For simplicity, we'll create a text-based PDF
  // In production, use PDF skill or jsPDF
  const content = generateTextContent(data);

  // Add PDF-like formatting
  return `%PDF-1.4
1 0 obj
<< /Length ${content.length + 100} >>
stream
BT
/F1 12 Tf
100 700 Td
(Research Results) Tj
ET
endstream
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /Resources <<
/Font <<
/F1 5 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 1 0 R
>>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000159 00000 n
0000000261 00000 n
trailer
<< /Size 6 /Root 2 0 R >>
startxref
${content.length + 500}
%%EOF`;
}

function generateDOCXContent(data: any): string {
  // Simple DOCX-like content (XML format)
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>${data.title || 'Research Results'}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>Topic: ${data.topic || 'N/A'}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>Mode: ${data.mode || 'N/A'}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>Date: ${data.timestamp || new Date().toISOString()}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r><w:br/></w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:b/>
      </w:pPr>
      <w:r>
        <w:t>Summary</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>${data.summary || 'No summary available'}</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r><w:br/></w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:b/>
      </w:pPr>
      <w:r>
        <w:t>Findings</w:t>
      </w:r>
    </w:p>

    ${(data.findings || []).map((f: string) => `
    <w:p>
      <w:pPr>
        <w:listPr>
          <w:ilvl w:ilvl="0">
            <w:start w:val="1"/>
          </w:ilvl>
        </w:listPr>
      </w:pPr>
      <w:r>
        <w:t>${f}</w:t>
      </w:r>
    </w:p>
    `).join('\n')}
  </w:body>
</w:document>`;
}

function generateXLSXContent(data: any): string {
  // Simple XLSX-like content (XML format)
  const findings = data.findings || [];

  return `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <table>
    <row>
      <cell><v>Topic</v></cell><v>${data.topic || 'N/A'}</v></cell>
    </row>
    <row>
      <cell><v>Mode</v></cell><v>${data.mode || 'N/A'}</v></cell>
    </row>
    <row>
      <cell><v>Date</v></cell><v>${data.timestamp || new Date().toISOString()}</v></cell>
    </row>
    <row><cell><v>Summary</v></cell><v>${data.summary || 'No summary available'}</v></cell></row>
    <row><cell><v>Findings</v></cell></row>
    ${findings.map((f: string, i: number) => `
    <row>
      <cell><v>${i + 1}.</v></cell><v>${f}</v></cell>
    </row>
    `).join('\n')}
  </table>
</worksheet>`;
}

function generateMarkdownContent(data: any): string {
  let markdown = `# ${data.title || 'Research Results'}

---

## Research Details

- **Topic:** ${data.topic || 'N/A'}
- **Mode:** ${data.mode || 'N/A'}
- **Date:** ${data.timestamp || new Date().toISOString()}
- **Provider:** ${data.metadata?.processingTime || 'AI-powered'}

---

## Summary

${data.summary || 'No summary available.'}

---

## Key Findings

${(data.findings || []).map((f: string) => `- ${f}`).join('\n')}

---

${data.drugs && data.drugs.length > 0 ? `
## Identified Drugs/Compounds

${data.drugs.map((d: any) => `- **${d.name}** (confidence: ${d.confidence})`).join('\n')}
` : ''}

${data.mechanisms && data.mechanisms.length > 0 ? `
## Mechanisms

${data.mechanisms.map((m: any) => `- **${m.name}**`).join('\n')}
` : ''}

${data.entities && data.entities.diseases && data.entities.diseases.length > 0 ? `
## Diseases/Conditions

${data.entities.diseases.map((d: any) => `- **${d.name}**`).join('\n')}
` : ''}

---

## Full Analysis

${data.fullText || 'No detailed analysis available.'}

---

## Suggestions

${data.metadata?.suggestions
  ? data.metadata.suggestions.map((s: string) => `- ${s}`).join('\n')
  : 'No suggestions available.'
}

---

*Generated by PharmaResearch AI*
`;

  return markdown;
}

function generateTextContent(data: any): string {
  let text = `
════════════════════════════════════════════════════════
          PHARMACEUTICAL RESEARCH AI - RESULTS
════════════════════════════════════════════════════════

TOPIC: ${data.topic || 'N/A'}
MODE: ${data.mode || 'N/A'}
DATE: ${data.timestamp || new Date().toISOString()}

────────────────────────────────────────────────────────────────

SUMMARY
────────────────────────────────────────────────────────────────
${data.summary || 'No summary available.'}

────────────────────────────────────────────────────────────────

KEY FINDINGS
────────────────────────────────────────────────────────────────
${(data.findings || []).map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}

────────────────────────────────────────────────────────────────`;

  if (data.drugs && data.drugs.length > 0) {
    text += `\n
IDENTIFIED DRUGS/COMPOUNDS
────────────────────────────────────────────────────────────────
${data.drugs.map((d: any) => `• ${d.name} (confidence: ${d.confidence})`).join('\n')}
`;
  }

  if (data.mechanisms && data.mechanisms.length > 0) {
    text += `\n
MECHANISMS
────────────────────────────────────────────────────────────────
${data.mechanisms.map((m: any) => `• ${m.name}`).join('\n')}
`;
  }

  text += `\n
────────────────────────────────────────────────────────────────
FULL ANALYSIS
────────────────────────────────────────────────────────────────
${data.fullText || 'No detailed analysis available.'}

────────────────────────────────────────────────────────────────
Generated by PharmaResearch AI
════════════════════════════════════════════════════════
`;

  return text;
}
