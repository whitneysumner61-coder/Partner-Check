import { describe, it, expect } from 'vitest';
import { XRAY_QUESTIONS, PRENUP_QUESTIONS } from '../constants';

describe('XRAY_QUESTIONS', () => {
  it('has 6 questions', () => {
    expect(XRAY_QUESTIONS).toHaveLength(6);
  });

  it('all questions have required fields', () => {
    XRAY_QUESTIONS.forEach((q) => {
      expect(q.id).toBeDefined();
      expect(q.category).toBeDefined();
      expect(q.text).toBeDefined();
      expect(q.placeholder).toBeDefined();
      expect(q.type).toBeDefined();
    });
  });

  it('has unique IDs', () => {
    const ids = XRAY_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses valid categories', () => {
    const validCategories = ['behavior', 'financial', 'operations', 'ethics'];
    XRAY_QUESTIONS.forEach((q) => {
      expect(validCategories).toContain(q.category);
    });
  });
});

describe('PRENUP_QUESTIONS', () => {
  it('has 9 questions', () => {
    expect(PRENUP_QUESTIONS).toHaveLength(9);
  });

  it('all questions have required fields', () => {
    PRENUP_QUESTIONS.forEach((q) => {
      expect(q.id).toBeDefined();
      expect(q.category).toBeDefined();
      expect(q.text).toBeDefined();
      expect(q.placeholder).toBeDefined();
      expect(q.type).toBeDefined();
    });
  });

  it('has unique IDs', () => {
    const ids = PRENUP_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('select-type questions have options', () => {
    const selectQuestions = PRENUP_QUESTIONS.filter((q) => q.type === 'select');
    selectQuestions.forEach((q) => {
      expect(q.options).toBeDefined();
      expect(q.options!.length).toBeGreaterThan(0);
    });
  });

  it('decision_rights is a select question with 4 options', () => {
    const decisionRights = PRENUP_QUESTIONS.find((q) => q.id === 'decision_rights');
    expect(decisionRights).toBeDefined();
    expect(decisionRights!.type).toBe('select');
    expect(decisionRights!.options).toHaveLength(4);
  });
});
