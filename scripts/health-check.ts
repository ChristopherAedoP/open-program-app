#!/usr/bin/env node

// Load environment variables from .env.local
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(process.cwd(), '.env.local') });

import { ChatAPIClient } from './api-client';
import { classifyQuery } from '../lib/query-preprocessor';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  responseTime?: number;
  details?: any;
}

class HealthChecker {
  private apiClient: ChatAPIClient;

  constructor(apiUrl?: string) {
    this.apiClient = new ChatAPIClient(apiUrl);
  }

  async runHealthCheck(): Promise<void> {
    console.log('🏥 Running system health check...\n');
    
    const checks: HealthCheckResult[] = [];
    
    // Check API availability
    checks.push(await this.checkAPI());
    
    // Check query classification
    checks.push(await this.checkClassification());
    
    // Check environment variables
    checks.push(await this.checkEnvironment());
    
    // Print results
    this.printResults(checks);
    
    // Exit with appropriate code
    const hasError = checks.some(c => c.status === 'error');
    const hasWarning = checks.some(c => c.status === 'warning');
    
    if (hasError) {
      console.log('\n❌ Health check failed - see errors above');
      process.exit(1);
    } else if (hasWarning) {
      console.log('\n⚠️ Health check completed with warnings');
      process.exit(0);
    } else {
      console.log('\n✅ All systems healthy!');
      process.exit(0);
    }
  }

  private async checkAPI(): Promise<HealthCheckResult> {
    console.log('🔍 Checking API connectivity...');
    
    try {
      const startTime = Date.now();
      const response = await this.apiClient.query('test de conectividad');
      const responseTime = Date.now() - startTime;
      
      if (response.response && response.response.length > 10) {
        return {
          component: 'API',
          status: 'healthy',
          message: 'API responding correctly',
          responseTime,
          details: {
            response_length: response.response.length,
            has_classification: !!response.classification,
            documents_found: response.documents?.length || 0
          }
        };
      } else {
        return {
          component: 'API',
          status: 'warning',
          message: 'API responding but with short response',
          responseTime,
          details: { response_length: response.response.length }
        };
      }
      
    } catch (error) {
      return {
        component: 'API',
        status: 'error',
        message: `API unavailable: ${error}`,
        details: { error: String(error) }
      };
    }
  }

  private async checkClassification(): Promise<HealthCheckResult> {
    console.log('🧠 Checking query classification...');
    
    try {
      const testQueries = [
        { query: 'pensiones', expected_category: 'Pensiones' },
        { query: 'salud', expected_category: 'Salud' },
        { query: 'educación', expected_category: 'Educación' }
      ];

      const results = [];
      for (const test of testQueries) {
        const classification = await classifyQuery(test.query);
        results.push({
          query: test.query,
          expected: test.expected_category,
          actual: classification.category,
          confidence: classification.confidence,
          correct: classification.category === test.expected_category
        });
      }

      const correctCount = results.filter(r => r.correct).length;
      const accuracy = (correctCount / results.length) * 100;

      if (accuracy >= 80) {
        return {
          component: 'Classification',
          status: 'healthy',
          message: `Classification accuracy: ${accuracy.toFixed(1)}%`,
          details: { accuracy, results }
        };
      } else if (accuracy >= 60) {
        return {
          component: 'Classification',
          status: 'warning',
          message: `Classification accuracy below optimal: ${accuracy.toFixed(1)}%`,
          details: { accuracy, results }
        };
      } else {
        return {
          component: 'Classification',
          status: 'error',
          message: `Classification accuracy critically low: ${accuracy.toFixed(1)}%`,
          details: { accuracy, results }
        };
      }

    } catch (error) {
      return {
        component: 'Classification',
        status: 'error',
        message: `Classification system error: ${error}`,
        details: { error: String(error) }
      };
    }
  }

  private async checkEnvironment(): Promise<HealthCheckResult> {
    console.log('🌍 Checking environment configuration...');
    
    const requiredVars = [
      'OPENAI_API_KEY',
      'QDRANT_URL', 
      'QDRANT_API_KEY',
      'QDRANT_COLLECTION'
    ];

    const missing = [];
    const present = [];

    for (const varName of requiredVars) {
      if (process.env[varName]) {
        present.push({
          name: varName,
          hasValue: true,
          length: process.env[varName]!.length
        });
      } else {
        missing.push(varName);
      }
    }

    if (missing.length === 0) {
      return {
        component: 'Environment',
        status: 'healthy',
        message: 'All required environment variables present',
        details: { present, missing }
      };
    } else if (missing.length <= 1) {
      return {
        component: 'Environment',
        status: 'warning',
        message: `Some optional variables missing: ${missing.join(', ')}`,
        details: { present, missing }
      };
    } else {
      return {
        component: 'Environment',
        status: 'error',
        message: `Critical environment variables missing: ${missing.join(', ')}`,
        details: { present, missing }
      };
    }
  }

  private printResults(checks: HealthCheckResult[]): void {
    console.log('\n📊 HEALTH CHECK RESULTS');
    console.log('========================');

    for (const check of checks) {
      const icon = check.status === 'healthy' ? '✅' : 
                   check.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`\n${icon} ${check.component.toUpperCase()}`);
      console.log(`   Status: ${check.status.toUpperCase()}`);
      console.log(`   Message: ${check.message}`);
      
      if (check.responseTime) {
        console.log(`   Response Time: ${check.responseTime}ms`);
      }

      if (check.details) {
        console.log(`   Details: ${JSON.stringify(check.details, null, 2)}`);
      }
    }

    console.log('\n========================');

    const summary = {
      healthy: checks.filter(c => c.status === 'healthy').length,
      warning: checks.filter(c => c.status === 'warning').length,
      error: checks.filter(c => c.status === 'error').length,
      total: checks.length
    };

    console.log(`Summary: ${summary.healthy}/${summary.total} healthy, ${summary.warning} warnings, ${summary.error} errors`);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let apiUrl: string | undefined;
  
  // Parse CLI arguments
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    if (flag === '--api') {
      apiUrl = value;
    }
  }
  
  const checker = new HealthChecker(apiUrl);
  checker.runHealthCheck().catch(error => {
    console.error('Fatal error during health check:', error);
    process.exit(1);
  });
}