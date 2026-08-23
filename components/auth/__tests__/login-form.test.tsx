import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../login-form';
import { createClient } from '@/lib/supabase/client';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  })),
}));

// Mock Audit actions
vi.mock('@/features/audit/actions', () => ({
  logActivityAction: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  m: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('LoginForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login view by default', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);

    fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit((screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement).form!);

    expect(await screen.findByText(/please enter a valid email address/i, {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('switches to signup view', async () => {
    render(<LoginForm />);
    const signupLink = screen.getByText(/sign up here/i);
    
    await user.click(signupLink);
    
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('validates password matching on signup', async () => {
    render(<LoginForm defaultView="signup" />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('prevents submission if honeypot is filled (Bot Detection)', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ data: {}, error: null });
    (createClient as any).mockReturnValue({
      auth: { signInWithPassword: mockSignIn }
    });

    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const honeypotInput = document.querySelector('input[name="honeypot"]');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    if (honeypotInput) {
      await user.type(honeypotInput, 'i am a bot');
    }
    
    await user.click(submitButton);

    // Should NOT call Supabase
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});

