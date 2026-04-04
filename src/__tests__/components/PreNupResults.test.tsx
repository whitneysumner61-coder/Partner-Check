import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PreNupResults } from '../../components/PreNupResults';
import { AlignmentStatus } from '../../types';

// Mock recharts to avoid rendering issues in test env
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
  Radar: () => <div />,
  Tooltip: () => <div />,
}));

// Mock d3 to avoid SVG rendering issues
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    append: vi.fn().mockReturnThis(),
    attr: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
  })),
}));

const mockResults = [
  {
    questionId: 'resp_asset_mgmt',
    status: AlignmentStatus.HIGH,
    summary: 'Both partners agree on asset management responsibilities',
    score: 90,
  },
  {
    questionId: 'capex_overrun',
    status: AlignmentStatus.MEDIUM,
    summary: 'Slight differences in capital call approach',
    score: 60,
  },
  {
    questionId: 'missing_returns',
    status: AlignmentStatus.LOW,
    summary: 'Fundamental conflict on how to handle underperformance',
    score: 25,
  },
];

const mockData = {
  partnerA: {
    name: 'Alice',
    answers: {
      resp_asset_mgmt: 'I handle all asset management',
      capex_overrun: 'Capital call to LPs',
      missing_returns: 'Cut fees immediately',
    },
  },
  partnerB: {
    name: 'Bob',
    answers: {
      resp_asset_mgmt: 'I agree Alice handles it',
      capex_overrun: 'GP funds the gap',
      missing_returns: 'Never cut fees, refinance instead',
    },
  },
};

describe('PreNupResults', () => {
  it('renders partner names', () => {
    render(<PreNupResults results={mockResults} data={mockData} onReset={vi.fn()} />);
    expect(screen.getByText(/Alice & Bob/)).toBeInTheDocument();
  });

  it('displays the overall alignment score', () => {
    render(<PreNupResults results={mockResults} data={mockData} onReset={vi.fn()} />);
    // (90 + 60 + 25) / 3 = 58.33 -> rounds to 58
    expect(screen.getByText('58%')).toBeInTheDocument();
  });

  it('renders alignment status badges', () => {
    render(<PreNupResults results={mockResults} data={mockData} onReset={vi.fn()} />);
    expect(screen.getByText('HIGH Alignment')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM Alignment')).toBeInTheDocument();
    expect(screen.getByText('LOW Alignment')).toBeInTheDocument();
  });

  it('renders AI summaries', () => {
    render(<PreNupResults results={mockResults} data={mockData} onReset={vi.fn()} />);
    expect(screen.getByText('Both partners agree on asset management responsibilities')).toBeInTheDocument();
    expect(screen.getByText('Fundamental conflict on how to handle underperformance')).toBeInTheDocument();
  });

  it('renders partner answers side by side', () => {
    render(<PreNupResults results={mockResults} data={mockData} onReset={vi.fn()} />);
    expect(screen.getByText('I handle all asset management')).toBeInTheDocument();
    expect(screen.getByText('I agree Alice handles it')).toBeInTheDocument();
  });

  it('calls onReset when "Start New Analysis" is clicked', () => {
    const onReset = vi.fn();
    render(<PreNupResults results={mockResults} data={mockData} onReset={onReset} />);

    fireEvent.click(screen.getByText('Start New Analysis'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('shows stop recommendation for low scores', () => {
    // Score is 58%, which is <= 60 -> "STOP" message
    render(<PreNupResults results={mockResults} data={mockData} onReset={vi.fn()} />);
    const stopElements = screen.getAllByText(/STOP/);
    expect(stopElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "well aligned" for high scores', () => {
    const highResults = mockResults.map((r) => ({ ...r, score: 95, status: AlignmentStatus.HIGH }));
    render(<PreNupResults results={highResults} data={mockData} onReset={vi.fn()} />);
    expect(screen.getByText(/well aligned/)).toBeInTheDocument();
  });

  it('renders the Alignment Report heading', () => {
    render(<PreNupResults results={mockResults} data={mockData} onReset={vi.fn()} />);
    expect(screen.getByText('Alignment Report')).toBeInTheDocument();
  });

  it('renders the legend', () => {
    render(<PreNupResults results={mockResults} data={mockData} onReset={vi.fn()} />);
    expect(screen.getByText(/High Alignment/)).toBeInTheDocument();
    expect(screen.getByText(/Critical Conflict/)).toBeInTheDocument();
  });
});
