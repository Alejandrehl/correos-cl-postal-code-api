import { FastifyRequest } from 'fastify';

export const getClientIp = (req: FastifyRequest): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || '';
};

export const getOrigin = (req: FastifyRequest): string => {
  const origin = req.headers.origin;
  return typeof origin === 'string' ? origin : '';
};
