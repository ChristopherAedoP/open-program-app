import fs from 'fs/promises';
import path from 'path';

export interface TestQuestion {
  id: number;
  category: string;
  question: string;
  expectedTopics: string[];
  difficulty: 'basic' | 'medium' | 'complex';
  section: string;
}

export class QuestionParser {
  private questions: TestQuestion[] = [];

  async parseQuestions(filePath: string): Promise<TestQuestion[]> {
    console.log('📋 Parsing questions from:', filePath);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      let currentCategory = '';
      let currentSection = '';
      let questionId = 1;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Detect category headers (### 🏥 Salud)
        if (trimmedLine.startsWith('### ') && trimmedLine.includes(' ')) {
          const categoryMatch = trimmedLine.match(/### [🔥🧓🏥🎓💼💰🚨🏠🌱🌍🏛️]*\s*(.+)/);
          if (categoryMatch) {
            currentCategory = categoryMatch[1].trim();
            currentSection = currentCategory;
            console.log(`📂 Found category: ${currentCategory}`);
          }
        }
        
        // Detect question lines (starts with number)
        if (/^\d+\./.test(trimmedLine)) {
          const questionMatch = trimmedLine.match(/^\d+\.\s*(.+)/);
          if (questionMatch) {
            const question = questionMatch[1].trim();
            
            // Skip if it's just a number without content
            if (question.length < 10) continue;
            
            const testQuestion: TestQuestion = {
              id: questionId++,
              category: this.normalizeCategory(currentCategory),
              question: question,
              expectedTopics: this.extractExpectedTopics(question, currentCategory),
              difficulty: this.assessDifficulty(question),
              section: currentSection
            };
            
            this.questions.push(testQuestion);
          }
        }
      }
      
      console.log(`✅ Parsed ${this.questions.length} questions across ${this.getCategoryCounts()} categories`);
      return this.questions;
      
    } catch (error) {
      console.error('❌ Error parsing questions file:', error);
      throw error;
    }
  }

  private normalizeCategory(category: string): string {
    // Map categories to match our taxonomy
    const categoryMap: Record<string, string> = {
      'Pensiones y Seguridad Social': 'Pensiones',
      'Salud': 'Salud',
      'Educación': 'Educación',
      'Trabajo y Salarios': 'Trabajo',
      'Economía y Costo de la Vida': 'Economía',
      'Seguridad y Crimen Organizado': 'Seguridad',
      'Vivienda y Ciudad': 'Vivienda',
      'Medioambiente y Energía': 'Medioambiente',
      'Descentralización y Regiones': 'Regiones',
      'Institucionalidad y Política': 'Institucionalidad',
      'Seguridad, crimen y migración': 'Seguridad',
      'Infraestructura y crisis energética': 'Medioambiente',
      'Igualdad y bienestar social': 'Institucionalidad',
      'Migración e integración social': 'Migración',
      'Institucionalidad, memoria histórica y derechos': 'Memoria Histórica'
    };

    return categoryMap[category] || category;
  }

  private extractExpectedTopics(question: string, category: string): string[] {
    const topics: string[] = [category];
    
    // Extract specific topics mentioned in the question
    const keywords = [
      'AFP', 'pensiones', 'jubilación', 'Fonasa', 'Isapres', 'salud',
      'educación', 'universidad', 'colegio', 'trabajo', 'salario',
      'inflación', 'economía', 'seguridad', 'delincuencia', 'vivienda',
      'medioambiente', 'energía', 'regiones', 'descentralización'
    ];
    
    const questionLower = question.toLowerCase();
    for (const keyword of keywords) {
      if (questionLower.includes(keyword.toLowerCase())) {
        topics.push(keyword);
      }
    }
    
    return [...new Set(topics)];
  }

  private assessDifficulty(question: string): 'basic' | 'medium' | 'complex' {
    const complexIndicators = [
      'cómo', 'estrategia', 'plan', 'implementará', 'política',
      'medidas específicas', 'financiamiento', 'reforma'
    ];
    
    const questionLower = question.toLowerCase();
    const complexCount = complexIndicators.filter(indicator => 
      questionLower.includes(indicator)
    ).length;
    
    if (complexCount >= 2) return 'complex';
    if (complexCount >= 1) return 'medium';
    return 'basic';
  }

  private getCategoryCounts(): string {
    const categories = new Set(this.questions.map(q => q.category));
    return `${categories.size} (${[...categories].join(', ')})`;
  }

  getQuestions(): TestQuestion[] {
    return this.questions;
  }

  getQuestionsByCategory(category: string): TestQuestion[] {
    return this.questions.filter(q => q.category === category);
  }

  getTotalCount(): number {
    return this.questions.length;
  }
}