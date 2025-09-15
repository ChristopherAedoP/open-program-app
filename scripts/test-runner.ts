#!/usr/bin/env node

// Load environment variables from .env.local
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(process.cwd(), '.env.local') });

import { QuestionParser, TestQuestion } from './question-parser';
import { HybridEvaluator, EvaluationResult } from './hybrid-evaluator';
import { TestLogger } from './test-logger';
import { ChatAPIClient, ChatAPIResponse } from './api-client';

interface TestRunnerConfig {
  questionsFile: string;
  apiUrl: string;
  outputDir: string;
  delayMs: number;
  maxRetries: number;
  batchSize: number;
  skipExisting: boolean;
  categories: string[];
  difficulties: string[];
}

export class TestRunner {
  private parser: QuestionParser;
  private evaluator: HybridEvaluator;
  private logger: TestLogger;
  private apiClient: ChatAPIClient;
  private config: TestRunnerConfig;

  constructor(config: Partial<TestRunnerConfig> = {}) {
    this.config = {
      questionsFile: path.join(process.cwd(), 'set-preguntas.md'),
      apiUrl: 'http://localhost:3001',
      outputDir: 'test-results',
      delayMs: 1000, // 1 second between requests
      maxRetries: 3,
      batchSize: 10,
      skipExisting: false,
      categories: [], // Empty = all categories
      difficulties: [], // Empty = all difficulties
      ...config
    };

    this.parser = new QuestionParser();
    this.evaluator = new HybridEvaluator();
    this.logger = new TestLogger(this.config.outputDir);
    this.apiClient = new ChatAPIClient(this.config.apiUrl);
  }

  async run(): Promise<void> {
    console.log('🚀 Starting massive test execution...\n');
    
    try {
      // Parse questions
      console.log('📋 Parsing questions...');
      const allQuestions = await this.parser.parseQuestions(this.config.questionsFile);
      
      // Filter questions based on config
      const filteredQuestions = this.filterQuestions(allQuestions);
      console.log(`✅ Selected ${filteredQuestions.length} questions for testing\n`);

      // Initialize test session
      await this.logger.initializeSession(filteredQuestions.length);

      // Check API availability
      await this.checkAPIAvailability();

      // Execute tests in batches
      let processedCount = 0;
      const startTime = Date.now();

      for (let i = 0; i < filteredQuestions.length; i += this.config.batchSize) {
        const batch = filteredQuestions.slice(i, i + this.config.batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(filteredQuestions.length / this.config.batchSize)}`);
        
        await this.processBatch(batch);
        processedCount += batch.length;

        // Progress update
        const elapsed = (Date.now() - startTime) / 1000;
        const questionsPerSecond = processedCount / elapsed;
        const remaining = filteredQuestions.length - processedCount;
        const etaSeconds = remaining / questionsPerSecond;
        
        console.log(`⏱️  Progress: ${processedCount}/${filteredQuestions.length} (${((processedCount/filteredQuestions.length)*100).toFixed(1)}%)`);
        console.log(`🔮 ETA: ${Math.round(etaSeconds/60)} minutes remaining\n`);

        // Delay between batches to avoid overwhelming the API
        if (i + this.config.batchSize < filteredQuestions.length) {
          await this.delay(this.config.delayMs * 2);
        }
      }

      // Finalize and save results
      const resultsFile = await this.logger.finalizeSession();
      console.log(`\n🎉 Test execution completed successfully!`);
      console.log(`📊 Results saved to: ${resultsFile}`);

      // Generate final summary
      this.printFinalSummary();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  private filterQuestions(questions: TestQuestion[]): TestQuestion[] {
    let filtered = questions;

    // Filter by categories if specified
    if (this.config.categories.length > 0) {
      filtered = filtered.filter(q => 
        this.config.categories.some(cat => 
          q.category.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }

    // Filter by difficulties if specified  
    if (this.config.difficulties.length > 0) {
      filtered = filtered.filter(q => 
        this.config.difficulties.includes(q.difficulty)
      );
    }

    return filtered;
  }

  private async checkAPIAvailability(): Promise<void> {
    console.log('🔍 Checking API availability...');
    
    try {
      const isHealthy = await this.apiClient.healthCheck();
      if (isHealthy) {
        console.log('✅ API is responding correctly\n');
      } else {
        throw new Error('API health check failed');
      }
    } catch (error) {
      console.error('❌ API is not available:', error);
      console.log('💡 Make sure the development server is running: npm run dev');
      console.log(`💡 Expected API URL: ${this.config.apiUrl}/api/chat`);
      throw new Error('API unavailable');
    }
  }

  private async processBatch(questions: TestQuestion[]): Promise<void> {
    const promises = questions.map(async (question, index) => {
      // Stagger requests within batch to avoid overwhelming
      await this.delay(index * 200);
      return this.processQuestion(question);
    });

    await Promise.all(promises);
  }

  private async processQuestion(question: TestQuestion): Promise<void> {
    const startTime = Date.now();
    let attempt = 0;

    while (attempt < this.config.maxRetries) {
      try {
        // Query the API
        const apiResponse = await this.apiClient.query(question.question);
        
        // Extract response data
        const response = apiResponse.response || '';
        const classification = apiResponse.classification || { taxonomy_path: 'Unknown', confidence: 0, matched_keywords: [] };
        const documents = apiResponse.documents || [];
        const documentsFound = documents.length;

        // Evaluate the response
        const evaluation = await this.evaluator.evaluate(
          question.question,
          response,
          classification,
          documents,
          question.category
        );

        // Log the result
        const processingTime = Date.now() - startTime;
        this.logger.logQuestionResult(
          question,
          question.question, // Query sent is the same as the question
          classification,
          documentsFound,
          response,
          evaluation,
          processingTime
        );

        return; // Success, exit retry loop

      } catch (error) {
        attempt++;
        console.warn(`⚠️ Attempt ${attempt} failed for Q${question.id}: ${error}`);
        
        if (attempt >= this.config.maxRetries) {
          // Log failed attempt
          const evaluation: EvaluationResult = {
            final_score: 0,
            ai_component: { score: 0, weight: 0.7, details: { relevance_score: 0, completeness_score: 0, accuracy_score: 0, source_quality_score: 0, reasoning: 'API request failed', identified_issues: ['API timeout/error'] } },
            heuristic_component: { score: 0, weight: 0.2, details: { documents_found: false, response_length_adequate: false, classification_confidence_high: false, not_generic_response: false, breakdown: {} } },
            pattern_component: { score: 0, weight: 0.1, details: { mentions_candidates: false, correct_classification: false, has_substantive_content: false, contains_specific_proposals: false, breakdown: {} } },
            verdict: 'CRITICAL',
            issues: ['API request failed after retries'],
            recommendations: ['Check API connectivity and server status']
          };

          this.logger.logQuestionResult(
            question,
            question.question,
            { taxonomy_path: 'ERROR', confidence: 0, matched_keywords: [] },
            0,
            '',
            evaluation,
            Date.now() - startTime
          );
        } else {
          // Wait before retry
          await this.delay(1000 * attempt);
        }
      }
    }
  }


  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printFinalSummary(): void {
    const results = this.logger.getResults();
    
    console.log('\n📊 FINAL SUMMARY');
    console.log('==================');
    console.log(`✅ Pass Rate: ${results.session_summary.pass_rate.toFixed(1)}%`);
    console.log(`📈 Average Score: ${results.session_summary.avg_score.toFixed(1)}%`);
    console.log(`⏱️  Total Time: ${results.session_summary.duration_minutes.toFixed(1)} minutes`);
    console.log(`💰 Estimated Cost: $${results.session_summary.cost_estimate_usd.toFixed(2)}`);
    
    console.log('\n🏆 TOP PERFORMING CATEGORIES:');
    results.category_performance.slice(0, 3).forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.category}: ${cat.pass_rate.toFixed(1)}% (${cat.pass_count}/${cat.total_questions})`);
    });
    
    console.log('\n⚠️ MAIN ISSUES:');
    results.failure_analysis.slice(0, 3).forEach(fail => {
      console.log(`  • ${fail.failure_type}: ${fail.count} questions`);
    });
    
    console.log('\n💡 KEY RECOMMENDATIONS:');
    results.recommendations.slice(0, 3).forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: Partial<TestRunnerConfig> = {};

  // Parse CLI arguments
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--api':
        config.apiUrl = value;
        break;
      case '--output':
        config.outputDir = value;
        break;
      case '--delay':
        config.delayMs = parseInt(value);
        break;
      case '--batch':
        config.batchSize = parseInt(value);
        break;
      case '--categories':
        config.categories = value.split(',');
        break;
      case '--difficulties':
        config.difficulties = value.split(',');
        break;
    }
  }

  const runner = new TestRunner(config);
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}