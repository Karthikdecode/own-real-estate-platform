import type {
  CreateInquiryRequest,
  Inquiry,
  InquiryStatus,
  ReceivedInquiriesQuery,
  ReceivedInquiry,
} from '@real-estate/contracts';
import { In, type Repository } from 'typeorm';
import { z } from 'zod';
import { AppError } from '../../common/errors/app-error.js';
import type { CursorPage } from '../../common/types/pagination.types.js';
import { InquiryEntity } from '../../database/entities/inquiry.entity.js';
import { PropertyEntity } from '../../database/entities/property.entity.js';
import { UserEntity } from '../../database/entities/user.entity.js';
import {
  createKeysetCursorSchema,
  decodeCursor,
  getKeysetFetchLimit,
  toCursorPage,
} from '../../utils/pagination.js';

const inquiryCursorSchema = createKeysetCursorSchema(z.literal('newest'));

export class InquiriesService {
  constructor(
    private readonly inquiryRepo: Repository<InquiryEntity>,
    private readonly propertyRepo: Repository<PropertyEntity>,
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(
    senderId: string,
    propertyId: string,
    input: CreateInquiryRequest,
  ): Promise<Inquiry> {
    const property = await this.propertyRepo.findOneBy({ id: propertyId });
    if (!property || property.status !== 'published') {
      throw AppError.notFound('Property');
    }

    // Protection 1: Prevent inquiring on own property
    if (property.ownerId === senderId) {
      throw AppError.badRequest('You cannot send an inquiry on your own property.');
    }

    // Protection 2: Prevent duplicate active inquiries
    const existingOpen = await this.inquiryRepo.findOne({
      where: {
        propertyId,
        senderId,
        status: In(['new', 'contacted']),
      },
    });

    if (existingOpen) {
      throw AppError.conflict(
        'You already have an open inquiry for this property. The owner will respond soon.',
      );
    }

    const inquiry = this.inquiryRepo.create({
      propertyId,
      senderId,
      ownerId: property.ownerId,
      message: input.message,
      status: 'new',
    });

    await this.inquiryRepo.save(inquiry);

    return {
      id: inquiry.id,
      propertyId: inquiry.propertyId,
      status: inquiry.status,
      message: inquiry.message,
      createdAt: inquiry.createdAt.toISOString(),
      updatedAt: inquiry.updatedAt.toISOString(),
    };
  }

  async getReceivedInquiries(
    ownerId: string,
    query: Partial<ReceivedInquiriesQuery> = {},
  ): Promise<CursorPage<ReceivedInquiry>> {
    const limit = Number(query.limit) || 10;
    const qb = this.inquiryRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.property', 'p')
      .leftJoinAndSelect('i.sender', 's')
      .where('i.owner_id = :ownerId', { ownerId });

    if (query.status) {
      qb.andWhere('i.status = :status', { status: query.status });
    }

    if (query.cursor) {
      const cursor = decodeCursor(query.cursor, inquiryCursorSchema);
      qb.andWhere('(i.created_at, i.id) < (:val, :id)', {
        val: new Date(cursor.value),
        id: cursor.id,
      });
    }

    qb.orderBy('i.created_at', 'DESC').addOrderBy('i.id', 'DESC');
    qb.limit(getKeysetFetchLimit(limit));

    const inquiries = await qb.getMany();

    const items: ReceivedInquiry[] = inquiries.map((i) => ({
      id: i.id,
      propertyId: i.propertyId,
      status: i.status,
      message: i.message,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
      property: {
        id: i.property?.id ?? i.propertyId,
        slug: i.property?.slug ?? '',
        title: i.property?.title ?? 'Property',
      },
      sender: {
        fullName: i.sender?.fullName ?? 'Anonymous',
        email: i.sender?.email ?? '',
        mobileNumber: i.sender?.mobileNumber ?? null,
      },
    }));

    return toCursorPage(items, limit, (last) => ({
      v: 1,
      sort: 'newest',
      value: last.createdAt,
      id: last.id,
    }));
  }

  async getSentInquiries(
    senderId: string,
    query: Partial<ReceivedInquiriesQuery> = {},
  ): Promise<CursorPage<ReceivedInquiry>> {
    const limit = Number(query.limit) || 10;
    const qb = this.inquiryRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.property', 'p')
      .leftJoinAndSelect('i.sender', 's')
      .where('i.sender_id = :senderId', { senderId });

    if (query.status) {
      qb.andWhere('i.status = :status', { status: query.status });
    }

    if (query.cursor) {
      const cursor = decodeCursor(query.cursor, inquiryCursorSchema);
      qb.andWhere('(i.created_at, i.id) < (:val, :id)', {
        val: new Date(cursor.value),
        id: cursor.id,
      });
    }

    qb.orderBy('i.created_at', 'DESC').addOrderBy('i.id', 'DESC');
    qb.limit(getKeysetFetchLimit(limit));

    const inquiries = await qb.getMany();

    const items: ReceivedInquiry[] = inquiries.map((i) => ({
      id: i.id,
      propertyId: i.propertyId,
      status: i.status,
      message: i.message,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
      property: {
        id: i.property?.id ?? i.propertyId,
        slug: i.property?.slug ?? '',
        title: i.property?.title ?? 'Property',
      },
      sender: {
        fullName: i.sender?.fullName ?? 'Anonymous',
        email: i.sender?.email ?? '',
        mobileNumber: i.sender?.mobileNumber ?? null,
      },
    }));

    return toCursorPage(items, limit, (last) => ({
      v: 1,
      sort: 'newest',
      value: last.createdAt,
      id: last.id,
    }));
  }

  async updateStatus(
    ownerId: string,
    inquiryId: string,
    status: InquiryStatus,
  ): Promise<ReceivedInquiry> {
    const inquiry = await this.inquiryRepo.findOne({
      where: { id: inquiryId },
      relations: { property: true, sender: true },
    });

    if (!inquiry) {
      throw AppError.notFound('Inquiry');
    }

    if (inquiry.ownerId !== ownerId) {
      throw AppError.forbidden('You do not have permission to manage this inquiry.');
    }

    inquiry.status = status;
    await this.inquiryRepo.save(inquiry);

    return {
      id: inquiry.id,
      propertyId: inquiry.propertyId,
      status: inquiry.status,
      message: inquiry.message,
      createdAt: inquiry.createdAt.toISOString(),
      updatedAt: inquiry.updatedAt.toISOString(),
      property: {
        id: inquiry.property?.id ?? inquiry.propertyId,
        slug: inquiry.property?.slug ?? '',
        title: inquiry.property?.title ?? 'Property',
      },
      sender: {
        fullName: inquiry.sender?.fullName ?? 'Anonymous',
        email: inquiry.sender?.email ?? '',
        mobileNumber: inquiry.sender?.mobileNumber ?? null,
      },
    };
  }
}
