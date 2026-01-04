import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, type } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Generate a sample SiLA XML protocol
    const protocolContent = generateSiLAProtocol(taskId, type);

    return NextResponse.json({
      fileName: `protocol_${taskId}.xml`,
      format: 'xml',
      content: protocolContent,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating protocol:', error);
    return NextResponse.json(
      { error: 'Failed to generate protocol' },
      { status: 500 }
    );
  }
}

function generateSiLAProtocol(taskId: string, type: string): string {
  const timestamp = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<sila:SiLAService xmlns:sila="http://www.sila-standard.org">
  <sila:Protocol id="${taskId}" type="${type}">
    <sila:Metadata>
      <sila:Name>BioDockify Lab Protocol</sila:Name>
      <sila:Version>1.0.0</sila:Version>
      <sila:Created>${timestamp}</sila:Created>
      <sila:Author>BioDockify System</sila:Author>
    </sila:Metadata>

    <sila:Parameters>
      <sila:Parameter name="research_session_id">
        <sila:Value>${taskId}</sila:Value>
      </sila:Parameter>
      <sila:Parameter name="protocol_type">
        <sila:Value>${type}</sila:Value>
      </sila:Parameter>
    </sila:Parameters>

    <sila:Steps>
      <sila:Step id="1" name="Initialize">
        <sila:Command>initialize_system</sila:Command>
        <sila:Parameters>
          <sila:Parameter name="timeout" value="30"/>
        </sila:Parameters>
      </sila:Step>

      <sila:Step id="2" name="Load Data">
        <sila:Command>load_research_data</sila:Command>
        <sila:Parameters>
          <sila:Parameter name="session_id" value="${taskId}"/>
        </sila:Parameters>
      </sila:Step>

      <sila:Step id="3" name="Process Entities">
        <sila:Command>process_entities</sila:Command>
        <sila:Parameters>
          <sila:Parameter name="filter" value="high_confidence"/>
        </sila:Parameters>
      </sila:Step>

      <sila:Step id="4" name="Generate Report">
        <sila:Command>generate_report</sila:Command>
        <sila:Parameters>
          <sila:Parameter name="format" value="${type}"/>
        </sila:Parameters>
      </sila:Step>

      <sila:Step id="5" name="Finalize">
        <sila:Command>finalize_system</sila:Command>
      </sila:Step>
    </sila:Steps>

    <sila:Results>
      <sila:Result name="status" type="string"/>
      <sila:Result name="file_path" type="string"/>
      <sila:Result name="execution_time" type="float"/>
    </sila:Results>
  </sila:Protocol>
</sila:SiLAService>`;
}
