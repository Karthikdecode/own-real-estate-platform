import {
  ownerPropertySummarySchema,
  propertyDetailSchema,
  propertyImageSchema,
  type CreatePropertyRequest,
  type MyListingsQuery,
  type OwnerPropertySummary,
  type PropertyDetail,
  type PropertyImage,
  type UpdatePropertyImageRequest,
  type UpdatePropertyRequest,
  type UpdatePropertyStatusRequest,
} from '@real-estate/contracts';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { apiPath, type Page } from '@/lib/api/http';

/** Multipart field name the API reads uploaded image files from. */
export const PROPERTY_IMAGES_FIELD = 'images';

/** Uploads of up to ten 5 MB photos need far longer than the default 10 s timeout. */
const IMAGE_UPLOAD_TIMEOUT_MS = 120_000;

export function getMyListings(
  query: Partial<MyListingsQuery> = {},
  signal?: AbortSignal,
): Promise<Page<OwnerPropertySummary>> {
  return apiClient.getPage('/properties/my-listings', {
    query,
    signal,
    itemSchema: ownerPropertySummarySchema,
  });
}

export function getMyListing(propertyId: string, signal?: AbortSignal): Promise<PropertyDetail> {
  return apiClient.get(apiPath`/properties/my-listings/${propertyId}`, {
    schema: propertyDetailSchema,
    signal,
  });
}

export function createProperty(input: CreatePropertyRequest): Promise<PropertyDetail> {
  return apiClient.post('/properties', { body: input, schema: propertyDetailSchema });
}

export function updateProperty(
  propertyId: string,
  input: UpdatePropertyRequest,
): Promise<PropertyDetail> {
  return apiClient.patch(apiPath`/properties/${propertyId}`, {
    body: input,
    schema: propertyDetailSchema,
  });
}

export function updatePropertyStatus(
  propertyId: string,
  input: UpdatePropertyStatusRequest,
): Promise<PropertyDetail> {
  return apiClient.patch(apiPath`/properties/${propertyId}/status`, {
    body: input,
    schema: propertyDetailSchema,
  });
}

export async function deleteProperty(propertyId: string): Promise<void> {
  await apiClient.delete(apiPath`/properties/${propertyId}`);
}

/** Sends files appended to `formData` under PROPERTY_IMAGES_FIELD as one multipart request. */
export function uploadPropertyImages(
  propertyId: string,
  formData: FormData,
): Promise<PropertyImage[]> {
  return apiClient.post(apiPath`/properties/${propertyId}/images`, {
    body: formData,
    schema: z.array(propertyImageSchema),
    timeoutMs: IMAGE_UPLOAD_TIMEOUT_MS,
  });
}

export function updatePropertyImage(
  propertyId: string,
  imageId: string,
  input: UpdatePropertyImageRequest,
): Promise<PropertyImage> {
  return apiClient.patch(apiPath`/properties/${propertyId}/images/${imageId}`, {
    body: input,
    schema: propertyImageSchema,
  });
}

export async function deletePropertyImage(propertyId: string, imageId: string): Promise<void> {
  await apiClient.delete(apiPath`/properties/${propertyId}/images/${imageId}`);
}
