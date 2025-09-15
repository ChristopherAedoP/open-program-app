import fs from 'fs/promises';
import path from 'path';
import { TestQuestion } from './question-parser';
import { EvaluationResult } from './hybrid-evaluator';

export interface TestSession {
  session_id: string;
  timestamp: string;
  total_questions: number;
  completed: number;
  avg_score: number;
  pass_rate: number;
  pass_count: number;
  fail_count: number;
  critical_count: number;
  duration_minutes: number;
  cost_estimate_usd: number;
}

export interface DetailedResult {
  question_id: number;
  question: string;
  category: string;
  expected_topics: string[];
  difficulty: string;
  query_sent: string;
  classification: {
    taxonomy_path: string;
    confidence: number;
    matched_keywords: string[];
  };
  documents_found: number;
  response: string;
  response_length: number;
  evaluation: EvaluationResult;
  timestamp: string;
  processing_time_ms: number;
}

export interface CategoryPerformance {
  category: string;
  total_questions: number;
  avg_score: number;
  pass_rate: number;
  pass_count: number;
  fail_count: number;
  critical_count: number;
  common_issues: string[];
  top_performing_question: number | null;
  worst_performing_question: number | null;
}

export interface FailureAnalysis {
  failure_type: string;
  count: number;
  percentage: number;
  affected_questions: number[];
  recommended_action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TestResults {
  session_summary: TestSession;
  detailed_results: DetailedResult[];
  category_performance: CategoryPerformance[];
  failure_analysis: FailureAnalysis[];
  recommendations: string[];
  system_health: {
    api_availability: number;
    avg_response_time: number;
    classification_accuracy: number;
    document_retrieval_rate: number;
  };
}

export class TestLogger {
  private results: TestResults;
  private startTime: Date;
  private sessionId: string;
  private outputDir: string;

  constructor(outputDir: string = 'test-results') {
    this.outputDir = outputDir;
    this.startTime = new Date();
    this.sessionId = `test-${this.startTime.toISOString().replace(/[:.]/g, '-')}`;
    
    this.results = {
      session_summary: {
        session_id: this.sessionId,
        timestamp: this.startTime.toISOString(),
        total_questions: 0,
        completed: 0,
        avg_score: 0,
        pass_rate: 0,
        pass_count: 0,
        fail_count: 0,
        critical_count: 0,
        duration_minutes: 0,
        cost_estimate_usd: 0
      },
      detailed_results: [],
      category_performance: [],
      failure_analysis: [],
      recommendations: [],
      system_health: {
        api_availability: 100,
        avg_response_time: 0,
        classification_accuracy: 0,
        document_retrieval_rate: 0
      }
    };
  }

  async initializeSession(totalQuestions: number): Promise<void> {
    this.results.session_summary.total_questions = totalQuestions;
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    console.log(`📊 Test session ${this.sessionId} initialized for ${totalQuestions} questions`);
    console.log(`📁 Results will be saved to: ${this.outputDir}`);
  }

  logQuestionResult(
    question: TestQuestion,
    querySent: string,
    classification: any,
    documentsFound: number,
    response: string,
    evaluation: EvaluationResult,
    processingTime: number
  ): void {
    
    const detailedResult: DetailedResult = {
      question_id: question.id,
      question: question.question,
      category: question.category,
      expected_topics: question.expectedTopics,
      difficulty: question.difficulty,
      query_sent: querySent,
      classification: {
        taxonomy_path: classification?.taxonomy_path || 'Unknown',
        confidence: classification?.confidence || 0,
        matched_keywords: classification?.matched_keywords || []
      },
      documents_found: documentsFound,
      response: response,
      response_length: response.length,
      evaluation: evaluation,
      timestamp: new Date().toISOString(),
      processing_time_ms: processingTime
    };

    this.results.detailed_results.push(detailedResult);
    this.results.session_summary.completed++;

    // Update running statistics
    this.updateRunningStats();
    
    const status = evaluation.verdict === 'PASS' ? '✅' : 
                  evaluation.verdict === 'FAIL' ? '⚠️' : '❌';
    
    console.log(`${status} Q${question.id}: ${evaluation.final_score.toFixed(1)}% | ${evaluation.verdict} | ${processingTime}ms`);
  }

  private updateRunningStats(): void {
    const completed = this.results.detailed_results;
    if (completed.length === 0) return;

    const totalScore = completed.reduce((sum, result) => sum + result.evaluation.final_score, 0);
    this.results.session_summary.avg_score = totalScore / completed.length;

    this.results.session_summary.pass_count = completed.filter(r => r.evaluation.verdict === 'PASS').length;
    this.results.session_summary.fail_count = completed.filter(r => r.evaluation.verdict === 'FAIL').length;
    this.results.session_summary.critical_count = completed.filter(r => r.evaluation.verdict === 'CRITICAL').length;
    
    this.results.session_summary.pass_rate = (this.results.session_summary.pass_count / completed.length) * 100;

    // Cost estimate: ~$0.01 per question for GPT-4o-mini
    this.results.session_summary.cost_estimate_usd = completed.length * 0.01;

    // System health metrics
    const avgResponseTime = completed.reduce((sum, r) => sum + r.processing_time_ms, 0) / completed.length;
    this.results.system_health.avg_response_time = avgResponseTime;

    const documentsFoundRate = completed.filter(r => r.documents_found > 0).length / completed.length;
    this.results.system_health.document_retrieval_rate = documentsFoundRate * 100;

    const classificationAccuracy = completed.filter(r => 
      r.evaluation.pattern_component.details.correct_classification
    ).length / completed.length;
    this.results.system_health.classification_accuracy = classificationAccuracy * 100;
  }

  async finalizeSession(): Promise<string> {
    const endTime = new Date();
    this.results.session_summary.duration_minutes = (endTime.getTime() - this.startTime.getTime()) / (1000 * 60);
    
    // Generate category performance analysis
    this.results.category_performance = this.generateCategoryPerformance();
    
    // Generate failure analysis
    this.results.failure_analysis = this.generateFailureAnalysis();
    
    // Generate recommendations
    this.results.recommendations = this.generateRecommendations();

    // Save results to file
    const outputFile = path.join(this.outputDir, `${this.sessionId}.json`);
    await fs.writeFile(outputFile, JSON.stringify(this.results, null, 2));

    // Generate summary report
    const summaryFile = path.join(this.outputDir, `${this.sessionId}-summary.md`);
    await this.generateSummaryReport(summaryFile);

    console.log(`\n📊 Test session completed:`);
    console.log(`   Total: ${this.results.session_summary.completed}/${this.results.session_summary.total_questions}`);
    console.log(`   Pass Rate: ${this.results.session_summary.pass_rate.toFixed(1)}%`);
    console.log(`   Avg Score: ${this.results.session_summary.avg_score.toFixed(1)}%`);
    console.log(`   Duration: ${this.results.session_summary.duration_minutes.toFixed(1)} minutes`);
    console.log(`   Cost: $${this.results.session_summary.cost_estimate_usd.toFixed(2)}`);
    console.log(`\n📁 Results saved to:`);
    console.log(`   Full results: ${outputFile}`);
    console.log(`   Summary: ${summaryFile}`);

    return outputFile;
  }

  private generateCategoryPerformance(): CategoryPerformance[] {
    const categoryGroups = new Map<string, DetailedResult[]>();
    
    for (const result of this.results.detailed_results) {
      if (!categoryGroups.has(result.category)) {
        categoryGroups.set(result.category, []);
      }
      categoryGroups.get(result.category)!.push(result);
    }

    return Array.from(categoryGroups.entries()).map(([category, results]) => {
      const totalQuestions = results.length;
      const avgScore = results.reduce((sum, r) => sum + r.evaluation.final_score, 0) / totalQuestions;
      const passCount = results.filter(r => r.evaluation.verdict === 'PASS').length;
      const failCount = results.filter(r => r.evaluation.verdict === 'FAIL').length;
      const criticalCount = results.filter(r => r.evaluation.verdict === 'CRITICAL').length;
      
      // Common issues in this category
      const allIssues = results.flatMap(r => r.evaluation.issues);
      const issueFreq = allIssues.reduce((freq, issue) => {
        freq[issue] = (freq[issue] || 0) + 1;
        return freq;
      }, {} as Record<string, number>);
      
      const commonIssues = Object.entries(issueFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([issue, count]) => `${issue} (${count}x)`);

      // Best and worst performing questions
      const sortedByScore = results.sort((a, b) => b.evaluation.final_score - a.evaluation.final_score);
      
      return {
        category,
        total_questions: totalQuestions,
        avg_score: avgScore,
        pass_rate: (passCount / totalQuestions) * 100,
        pass_count: passCount,
        fail_count: failCount,
        critical_count: criticalCount,
        common_issues: commonIssues,
        top_performing_question: sortedByScore[0]?.question_id || null,
        worst_performing_question: sortedByScore[sortedByScore.length - 1]?.question_id || null
      };
    }).sort((a, b) => b.avg_score - a.avg_score);
  }

  private generateFailureAnalysis(): FailureAnalysis[] {
    const failureTypes = new Map<string, number[]>();
    
    for (const result of this.results.detailed_results) {
      if (result.evaluation.verdict !== 'PASS') {
        for (const issue of result.evaluation.issues) {
          if (!failureTypes.has(issue)) {
            failureTypes.set(issue, []);
          }
          failureTypes.get(issue)!.push(result.question_id);
        }
      }
    }

    const totalFailed = this.results.session_summary.fail_count + this.results.session_summary.critical_count;
    
    return Array.from(failureTypes.entries()).map(([failureType, questionIds]) => {
      const count = questionIds.length;
      const percentage = (count / totalFailed) * 100;
      
      return {
        failure_type: failureType,
        count,
        percentage,
        affected_questions: questionIds,
        recommended_action: this.getRecommendedAction(failureType),
        priority: this.getPriority(failureType, percentage)
      };
    }).sort((a, b) => b.count - a.count);
  }

  private getRecommendedAction(failureType: string): string {
    const actionMap: Record<string, string> = {
      'No documents found': 'Review document indexing and taxonomy mapping',
      'Incorrect classification': 'Improve query classification algorithm',
      'Generic response': 'Enhance response generation with more specific content',
      'Low classification confidence': 'Review and expand taxonomy keywords',
      'No candidates mentioned': 'Ensure response includes relevant candidate information',
      'Lacks substantive content': 'Improve document chunking and content extraction',
      'AI evaluation error': 'Check API connectivity and error handling'
    };
    
    return actionMap[failureType] || 'Investigate specific failure pattern';
  }

  private getPriority(failureType: string, percentage: number): 'high' | 'medium' | 'low' {
    if (percentage > 30 || failureType.includes('No documents found')) return 'high';
    if (percentage > 15 || failureType.includes('classification')) return 'medium';
    return 'low';
  }

  private generateRecommendations(): string[] {
    const recommendations = [];
    
    // Based on overall performance
    if (this.results.session_summary.pass_rate < 70) {
      recommendations.push('CRITICAL: Overall pass rate below 70% - comprehensive system review needed');
    }
    
    if (this.results.system_health.document_retrieval_rate < 60) {
      recommendations.push('HIGH: Low document retrieval rate - check Qdrant indexing and query processing');
    }
    
    if (this.results.system_health.classification_accuracy < 75) {
      recommendations.push('HIGH: Classification accuracy below 75% - review taxonomy and keyword mapping');
    }
    
    // Based on category performance
    const poorCategories = this.results.category_performance.filter(cat => cat.pass_rate < 60);
    if (poorCategories.length > 0) {
      recommendations.push(`MEDIUM: Poor performance in categories: ${poorCategories.map(c => c.category).join(', ')}`);
    }
    
    // Based on failure analysis
    const highPriorityFailures = this.results.failure_analysis.filter(f => f.priority === 'high');
    for (const failure of highPriorityFailures) {
      recommendations.push(`HIGH: ${failure.recommended_action} (affects ${failure.count} questions)`);
    }
    
    if (this.results.session_summary.avg_score > 80) {
      recommendations.push('POSITIVE: Good overall performance - focus on edge cases and optimization');
    }
    
    return recommendations;
  }

  private async generateSummaryReport(filePath: string): Promise<void> {
    const summary = `# Test Session Summary

**Session ID:** ${this.results.session_summary.session_id}
**Date:** ${new Date(this.results.session_summary.timestamp).toLocaleString()}
**Duration:** ${this.results.session_summary.duration_minutes.toFixed(1)} minutes

## Overall Performance

- **Total Questions:** ${this.results.session_summary.total_questions}
- **Completed:** ${this.results.session_summary.completed}
- **Pass Rate:** ${this.results.session_summary.pass_rate.toFixed(1)}%
- **Average Score:** ${this.results.session_summary.avg_score.toFixed(1)}%
- **Cost Estimate:** $${this.results.session_summary.cost_estimate_usd.toFixed(2)}

### Results Breakdown
- ✅ **Passed:** ${this.results.session_summary.pass_count} questions
- ⚠️ **Failed:** ${this.results.session_summary.fail_count} questions  
- ❌ **Critical:** ${this.results.session_summary.critical_count} questions

## System Health
- **API Availability:** ${this.results.system_health.api_availability.toFixed(1)}%
- **Avg Response Time:** ${this.results.system_health.avg_response_time.toFixed(0)}ms
- **Classification Accuracy:** ${this.results.system_health.classification_accuracy.toFixed(1)}%
- **Document Retrieval Rate:** ${this.results.system_health.document_retrieval_rate.toFixed(1)}%

## Top Categories Performance
${this.results.category_performance.slice(0, 5).map(cat => 
  `- **${cat.category}:** ${cat.pass_rate.toFixed(1)}% (${cat.pass_count}/${cat.total_questions})`
).join('\n')}

## Main Issues Found
${this.results.failure_analysis.slice(0, 5).map(fail => 
  `- **${fail.failure_type}:** ${fail.count} questions (${fail.percentage.toFixed(1)}%)`
).join('\n')}

## Key Recommendations
${this.results.recommendations.map(rec => `- ${rec}`).join('\n')}
`;

    await fs.writeFile(filePath, summary);
  }

  getResults(): TestResults {
    return this.results;
  }
}