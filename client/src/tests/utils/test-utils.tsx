import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '@/hooks/useAuth';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const mockUser = {
  ID: 1,
  NAME: 'Test User',
  EMAIL: 'test@example.com',
  ROLE: 'admin',
  ORID: 1,
  DATETIME: new Date().toISOString(),
  DATETIMEEDIT: new Date().toISOString(),
  USERIDEDIT: 1
};

export const mockContact = {
  ID: 1,
  NAME: 'Test Contact',
  JOBTITLE: 'Test Manager',
  ADDRESS: 'Test Address',
  CITY: 'Test City',
  COUNTRY: 'Turkey',
  NOTE: 'Test contact',
  ORID: 1,
  USERID: 1,
  DATETIME: new Date().toISOString(),
  DATETIMEEDIT: new Date().toISOString(),
  USERIDEDIT: 1,
  POSITION: '',
  COORDINATE: ''
};

export const mockOpportunity = {
  ID: 1,
  NAME: 'Test Opportunity',
  NOTE: 'Test opportunity',
  CONTACTID: 1,
  STATUSTYPEID: 1,
  USERID: 1,
  OWNERUSERID: 1,
  DATETIME: new Date().toISOString(),
  ORID: 1,
  DATETIMEEDIT: new Date().toISOString(),
  USERIDEDIT: 1,
  LEADID: 0,
  FINALTOTAL: '10000',
  CURRENCY: 'TRY'
};

export const mockTask = {
  ID: 1,
  USERID: 1,
  DATETIME: new Date().toISOString(),
  DATETIMEDUE: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  NOTE: 'Test task',
  STATUS: 'New' as const,
  TYPEID: 1,
  CONTACTID: 1,
  OPPORTUNITYID: 1,
  LEADID: 0,
  JOBID: 0,
  ORID: 1,
  DATETIMEEDIT: new Date().toISOString(),
  USERIDEDIT: 1,
  PARENTTASKID: 0,
  RECUR: null,
  RECURDUEDATE: null,
  GOOGLETASKID: null,
  STAMP: new Date().toISOString()
};

export const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 1,
  itemsPerPage: 20,
  hasNextPage: false,
  hasPrevPage: false
};

// Mock API responses
export const mockApiResponse = {
  contacts: {
    contacts: [mockContact],
    pagination: mockPagination
  },
  opportunities: {
    opportunities: [mockOpportunity],
    pagination: mockPagination
  },
  tasks: {
    tasks: [mockTask],
    pagination: mockPagination
  }
};

// Mock fetch function
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      headers: new Headers(),
    })
  ) as jest.Mock;
};

// Cleanup function
export const cleanup = () => {
  jest.clearAllMocks();
  if (global.fetch) {
    (global.fetch as jest.Mock).mockRestore();
  }
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };