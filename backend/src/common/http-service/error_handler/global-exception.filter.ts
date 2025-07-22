import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { resolveErrorStrategy } from "./axios-strategy.handler.ts";
import { Response, Request} from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly compiledStrategies = resolveErrorStrategy("INTERNAL");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const url = req.url;

    const handler = this.compiledStrategies(url)
    const apiError = handler(exception as HttpException);
    res.status(apiError.statusCode).json(apiError);
  }
}