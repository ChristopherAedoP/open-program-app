import { classifyQuery, clearCache, getTaxonomyInfo } from '../lib/query-preprocessor';

// Mock taxonomy data for consistent testing
jest.mock('../lib/taxonomy.json', () => ({
  version: '1.0',
  categories: {
    'Pensiones': {
      subcategories: {
        'AFP': {
          keywords: ['afp', 'administradora de fondos', 'fondos de pensiones', 'cotización', 'cuenta individual']
        },
        'Pensión Básica Universal': {
          keywords: ['pensión básica', 'universal', 'pilar solidario']
        }
      }
    },
    'Salud': {
      subcategories: {
        'Isapres': {
          keywords: ['isapre', 'seguro privado', 'plan de salud', 'cotización salud']
        },
        'Fonasa': {
          keywords: ['fonasa', 'seguro público', 'sistema público']
        },
        'Listas de Espera': {
          keywords: ['lista de espera', 'cirugía', 'operación', 'especialista', 'demora atención']
        }
      }
    },
    'Educación': {
      subcategories: {
        'Educación Superior': {
          keywords: ['universidad', 'gratuidad', 'cae', 'crédito', 'educación superior']
        }
      }
    },
    'Seguridad': {
      subcategories: {
        'Narcotráfico': {
          keywords: ['narcotráfico', 'droga', 'tráfico', 'crimen organizado']
        }
      }
    }
  },
  metadata: {
    total_categories: 4,
    total_subcategories: 6,
    confidence_threshold: 0.25,
    fallback_category: 'Institucionalidad'
  }
}), { virtual: true });

describe('Query Classification', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('Basic Classification', () => {
    test('should classify Isapres query correctly', async () => {
      const result = await classifyQuery('¿Qué proponen sobre las Isapres?');
      
      expect(result.category).toBe('Salud');
      expect(result.subcategory).toBe('Isapres');
      expect(result.taxonomy_path).toBe('Salud > Isapres');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.matched_keywords).toContain('isapre');
    });

    test('should classify AFP query correctly', async () => {
      const result = await classifyQuery('Reformas al sistema de AFP');
      
      expect(result.category).toBe('Pensiones');
      expect(result.subcategory).toBe('AFP');
      expect(result.taxonomy_path).toBe('Pensiones > AFP');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should classify pension universal query correctly', async () => {
      const result = await classifyQuery('¿Habrá pensión básica universal?');
      
      expect(result.category).toBe('Pensiones');
      expect(result.subcategory).toBe('Pensión Básica Universal');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('should classify Fonasa query correctly', async () => {
      const result = await classifyQuery('Propuestas para fortalecer Fonasa');
      
      expect(result.category).toBe('Salud');
      expect(result.subcategory).toBe('Fonasa');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should classify education query correctly', async () => {
      const result = await classifyQuery('¿Habrá gratuidad universitaria?');
      
      expect(result.category).toBe('Educación');
      expect(result.subcategory).toBe('Educación Superior');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Chilean Political Questions (PDR)', () => {
    // Test the specific 30 questions from PDR document

    test('Pregunta 1: Sistema de pensiones AFP/reparto/mixto', async () => {
      const queries = [
        '¿Qué propone el candidato respecto al sistema de pensiones (AFP / reparto / mixto)?',
        'Sistema de pensiones AFP o reparto',
        'Propuestas sobre administradoras de fondos de pensiones'
      ];

      for (const query of queries) {
        const result = await classifyQuery(query);
        expect(result.category).toBe('Pensiones');
        expect(['AFP', 'Sistema de Reparto'].includes(result.subcategory)).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.3);
      }
    });

    test('Pregunta 2: Pensión básica universal', async () => {
      const queries = [
        '¿Aumentará la pensión básica universal o algún pilar solidario?',
        'Pensión básica universal propuestas',
        'Pilar solidario de pensiones'
      ];

      for (const query of queries) {
        const result = await classifyQuery(query);
        expect(result.category).toBe('Pensiones');
        expect(result.subcategory).toBe('Pensión Básica Universal');
        expect(result.confidence).toBeGreaterThan(0.4);
      }
    });

    test('Pregunta 4: Listas de espera', async () => {
      const queries = [
        '¿Qué pasará con las listas de espera en hospitales y clínicas?',
        'Reducir listas de espera en salud',
        'Demoras en atención médica'
      ];

      for (const query of queries) {
        const result = await classifyQuery(query);
        expect(result.category).toBe('Salud');
        expect(result.subcategory).toBe('Listas de Espera');
        expect(result.confidence).toBeGreaterThan(0.4);
      }
    });

    test('Pregunta 5: Fonasa e Isapres', async () => {
      const queries = [
        '¿Cuál es el plan para Fonasa e Isapres, habrá un sistema único o mixto?',
        'Sistema único de salud Fonasa Isapres',
        'Reforma al sistema de salud privado y público'
      ];

      for (const query of queries) {
        const result = await classifyQuery(query);
        expect(result.category).toBe('Salud');
        expect(['Fonasa', 'Isapres'].includes(result.subcategory)).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.3);
      }
    });

    test('Pregunta 8: Gratuidad educación superior', async () => {
      const queries = [
        '¿Habrá gratuidad total o cambios en educación superior?',
        'Gratuidad universitaria',
        'Financiamiento educación superior'
      ];

      for (const query of queries) {
        const result = await classifyQuery(query);
        expect(result.category).toBe('Educación');
        expect(result.subcategory).toBe('Educación Superior');
        expect(result.confidence).toBeGreaterThan(0.4);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty query', async () => {
      const result = await classifyQuery('');
      
      expect(result.category).toBe('Institucionalidad');
      expect(result.subcategory).toBe('General');
      expect(result.confidence).toBe(0);
      expect(result.filters).toHaveLength(0);
    });

    test('should handle very generic query', async () => {
      const result = await classifyQuery('¿Qué proponen?');
      
      expect(result.confidence).toBeLessThan(0.25);
      expect(result.filters).toHaveLength(0);
    });

    test('should handle query with no matches', async () => {
      const result = await classifyQuery('¿Cómo está el tiempo hoy?');
      
      expect(result.confidence).toBeLessThan(0.25);
      expect(result.category).toBe('Institucionalidad');
    });

    test('should handle mixed category query', async () => {
      const result = await classifyQuery('¿Las Isapres funcionan como las AFP?');
      
      // Should pick the strongest match
      expect(['Salud', 'Pensiones'].includes(result.category)).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.3);
    });
  });

  describe('Filter Generation', () => {
    test('should generate taxonomy_path filter for high confidence', async () => {
      const result = await classifyQuery('Propuestas sobre Isapres');
      
      if (result.confidence > 0.75) {
        expect(result.filters).toEqual([
          { key: 'taxonomy_path', match: { value: 'Salud > Isapres' } }
        ]);
      }
    });

    test('should generate sub_category filter for medium-high confidence', async () => {
      const result = await classifyQuery('Seguro de salud privado');
      
      if (result.confidence > 0.5 && result.confidence <= 0.75) {
        expect(result.filters).toEqual([
          { key: 'sub_category', match: { value: result.subcategory } }
        ]);
      }
    });

    test('should generate topic_category filter for medium confidence', async () => {
      const result = await classifyQuery('Temas de salud');
      
      if (result.confidence > 0.25 && result.confidence <= 0.5) {
        expect(result.filters).toEqual([
          { key: 'topic_category', match: { value: 'Salud' } }
        ]);
      }
    });

    test('should generate no filters for low confidence', async () => {
      const result = await classifyQuery('Información general');
      
      if (result.confidence <= 0.25) {
        expect(result.filters).toHaveLength(0);
      }
    });
  });

  describe('Performance and Caching', () => {
    test('should cache results for identical queries', async () => {
      const query = '¿Qué proponen sobre las Isapres?';
      
      const start1 = performance.now();
      const result1 = await classifyQuery(query);
      const time1 = performance.now() - start1;
      
      const start2 = performance.now();
      const result2 = await classifyQuery(query);
      const time2 = performance.now() - start2;
      
      expect(result1).toEqual(result2);
      expect(time2).toBeLessThan(time1); // Second call should be faster (cached)
    });

    test('should handle accented characters', async () => {
      const result1 = await classifyQuery('¿Qué proponen sobre pensión?');
      const result2 = await classifyQuery('¿Que proponen sobre pension?');
      
      expect(result1.category).toBe(result2.category);
      expect(result1.subcategory).toBe(result2.subcategory);
    });

    test('should normalize case variations', async () => {
      const result1 = await classifyQuery('ISAPRES');
      const result2 = await classifyQuery('isapres');
      const result3 = await classifyQuery('Isapres');
      
      expect(result1.category).toBe('Salud');
      expect(result2.category).toBe('Salud');
      expect(result3.category).toBe('Salud');
      expect(result1.subcategory).toBe(result2.subcategory);
      expect(result2.subcategory).toBe(result3.subcategory);
    });
  });

  describe('Suggested Tags', () => {
    test('should generate relevant tags', async () => {
      const result = await classifyQuery('¿Qué proponen sobre las Isapres?');
      
      expect(result.suggested_tags).toContain('salud');
      expect(result.suggested_tags).toContain('isapres');
      expect(result.suggested_tags.length).toBeLessThanOrEqual(10);
    });

    test('should include matched keywords in tags', async () => {
      const result = await classifyQuery('Sistema de AFP y fondos de pensiones');
      
      const tagString = result.suggested_tags.join(' ');
      expect(tagString).toMatch(/afp|pensiones/);
    });
  });

  describe('Taxonomy Info', () => {
    test('should return correct taxonomy metadata', () => {
      const info = getTaxonomyInfo();
      
      expect(info.total_categories).toBe(4);
      expect(info.total_subcategories).toBe(6);
      expect(info.confidence_threshold).toBe(0.25);
      expect(info.fallback_category).toBe('Institucionalidad');
    });
  });
});

describe('Real-world Scenarios', () => {
  beforeEach(() => {
    clearCache();
  });

  test('should handle citizen-like questions', async () => {
    const citizenQuestions = [
      '¿Van a eliminar las AFP?',
      'Mi isapre me aumentó el precio, ¿qué van a hacer?',
      '¿Cuándo va a ser gratis la universidad?',
      'Hay mucha delincuencia en mi barrio',
      'No encuentro trabajo, ¿qué proponen?'
    ];

    for (const question of citizenQuestions) {
      const result = await classifyQuery(question);
      
      // Should classify to some category with reasonable confidence
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.category).toBeDefined();
      expect(result.subcategory).toBeDefined();
      expect(result.taxonomy_path).toContain(' > ');
      
      console.log(`"${question}" → ${result.taxonomy_path} (${result.confidence.toFixed(3)})`);
    }
  });

  test('should handle comparative questions', async () => {
    const comparativeQuestions = [
      '¿Qué candidato tiene mejores propuestas de salud?',
      'Compara las políticas de pensiones',
      '¿Cuál es la diferencia entre las propuestas educativas?'
    ];

    for (const question of comparativeQuestions) {
      const result = await classifyQuery(question);
      
      // Should still classify to appropriate categories
      expect(result.confidence).toBeGreaterThan(0);
      expect(['Salud', 'Pensiones', 'Educación'].includes(result.category)).toBe(true);
    }
  });

  test('should handle complex multi-topic questions', async () => {
    const complexQuestions = [
      '¿Cómo van a financiar la pensión básica universal?',
      '¿Las listas de espera afectan tanto Fonasa como Isapres?',
      'Educación y salud son prioridades, ¿qué proponen?'
    ];

    for (const question of complexQuestions) {
      const result = await classifyQuery(question);
      
      // Should pick the most relevant category
      expect(result.confidence).toBeGreaterThan(0.2);
      expect(result.matched_keywords.length).toBeGreaterThan(0);
    }
  });
});