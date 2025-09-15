interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAPIRequest {
  messages: ChatMessage[];
}

export interface ChatAPIResponse {
  response: string;
  classification?: {
    taxonomy_path: string;
    confidence: number;
    matched_keywords: string[];
  };
  documents?: Array<{
    candidate: string;
    party: string;
    score: number;
    content: string;
    taxonomy_path?: string;
  }>;
  total_results?: number;
  tool_calls?: Array<{
    name: string;
    arguments: any;
    result: any;
  }>;
}

export class ChatAPIClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:3000', timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
  }

  async query(question: string): Promise<ChatAPIResponse> {
    const url = `${this.baseUrl}/api/chat`;
    
    const request: ChatAPIRequest = {
      messages: [
        { role: 'user', content: question }
      ]
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // The API returns a streaming response, we need to parse it
      const responseText = await response.text();
      return this.parseStreamingResponse(responseText);

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw new Error(`API request failed: ${error.message}`);
      }
      
      throw error;
    }
  }

  private parseStreamingResponse(responseText: string): ChatAPIResponse {
    // Parse the streaming response format used by the chat API
    // This is a simplified parser - in production you'd want more robust parsing
    
    const result: ChatAPIResponse = {
      response: '',
      classification: undefined,
      documents: [],
      total_results: 0,
      tool_calls: []
    };

    try {
      // Split by lines and process each chunk
      const lines = responseText.split('\n');
      let accumulatedResponse = '';
      let toolCallsData: any[] = [];

      for (const line of lines) {
        if (line.startsWith('data: {"type":"text-delta"')) {
          // New streaming format - extract delta text
          try {
            const jsonStr = line.substring(6); // Remove "data: "
            const data = JSON.parse(jsonStr);
            if (data.type === 'text-delta' && data.delta) {
              accumulatedResponse += data.delta;
            }
          } catch {
            // Handle malformed JSON gracefully
            continue;
          }
        } else if (line.startsWith('0:"')) {
          // Old format - Text content chunk
          try {
            const content = JSON.parse(line.substring(2));
            if (typeof content === 'string') {
              accumulatedResponse += content;
            }
          } catch {
            // Handle malformed JSON gracefully
            continue;
          }
        } else if (line.startsWith('c:[')) {
          // Tool calls or metadata
          try {
            const data = JSON.parse(line.substring(2));
            if (Array.isArray(data)) {
              toolCallsData.push(...data);
            }
          } catch {
            // Handle malformed JSON gracefully
            continue;
          }
        } else if (line.includes('searchPoliticalDocs')) {
          // Try to extract tool call information
          try {
            const toolMatch = line.match(/searchPoliticalDocs.*?({.*?})/);
            if (toolMatch) {
              const toolData = JSON.parse(toolMatch[1]);
              toolCallsData.push({
                name: 'searchPoliticalDocs',
                arguments: toolData,
                result: null
              });
            }
          } catch {
            // Handle parsing errors gracefully
            continue;
          }
        }
      }

      result.response = accumulatedResponse;
      result.tool_calls = toolCallsData;

      // Extract classification and documents from tool calls
      for (const toolCall of toolCallsData) {
        if (toolCall.name === 'searchPoliticalDocs' && toolCall.result) {
          const toolResult = toolCall.result;
          
          if (toolResult.classification) {
            result.classification = {
              taxonomy_path: toolResult.classification.taxonomy_path || 'Unknown',
              confidence: toolResult.classification.confidence || 0,
              matched_keywords: toolResult.classification.matched_keywords || []
            };
          }

          if (toolResult.documents && Array.isArray(toolResult.documents)) {
            result.documents = toolResult.documents.map((doc: any) => ({
              candidate: doc.candidate || 'Unknown',
              party: doc.party || 'Unknown', 
              score: doc.score || 0,
              content: doc.content || '',
              taxonomy_path: doc.taxonomy_path
            }));
          }

          result.total_results = toolResult.total_results || result.documents.length;
        }
      }

      // Fallback: try to extract classification info from response text
      if (!result.classification && accumulatedResponse) {
        const classificationMatch = accumulatedResponse.match(/clasificación:\s*([^,\n]+)/i);
        if (classificationMatch) {
          result.classification = {
            taxonomy_path: classificationMatch[1].trim(),
            confidence: 0.5, // Default confidence when extracted from text
            matched_keywords: []
          };
        }
      }

      return result;

    } catch (error) {
      console.warn('Warning: Error parsing streaming response, returning partial data:', error);
      return {
        response: responseText.substring(0, 1000), // Truncate if too long
        classification: undefined,
        documents: [],
        total_results: 0
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testResponse = await this.query('test de conectividad');
      return testResponse.response.length > 0;
    } catch {
      return false;
    }
  }

  updateBaseUrl(newUrl: string): void {
    this.baseUrl = newUrl.replace(/\/$/, '');
  }

  setTimeout(timeoutMs: number): void {
    this.timeout = timeoutMs;
  }
}