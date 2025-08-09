import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import {
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { dashboardApi } from '@/lib/api';
import { DashboardOverview, SalesPipeline, TaskSummary, RevenueChart } from '@/types';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
}

function StatCard({ title, value, icon: Icon, color, change }: StatCardProps) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
          {change && (
            <div className={`text-sm ${
              change.type === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Fetch dashboard overview
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery<DashboardOverview>(
    'dashboard-overview',
    async () => {
      const result = await dashboardApi.getOverview();
      return result.overview;
    },
    {
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      enabled: typeof window !== 'undefined',
    }
  );

  // Fetch sales pipeline
  const { data: pipeline, isLoading: pipelineLoading } = useQuery<SalesPipeline[]>(
    'sales-pipeline',
    async () => {
      const result = await dashboardApi.getSalesPipeline();
      return result.pipeline;
    },
    {
      enabled: typeof window !== 'undefined',
    }
  );

  // Fetch task summary
  const { data: taskSummary, isLoading: taskSummaryLoading } = useQuery<TaskSummary>(
    'task-summary',
    async () => {
      const result = await dashboardApi.getTaskSummary();
      return result.taskSummary;
    },
    {
      enabled: typeof window !== 'undefined',
    }
  );

  // Fetch revenue chart
  const { data: revenueChart, isLoading: revenueLoading } = useQuery<RevenueChart>(
    ['revenue-chart', selectedPeriod],
    async () => {
      const result = await dashboardApi.getRevenueChart();
      return result.revenueChart;
    },
    {
      enabled: typeof window !== 'undefined',
    }
  );

  // Fetch recent activities
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery(
    'recent-activities',
    async () => {
      const result = await dashboardApi.getRecentActivities(10);
      return result.recentActivities;
    },
    {
      enabled: typeof window !== 'undefined',
    }
  );

  // Fetch upcoming tasks
  const { data: upcomingTasks, isLoading: upcomingTasksLoading } = useQuery(
    'upcoming-tasks',
    async () => {
      const result = await dashboardApi.getUpcomingTasks();
      return result.upcomingTasks;
    },
    {
      enabled: typeof window !== 'undefined',
    }
  );

  useEffect(() => {
    if (overviewError) {
      toast.error('Kontrol paneli verileri yüklenemedi');
    }
  }, [overviewError]);

  if (authLoading || overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner-large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">
          Tekrar hoş geldiniz, {user?.NAME}!
        </h1>
        <p className="text-muted">
          Bugün CRM sisteminizde neler oluyor.
        </p>
      </div>

      {/* Stats Grid */}
      {overview && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Toplam Kişiler"
            value={formatNumber(overview.totalContacts)}
            icon={UsersIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Aktif Fırsatlar"
            value={formatNumber(overview.activeOpportunities)}
            icon={BuildingOfficeIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Bekleyen Görevler"
            value={formatNumber(overview.pendingTasks)}
            icon={ClipboardDocumentListIcon}
            color="bg-yellow-500"
          />
          <StatCard
            title="Aylık Gelir"
            value={formatCurrency(overview.totalRevenue)}
            icon={CurrencyDollarIcon}
            color="bg-purple-500"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Pipeline */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Satış Hattı</h3>
          </div>
          <div className="card-body">
            {pipelineLoading ? (
              <div className="flex justify-center py-8">
                <div className="spinner-medium" />
              </div>
            ) : pipeline && pipeline.length > 0 ? (
              <div className="space-y-4">
                {pipeline.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${getStageColor(stage.stage)}`} />
                      <span className="text-sm font-medium text-gray-900">
                        {stage.stage}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatNumber(stage.count)} fırsat
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(stage.totalValue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Satış hattı verisi mevcut değil</p>
            )}
          </div>
        </div>

        {/* Task Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Görev Özeti</h3>
          </div>
          <div className="card-body">
            {taskSummaryLoading ? (
              <div className="flex justify-center py-8">
                <div className="spinner-medium" />
              </div>
            ) : taskSummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(
                        (taskSummary?.byStatus?.pending || 0) + 
                        (taskSummary?.byStatus?.in_progress || 0) + 
                        (taskSummary?.byStatus?.completed || 0) + 
                        (taskSummary?.byStatus?.cancelled || 0)
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Toplam Görevler</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(taskSummary?.byStatus?.completed || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Tamamlanan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatNumber(taskSummary?.byStatus?.pending || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Bekleyen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatNumber(taskSummary?.byStatus?.in_progress || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Devam Eden</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Görev verisi mevcut değil</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Yaklaşan Görevler</h3>
        </div>
        <div className="card-body">
          {upcomingTasksLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner-medium" />
            </div>
          ) : upcomingTasks && upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 5).map((task: any) => (
                <div key={task.ID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${getPriorityColor(task.PRIORITY)}`} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.TITLE}
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.CONTACT_NAME && `Kişi: ${task.CONTACT_NAME}`}
                        {task.OPPORTUNITY_TITLE && `Fırsat: ${task.OPPORTUNITY_TITLE}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(task.DUE_DATE)}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      task.PRIORITY === 'high' ? 'bg-red-100 text-red-800' :
                      task.PRIORITY === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.PRIORITY}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Yaklaşan görev yok</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getStageColor(stage: string): string {
  const colors: { [key: string]: string } = {
    'Lead': 'bg-gray-400',
    'Qualified': 'bg-blue-400',
    'Proposal': 'bg-yellow-400',
    'Negotiation': 'bg-orange-400',
    'Won': 'bg-green-400',
    'Lost': 'bg-red-400',
  };
  return colors[stage] || 'bg-gray-400';
}

function getPriorityColor(priority: string): string {
  const colors: { [key: string]: string } = {
    'low': 'bg-green-400',
    'medium': 'bg-yellow-400',
    'high': 'bg-orange-400',
    'urgent': 'bg-red-400',
  };
  return colors[priority] || 'bg-gray-400';
}

export default withAuth(DashboardPage);