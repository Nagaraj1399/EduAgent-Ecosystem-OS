import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoutingHeaderBanner } from '../src/components/RoutingHeaderBanner';
import { MarkdownRenderer } from '../src/components/MarkdownRenderer';

describe('Frontend Core UI Components', () => {
  it('RoutingHeaderBanner renders active portal and language badges correctly', () => {
    render(
      <RoutingHeaderBanner
        portal="Student"
        feature="Voice Audio"
        language="English"
      />
    );

    expect(screen.getByText(/ROUTING HEADER/i)).toBeDefined();
    expect(screen.getByText(/\[PORTAL: Student\]/i)).toBeDefined();
    expect(screen.getAllByText(/English/i).length).toBeGreaterThan(0);
  });

  it('MarkdownRenderer formats markdown text into html elements', () => {
    const markdownContent = '### Title\n- **Item 1**: First bullet point\n- **Item 2**: Second bullet point';
    const { container } = render(<MarkdownRenderer content={markdownContent} />);

    expect(container.textContent).toContain('Title');
    expect(container.textContent).toContain('Item 1');
    expect(container.textContent).toContain('First bullet point');
  });
});
