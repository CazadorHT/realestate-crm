import { describe, it, expect } from 'vitest';
import { ALLOWED_MODELS, MODEL_INFO_MAP, DEFAULT_CONFIG } from './constants';

describe('AI Settings Constants', () => {
  it('should have a valid list of allowed models', () => {
    expect(ALLOWED_MODELS.length).toBeGreaterThan(0);
    expect(ALLOWED_MODELS[0]).toHaveProperty('id');
    expect(ALLOWED_MODELS[0]).toHaveProperty('label');
  });

  it('should correctly map model info by ID', () => {
    const flashModel = MODEL_INFO_MAP['gemini-flash-latest'];
    expect(flashModel).toBeDefined();
    expect(flashModel.label).toContain('Gemini 3 Flash');
  });

  it('should have a complete default configuration', () => {
    expect(DEFAULT_CONFIG.chatbot_model).toBe('gemini-flash-latest');
    expect(DEFAULT_CONFIG.blog_generator_model).toBe('gemini-flash-latest');
    expect(DEFAULT_CONFIG.lead_model).toBe('gemini-flash-lite-latest');
  });

  it('should ensure all model IDs in DEFAULT_CONFIG exist in ALLOWED_MODELS', () => {
    const allowedIds = ALLOWED_MODELS.map(m => m.id);
    Object.values(DEFAULT_CONFIG).forEach(modelId => {
      expect(allowedIds).toContain(modelId);
    });
  });
});
