export async function checkServices() {
    const services = {
        grobid: process.env.GROBID_URL || 'http://localhost:8070',
        neo4j: process.env.NEO4J_URI || 'bolt://localhost:7687',
        ollama: process.env.OLLAMA_URL || 'http://localhost:11434'
    }

    const health = {
        grobid: false,
        neo4j: false,
        ollama: false
    }

    try {
        const grobidRes = await fetch(`${services.grobid}/api/version`)
        health.grobid = grobidRes.ok
    } catch (e) {
        console.error('GROBID not available')
    }

    try {
        const ollamaRes = await fetch(`${services.ollama}/api/tags`)
        health.ollama = ollamaRes.ok
    } catch (e) {
        console.error('Ollama not available')
    }

    // Add Neo4j health check using bolt connection

    return health
}
