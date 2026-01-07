import { NextRequest, NextResponse } from 'next/server'
import { AgentZero } from '@/lib/agent-zero'
import { toolRegistry } from '@/lib/tools/tool-registry'
import { memory } from '@/lib/memory'

export async function POST(request: NextRequest) {
    try {
        const { goal, stage } = await request.json()

        // Initialize Agent Zero
        const agent = new AgentZero(toolRegistry.getTools(), memory)

        // Start execution
        const context = await agent.executeGoal(goal, stage)

        return NextResponse.json({
            success: true,
            taskId: context.id,
            message: 'Agent Zero started',
            stage
        })
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
