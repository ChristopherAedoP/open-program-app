import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export interface EvaluationResult {
  final_score: number;
  ai_component: {
    score: number;
    weight: number;
    details: AIEvaluationDetails;
  };
  heuristic_component: {
    score: number;
    weight: number;
    details: HeuristicDetails;
  };
  pattern_component: {
    score: number;
    weight: number;
    details: PatternDetails;
  };
  verdict: 'PASS' | 'FAIL' | 'CRITICAL';
  issues: string[];
  recommendations: string[];
}

interface AIEvaluationDetails {
  relevance_score: number;
  completeness_score: number;
  accuracy_score: number;
  source_quality_score: number;
  reasoning: string;
  identified_issues: string[];
}

interface HeuristicDetails {
  documents_found: boolean;
  response_length_adequate: boolean;
  classification_confidence_high: boolean;
  not_generic_response: boolean;
  breakdown: Record<string, number>;
}

interface PatternDetails {
  mentions_candidates: boolean;
  correct_classification: boolean;
  has_substantive_content: boolean;
  contains_specific_proposals: boolean;
  breakdown: Record<string, number>;
}

export class HybridEvaluator {
  constructor() {
    // Environment variables are automatically loaded by Vercel AI SDK
  }

  async evaluate(
    question: string,
    response: string,
    classification: any,
    documents: any[],
    category: string
  ): Promise<EvaluationResult> {
    console.log(`🔍 Evaluating question: "${question.substring(0, 60)}..."`);

    try {
      // Execute all evaluations in parallel
      const [aiEval, heuristicEval, patternEval] = await Promise.all([
        this.evaluateWithAI(question, response, documents, category),
        this.evaluateHeuristics(response, classification, documents),
        this.evaluatePatterns(question, response, classification, documents)
      ]);

      // Weight the components
      const weights = { ai: 0.7, heuristic: 0.2, pattern: 0.1 };
      
      const finalScore = (
        aiEval.score * weights.ai +
        heuristicEval.score * weights.heuristic +
        patternEval.score * weights.pattern
      );

      // Determine verdict
      const verdict = this.determineVerdict(finalScore, aiEval, heuristicEval, patternEval);

      // Collect all issues and recommendations
      const issues = [
        ...aiEval.details.identified_issues,
        ...this.getHeuristicIssues(heuristicEval),
        ...this.getPatternIssues(patternEval)
      ];

      const recommendations = this.generateRecommendations(aiEval, heuristicEval, patternEval, classification);

      return {
        final_score: Math.round(finalScore * 100) / 100,
        ai_component: {
          score: aiEval.score,
          weight: weights.ai,
          details: aiEval.details
        },
        heuristic_component: {
          score: heuristicEval.score,
          weight: weights.heuristic,
          details: heuristicEval.details
        },
        pattern_component: {
          score: patternEval.score,
          weight: weights.pattern,
          details: patternEval.details
        },
        verdict,
        issues: [...new Set(issues)],
        recommendations: [...new Set(recommendations)]
      };

    } catch (error) {
      console.error('❌ Error in hybrid evaluation:', error);
      return this.createErrorResult(error);
    }
  }

  private async evaluateWithAI(
    question: string,
    response: string,
    documents: any[],
    category: string
  ): Promise<{ score: number; details: AIEvaluationDetails }> {
    
    const evaluationPrompt = `
Eres un experto evaluador de chatbots políticos chilenos. Evalúa esta respuesta:

PREGUNTA: "${question}"
CATEGORÍA ESPERADA: "${category}"
RESPUESTA: "${response}"
DOCUMENTOS ENCONTRADOS: ${documents.length}

Evalúa en escala 0-100 estos criterios específicos:

1. RELEVANCIA (0-100): ¿La respuesta corresponde directamente a la pregunta política chilena?
2. COMPLETITUD (0-100): ¿Cubre los aspectos políticos principales que un ciudadano esperaría?
3. PRECISIÓN (0-100): ¿La información es precisa para el contexto político chileno 2025?
4. CALIDAD DE FUENTES (0-100): ¿Los ${documents.length} documentos encontrados son apropiados para responder?

RESPONDE SOLO EN ESTE FORMATO JSON:
{
  "relevance_score": [0-100],
  "completeness_score": [0-100],
  "accuracy_score": [0-100],
  "source_quality_score": [0-100],
  "overall_score": [promedio de los 4],
  "identified_issues": ["issue1", "issue2"],
  "reasoning": "Explicación breve en 1-2 frases"
}`;

    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: evaluationPrompt,
        temperature: 0.1,
        maxTokens: 500
      });

      // Clean the response to extract JSON from markdown if needed
      let jsonText = text || '{}';
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }
      
      const result = JSON.parse(jsonText);
      
      return {
        score: result.overall_score / 100,
        details: {
          relevance_score: result.relevance_score,
          completeness_score: result.completeness_score,
          accuracy_score: result.accuracy_score,
          source_quality_score: result.source_quality_score,
          reasoning: result.reasoning || 'No reasoning provided',
          identified_issues: result.identified_issues || []
        }
      };

    } catch (error) {
      console.warn('⚠️ AI evaluation failed, using fallback:', error);
      return {
        score: 0.5, // Neutral score on failure
        details: {
          relevance_score: 50,
          completeness_score: 50,
          accuracy_score: 50,
          source_quality_score: 50,
          reasoning: 'AI evaluation failed',
          identified_issues: ['AI evaluation error']
        }
      };
    }
  }

  private evaluateHeuristics(
    response: string,
    classification: any,
    documents: any[]
  ): { score: number; details: HeuristicDetails } {
    
    const checks = {
      documents_found: documents.length > 0,
      response_length_adequate: response.length >= 100 && response.length <= 2000,
      classification_confidence_high: classification?.confidence > 0.8,
      not_generic_response: !response.toLowerCase().includes('no se encontraron documentos específicos')
    };

    const scoring = {
      documents_found: checks.documents_found ? 40 : -40,
      response_length_adequate: checks.response_length_adequate ? 10 : -20,
      classification_confidence_high: checks.classification_confidence_high ? 20 : -10,
      not_generic_response: checks.not_generic_response ? 30 : -30
    };

    // Bonus for multiple documents
    if (documents.length > 5) scoring.documents_found += 10;
    if (documents.length > 10) scoring.documents_found += 5;

    const totalScore = Object.values(scoring).reduce((sum, score) => sum + score, 50);
    const normalizedScore = Math.max(0, Math.min(100, totalScore)) / 100;

    return {
      score: normalizedScore,
      details: {
        ...checks,
        breakdown: scoring
      }
    };
  }

  private evaluatePatterns(
    question: string,
    response: string,
    classification: any,
    documents: any[]
  ): { score: number; details: PatternDetails } {
    
    const responseLower = response.toLowerCase();
    
    const checks = {
      mentions_candidates: /\b(parisi|boric|kast|provoste|sichel|artés)\b/i.test(response),
      correct_classification: this.validateClassification(question, classification),
      has_substantive_content: response.length > 200 && documents.length > 0,
      contains_specific_proposals: this.hasSpecificProposals(response)
    };

    const scoring = {
      mentions_candidates: checks.mentions_candidates ? 25 : 0,
      correct_classification: checks.correct_classification ? 35 : -20,
      has_substantive_content: checks.has_substantive_content ? 25 : -15,
      contains_specific_proposals: checks.contains_specific_proposals ? 15 : 0
    };

    const totalScore = Object.values(scoring).reduce((sum, score) => sum + score, 0);
    const normalizedScore = Math.max(0, Math.min(100, totalScore)) / 100;

    return {
      score: normalizedScore,
      details: {
        ...checks,
        breakdown: scoring
      }
    };
  }

  private validateClassification(question: string, classification: any): boolean {
    if (!classification?.category) return false;

    const questionLower = question.toLowerCase();
    const categoryLower = classification.category.toLowerCase();

    // Basic category validation
    const categoryKeywords: Record<string, string[]> = {
      'pensiones': ['pensión', 'afp', 'jubilación', 'previsional', 'adulto mayor'],
      'salud': ['salud', 'isapre', 'fonasa', 'hospital', 'médico', 'medicamento'],
      'educación': ['educación', 'universidad', 'colegio', 'liceo', 'estudiante', 'cae'],
      'trabajo': ['trabajo', 'empleo', 'salario', 'laboral', 'sindicato'],
      'economía': ['economía', 'inflación', 'precio', 'impuesto', 'pib', 'crecimiento'],
      'seguridad': ['seguridad', 'delincuencia', 'carabineros', 'crimen', 'narcotráfico'],
      'vivienda': ['vivienda', 'casa', 'arriendo', 'campamento', 'déficit habitacional'],
      'medioambiente': ['agua', 'energía', 'contaminación', 'sequía', 'litio', 'renovable'],
      'regiones': ['región', 'regional', 'descentralización', 'territorio'],
      'institucionalidad': ['constitución', 'política', 'democracia', 'transparencia', 'corrupción']
    };

    const expectedKeywords = categoryKeywords[categoryLower] || [];
    return expectedKeywords.some(keyword => questionLower.includes(keyword));
  }

  private hasSpecificProposals(response: string): boolean {
    const proposalIndicators = [
      'propone', 'plantea', 'plan', 'medida', 'política', 'estrategia',
      'proyecto', 'iniciativa', 'reforma', 'programa', '%', 'millones',
      'años', 'plazo', 'meta', 'objetivo'
    ];

    const responseLower = response.toLowerCase();
    const matches = proposalIndicators.filter(indicator => 
      responseLower.includes(indicator)
    );

    return matches.length >= 2;
  }

  private determineVerdict(
    finalScore: number,
    aiEval: any,
    heuristicEval: any,
    patternEval: any
  ): 'PASS' | 'FAIL' | 'CRITICAL' {
    
    if (finalScore < 0.4) return 'CRITICAL';
    if (finalScore < 0.6) return 'FAIL';
    
    // Additional critical checks
    if (!heuristicEval.details.documents_found && aiEval.details.source_quality_score < 20) {
      return 'CRITICAL';
    }

    return 'PASS';
  }

  private getHeuristicIssues(heuristicEval: any): string[] {
    const issues = [];
    if (!heuristicEval.details.documents_found) issues.push('No documents found');
    if (!heuristicEval.details.response_length_adequate) issues.push('Response length inadequate');
    if (!heuristicEval.details.classification_confidence_high) issues.push('Low classification confidence');
    if (!heuristicEval.details.not_generic_response) issues.push('Generic response');
    return issues;
  }

  private getPatternIssues(patternEval: any): string[] {
    const issues = [];
    if (!patternEval.details.mentions_candidates) issues.push('No candidates mentioned');
    if (!patternEval.details.correct_classification) issues.push('Incorrect classification');
    if (!patternEval.details.has_substantive_content) issues.push('Lacks substantive content');
    if (!patternEval.details.contains_specific_proposals) issues.push('No specific proposals');
    return issues;
  }

  private generateRecommendations(aiEval: any, heuristicEval: any, patternEval: any, classification: any): string[] {
    const recommendations = [];
    
    if (!heuristicEval.details.documents_found) {
      recommendations.push('Check document indexing and taxonomy mapping');
    }
    
    if (!patternEval.details.correct_classification) {
      recommendations.push('Review query classification algorithm');
    }
    
    if (aiEval.details.completeness_score < 60) {
      recommendations.push('Improve response completeness - add more context');
    }
    
    if (aiEval.details.source_quality_score < 60) {
      recommendations.push('Review document chunking and embedding quality');
    }

    return recommendations;
  }

  private createErrorResult(error: any): EvaluationResult {
    return {
      final_score: 0,
      ai_component: { score: 0, weight: 0.7, details: { relevance_score: 0, completeness_score: 0, accuracy_score: 0, source_quality_score: 0, reasoning: 'Evaluation failed', identified_issues: ['System error'] } },
      heuristic_component: { score: 0, weight: 0.2, details: { documents_found: false, response_length_adequate: false, classification_confidence_high: false, not_generic_response: false, breakdown: {} } },
      pattern_component: { score: 0, weight: 0.1, details: { mentions_candidates: false, correct_classification: false, has_substantive_content: false, contains_specific_proposals: false, breakdown: {} } },
      verdict: 'CRITICAL',
      issues: ['System evaluation error'],
      recommendations: ['Check system logs and fix evaluation pipeline']
    };
  }
}