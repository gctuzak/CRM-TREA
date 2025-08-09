import { render, screen } from '@/tests/utils/test-utils';
import LoadingSpinner, { InlineSpinner, PageLoading } from '@/components/UI/LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toBeInTheDocument();
  });

  test('renders with custom text', () => {
    const customText = 'Loading data...';
    render(<LoadingSpinner text={customText} />);
    
    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const customClass = 'custom-spinner';
    render(<LoadingSpinner className={customClass} />);
    
    const container = screen.getByRole('generic');
    expect(container).toHaveClass(customClass);
  });

  test('renders different sizes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = screen.getByRole('generic').querySelector('div');
    expect(spinner).toHaveClass('h-4', 'w-4');

    rerender(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole('generic').querySelector('div');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });
});

describe('InlineSpinner', () => {
  test('renders inline spinner', () => {
    render(<InlineSpinner />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('animate-spin', 'h-4', 'w-4');
  });

  test('applies custom className', () => {
    const customClass = 'custom-inline';
    render(<InlineSpinner className={customClass} />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass(customClass);
  });
});

describe('PageLoading', () => {
  test('renders page loading with default text', () => {
    render(<PageLoading />);
    
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });

  test('renders page loading with custom text', () => {
    const customText = 'Loading page...';
    render(<PageLoading text={customText} />);
    
    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  test('has correct container styling', () => {
    render(<PageLoading />);
    
    const container = screen.getByText('Yükleniyor...').closest('div');
    expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-[400px]');
  });
});