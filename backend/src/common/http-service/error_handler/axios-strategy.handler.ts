import { AxiosError } from 'axios';
import { ApiError } from '../dto/axios.dto';
import { HttpException } from '@nestjs/common';

export type ErrorStrategy<T> = (error: AxiosError | HttpException) => ApiError<T>;

type InternalStrategy = (error: HttpException) => ApiError<unknown>;
type ExternalStrategy = (error: AxiosError) => ApiError<unknown>;

const frontendBaseUrl = process.env.FRONT_URL ?? 'https://localhost:3000';

const errorStrategies: Record<
  "INTERNAL" | "EXTERNAL",
  Record<string, ErrorStrategy<unknown>>
> = {
  "INTERNAL": {
    [`${frontendBaseUrl}/.*`]: (error: HttpException) => ({
      data: "Front Api Sending Error",
      message: `Test API Error ${error?.message}`,
      statusCode: 404,
    }),
    '.*': (error: HttpException) => ({
      data: 'No matched api',
      message: `Unhandled error at ${error?.name}`,
      statusCode: 500,
    }),
  } satisfies Record<string, InternalStrategy>,

  "EXTERNAL": {
    'https://test.com/.*': (error: AxiosError) => ({
      data: 'Test Api Not Found',
      message: `Test API Error ${error.config?.url ?? "unknown URL"}`,
      statusCode: 404,
    }),
    'https://asset.com/.*': (error: AxiosError) => ({
      data: 'Asset Api Not Found',
      message: `Asset API Error ${error.config?.url ?? "unknown URL"}`,
      statusCode: 404,
    }),
    '.*': (error: AxiosError) => ({
      data: 'No matched api',
      message: `Unhandled error at ${error.config?.url ?? "unknown URL"}`,
      statusCode: 500,
    }),
  } satisfies Record<string, ExternalStrategy>
};

export const resolveErrorStrategy = (type: "INTERNAL" | "EXTERNAL" = "EXTERNAL") => {
  const strategies = errorStrategies[type];
  const preCompiled = Object.entries(strategies).map(([pattern, handler]) => ({
    regex: new RegExp(pattern),
    handler,
  }));

  return (url: string) => {
    return (
      preCompiled.find(({ regex }) => regex.test(url))?.handler ??
      strategies['.*'] // fallback
    );
  };
};