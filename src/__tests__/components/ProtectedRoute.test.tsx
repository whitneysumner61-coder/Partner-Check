import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock child components used by ProtectedRoute
vi.mock('../../components/auth/Login', () => ({
  Login: ({ onToggleSignup }: any) => (
    <div data-testid="login-form">
      <button onClick={onToggleSignup}>Switch to signup</button>
    </div>
  ),
}));

vi.mock('../../components/auth/Signup', () => ({
  Signup: ({ onToggleLogin }: any) => (
    <div data-testid="signup-form">
      <button onClick={onToggleLogin}>Switch to login</button>
    </div>
  ),
}));

import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { fireEvent } from '@testing-library/react';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    // Should show spinner (animate-spin class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@test.com' },
      loading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows login form when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('toggles between login and signup forms', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Initially shows login
    expect(screen.getByTestId('login-form')).toBeInTheDocument();

    // Switch to signup
    fireEvent.click(screen.getByText('Switch to signup'));
    expect(screen.getByTestId('signup-form')).toBeInTheDocument();

    // Switch back to login
    fireEvent.click(screen.getByText('Switch to login'));
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });
});
