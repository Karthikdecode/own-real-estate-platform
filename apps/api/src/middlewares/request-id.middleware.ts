import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { REQUEST_ID_HEADER } from '../common/constants/http.js';

/** Accept ids from proxies/clients only when they are short and log-safe. */
const INCOMING_REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

export const assignRequestId: RequestHandler = (req, res, next) => {
  const incoming = req.get(REQUEST_ID_HEADER);
  const requestId =
    incoming !== undefined && INCOMING_REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
};
