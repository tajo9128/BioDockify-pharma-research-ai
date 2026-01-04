import { llm, webSearch } from 'z-ai-web-dev-sdk';

export interface AIResearchOptions {
  topic: string;
  maxPapers?: number;
  maxEntities?: number;
}

export interface ExtractedEntity {
  name: string;
  type: 'drug' | 'disease' | 'protein' | 'gene';
  description?: string;
  confidence: number;
}

export class AIResearchService {
  /**
   * Perform literature search using AI-powered web search
   */
  static async searchLiterature(topic: string, maxResults: number = 10) {
    try {
      const searchResults = await webSearch({
        query: `${topic} pharmaceutical research recent studies`,
        maxResults,
      });

      return searchResults.results.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        publishedDate: result.publishedDate,
      }));
    } catch (error) {
      console.error('Error in literature search:', error);
      throw new Error('Failed to search literature');
    }
  }

  /**
   * Extract entities from research content using LLM
   */
  static async extractEntities(content: string, maxEntities: number = 50): Promise<ExtractedEntity[]> {
    try {
      const prompt = `Extract and classify pharmaceutical entities from the following research content. 
      Classify entities into: drug, disease, protein, or gene.
      For each entity, provide the name, type, a brief description, and a confidence score (0-1).
      
      Content: ${content}
      
      Return the results in JSON format with the following structure:
      [
        {
          "name": "Entity Name",
          "type": "drug|disease|protein|gene",
          "description": "Brief description",
          "confidence": 0.95
        }
      ]`;

      const response = await llm({
        messages: [
          {
            role: 'system',
            content: 'You are an expert in pharmaceutical research and biomedical entity extraction. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 2000,
      });

      // Parse the response
      const entities = JSON.parse(response.content || '[]');
      return entities.slice(0, maxEntities);
    } catch (error) {
      console.error('Error in entity extraction:', error);
      // Return empty array on error
      return [];
    }
  }

  /**
   * Generate research summary using LLM
   */
  static async generateSummary(topic: string, entities: ExtractedEntity[]): Promise<string> {
    try {
      const entityList = entities.map(e => `${e.type}: ${e.name}`).join(', ');

      const prompt = `Generate a comprehensive research summary on "${topic}" based on the following extracted entities:
      
      Entities: ${entityList}
      
      Include:
      1. Overview of the research area
      2. Key drugs and their mechanisms
      3. Associated diseases and conditions
      4. Important proteins and their roles
      5. Potential research directions
      
      Write in a professional, scientific tone suitable for researchers.`;

      const response = await llm({
        messages: [
          {
            role: 'system',
            content: 'You are an expert pharmaceutical researcher and scientific writer.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        maxTokens: 1500,
      });

      return response.content || '';
    } catch (error) {
      console.error('Error generating summary:', error);
      return '';
    }
  }

  /**
   * Generate relationships between entities using LLM
   */
  static async generateRelationships(entities: ExtractedEntity[]): Promise<Array<{
    source: string;
    target: string;
    relationship: string;
    confidence: number;
  }>> {
    try {
      const entityNames = entities.map(e => e.name).join(', ');

      const prompt = `Identify relationships between the following pharmaceutical entities:
      
      Entities: ${entityNames}
      
      For each relationship, specify:
      1. The source entity
      2. The target entity
      3. The type of relationship (e.g., "treats", "targets", "associated_with", "inhibits", "activates")
      4. Confidence score (0-1)
      
      Return in JSON format:
      [
        {
          "source": "Entity A",
          "target": "Entity B",
          "relationship": "treats",
          "confidence": 0.9
        }
      ]`;

      const response = await llm({
        messages: [
          {
            role: 'system',
            content: 'You are an expert in pharmaceutical relationships and drug mechanisms. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 1500,
      });

      const relationships = JSON.parse(response.content || '[]');
      return relationships;
    } catch (error) {
      console.error('Error generating relationships:', error);
      return [];
    }
  }

  /**
   * Generate research questions using LLM
   */
  static async generateResearchQuestions(topic: string, numQuestions: number = 5): Promise<string[]> {
    try {
      const prompt = `Generate ${numQuestions} important research questions about "${topic}" that would be valuable for pharmaceutical researchers. 
      The questions should be:
      1. Relevant to current research trends
      2. Specific and answerable
      3. Covering different aspects (mechanism, efficacy, safety, clinical applications)
      
      Return only the questions, one per line.`;

      const response = await llm({
        messages: [
          {
            role: 'system',
            content: 'You are an expert pharmaceutical researcher.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        maxTokens: 500,
      });

      const content = response.content || '';
      return content
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0)
        .slice(0, numQuestions);
    } catch (error) {
      console.error('Error generating research questions:', error);
      return [];
    }
  }

  /**
   * Analyze sentiment and relevance of research content
   */
  static async analyzeContent(content: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    relevance: number;
    keyFindings: string[];
  }> {
    try {
      const prompt = `Analyze the following pharmaceutical research content:
      
      Content: ${content}
      
      Provide:
      1. Overall sentiment (positive, neutral, or negative)
      2. Relevance score (0-1)
      3. Top 3 key findings
      
      Return in JSON format:
      {
        "sentiment": "positive|neutral|negative",
        "relevance": 0.95,
        "keyFindings": ["Finding 1", "Finding 2", "Finding 3"]
      }`;

      const response = await llm({
        messages: [
          {
            role: 'system',
            content: 'You are an expert in pharmaceutical research analysis. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 800,
      });

      return JSON.parse(response.content || '{}');
    } catch (error) {
      console.error('Error analyzing content:', error);
      return {
        sentiment: 'neutral',
        relevance: 0.5,
        keyFindings: [],
      };
    }
  }
}

export default AIResearchService;
