import {
  adminDashboardStatsSchema,
  adminPropertyItemSchema,
  type AdminDashboardStats,
  type AdminPropertiesQuery,
  type AdminPropertyItem,
  type ModeratePropertyRequest,
} from '@real-estate/contracts';
import { apiClient } from '@/lib/api/client';
import type { Page } from '@/lib/api/http';

export interface AdminPropertyDetail extends AdminPropertyItem {
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
    displayOrder: number;
  }>;
  history: Array<{
    id: string;
    oldStatus: string | null;
    newStatus: string;
    changedBy: string;
    remarks: string | null;
    createdAt: string;
  }>;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  return apiClient.get('/admin/dashboard', {
    schema: adminDashboardStatsSchema,
    cache: 'no-store',
  });
}

export async function getAdminProperties(
  query: Partial<AdminPropertiesQuery> = {},
): Promise<Page<AdminPropertyItem>> {
  return apiClient.getPage('/admin/properties', {
    itemSchema: adminPropertyItemSchema,
    query: {
      status: query.status,
      city: query.city,
      propertyType: query.propertyType,
      listingType: query.listingType,
      q: query.q,
      cursor: query.cursor,
      limit: query.limit,
    },
    cache: 'no-store',
  });
}

export async function getAdminPropertyById(propertyId: string): Promise<AdminPropertyDetail> {
  return (await apiClient.get(`/admin/properties/${propertyId}`, {
    cache: 'no-store',
  })) as AdminPropertyDetail;
}

export async function moderateProperty(
  propertyId: string,
  data: ModeratePropertyRequest,
): Promise<{ id: string; status: string; publishedAt: string | null; message: string }> {
  return (await apiClient.patch(`/admin/properties/${propertyId}/moderate`, {
    body: data,
  })) as { id: string; status: string; publishedAt: string | null; message: string };
}

