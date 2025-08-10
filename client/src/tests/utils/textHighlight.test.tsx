import React from 'react';
import { render } from '@testing-library/react';
import { highlightText, containsSearchTerm, highlightContactFields } from '@/utils/textHighlight';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { describe } from 'node:test';

describe('textHighlight utilities', () => {
  describe('highlightText', () => {
    it('should return original text when no search term', () => {
      const result = highlightText('Hello World', '');
      const { container } = render(result);
      expect(container.textContent).toBe('Hello World');
    });

    it('should highlight matching text', () => {
      const result = highlightText('Hello World', 'World');
      const { container } = render(result);
      expect(container.innerHTML).toContain('bg-yellow-200');
      expect(container.textContent).toBe('Hello World');
    });

    it('should be case insensitive', () => {
      const result = highlightText('Hello World', 'world');
      const { container } = render(result);
      expect(container.innerHTML).toContain('bg-yellow-200');
    });

    it('should handle empty text', () => {
      const result = highlightText('', 'test');
      const { container } = render(result);
      expect(container.textContent).toBe('');
    });
  });

  describe('containsSearchTerm', () => {
    it('should return true for matching text', () => {
      expect(containsSearchTerm('Hello World', 'World')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(containsSearchTerm('Hello World', 'world')).toBe(true);
    });

    it('should return false for non-matching text', () => {
      expect(containsSearchTerm('Hello World', 'xyz')).toBe(false);
    });

    it('should handle empty inputs', () => {
      expect(containsSearchTerm('', 'test')).toBe(false);
      expect(containsSearchTerm('test', '')).toBe(false);
    });
  });

  describe('highlightContactFields', () => {
    const mockContact = {
      NAME: 'John Doe',
      PARENTCONTACTNAME: 'Acme Corp',
      JOBTITLE: 'Manager',
      CITY: 'Istanbul',
      emails: [{ EMAIL: 'john@acme.com' }],
      phones: [{ NUMBER: '555-1234' }]
    };

    it('should return plain text when no search term', () => {
      const result = highlightContactFields(mockContact, '');
      expect(result.name).toBe('John Doe');
      expect(result.company).toBe('Acme Corp');
    });

    it('should return highlighted elements when search term provided', () => {
      const result = highlightContactFields(mockContact, 'John');
      expect(React.isValidElement(result.name)).toBe(true);
    });
  });
});