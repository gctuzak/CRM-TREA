// User types
export interface User {
  ID: number;
  NAME: string;
  EMAIL: string;
  ROLE: 'admin' | 'manager' | 'user';
  PHONE?: string;
  STATUS: string;
  LAST_LOGIN?: string;
  STAMP?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Contact types
export interface Contact {
  ID: number;
  NAME: string;
  CONTROLNAME?: string;
  TYPE?: string[];
  TITLE?: string;
  JOBTITLE?: string;
  ADDRESS?: string;
  CITY?: string;
  STATE?: string;
  COUNTRY?: string;
  ZIP?: string;
  PARENTCONTACTID?: number;
  PARENTCONTACTNAME?: string;
  NOTE?: string;
  ORGANIZATIONTYPEID?: number;
  ORID: number;
  USERID: number;
  DATETIME: string;
  DATETIMEEDIT: string;
  USERIDEDIT: number;
  GOOGLEID?: string;
  POSITION: string;
  COORDINATE: string;
  STAMP?: string;
}

export interface ContactEmail {
  ID: number;
  CONTACTID: number;
  EMAIL: string;
  ORID: number;
  USERID: number;
  DATETIME: string;
  DATETIMEEDIT: string;
  USERIDEDIT: number;
  STAMP?: string;
}

export interface ContactPhone {
  ID: number;
  CONTACTID: number;
  PHONE: string;
  ORID: number;
  USERID: number;
  DATETIME: string;
  DATETIMEEDIT: string;
  USERIDEDIT: number;
  STAMP?: string;
}

// Opportunity types
export interface Opportunity {
  ID: number;
  NAME: string;
  NOTE?: string;
  CONTACTID: number;
  CLIENTID: number;
  STATUSTYPEID?: number;
  OWNERUSERID?: number;
  USERID: number;
  DATETIME: string;
  ORID: number;
  DATETIMEEDIT: string;
  USERIDEDIT: number;
  LEADID: number;
  USDRATE?: string;
  EURRATE?: string;
  DISCOUNTPER?: string;
  DISCOUNTAMN?: string;
  SUBTOTAL?: string;
  TOTALCOST?: string;
  FINALTOTAL?: string;
  CURRENCY?: string;
  VATPER1?: string;
  VATVALUE1?: string;
  VATPER2?: string;
  VATVALUE2?: string;
  VATPER3?: string;
  VATVALUE3?: string;
  VATINCLUDE?: string;
  STAMP?: string;
}

// Task types
export interface Task {
  ID: number;
  USERID: number;
  DATETIME?: string;
  DATETIMEDUE?: string;
  NOTE?: string;
  STATUS: 'In progress' | 'New' | 'Completed';
  TYPEID: number;
  CONTACTID?: number;
  OPPORTUNITYID: number;
  LEADID: number;
  JOBID: number;
  ORID: number;
  DATETIMEEDIT?: string;
  USERIDEDIT: number;
  PARENTTASKID: number;
  RECUR?: string;
  RECURDUEDATE?: string;
  GOOGLETASKID?: string;
  STAMP?: string;
}

// Dashboard types
export interface DashboardOverview {
  totalContacts: number;
  totalOpportunities: number;
  totalTasks: number;
  activeOpportunities: number;
  pendingTasks: number;
  totalRevenue: number;
}

export interface SalesPipeline {
  stage: string;
  statusId: number;
  count: number;
  totalValue: number;
}

export interface TaskSummary {
  byStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

export interface RevenueChart {
  months: string[];
  revenue: number[];
}

export interface RecentActivity {
  id: number;
  type: 'contact' | 'opportunity' | 'task';
  title: string;
  description?: string;
  date: string;
  user?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Form types
export interface ContactFormData {
  name: string;
  controlName?: string;
  type?: string;
  title?: string;
  jobTitle?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  parentContactId?: number;
  parentContactName?: string;
  note?: string;
  organizationTypeId?: number;
  position?: string;
  coordinate?: string;
}

export interface OpportunityFormData {
  name: string;
  note?: string;
  contactId?: number;
  clientId?: number;
  statusTypeId?: number;
  ownerUserId?: number;
  userId?: number;
  leadId?: number;
  finalTotal?: string;
  currency?: string;
}

export interface TaskFormData {
  note?: string;
  status?: 'In progress' | 'New' | 'Completed';
  typeId?: number;
  contactId?: number;
  opportunityId?: number;
  leadId?: number;
  jobId?: number;
  parentTaskId?: number;
  userId?: number;
  datetimeDue?: string;
  recur?: string;
  recurDueDate?: string;
  googleTaskId?: string;
}