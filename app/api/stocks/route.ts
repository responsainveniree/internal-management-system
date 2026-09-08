import stockService from "@/features/stocks/stock.service";
import {
  StockCUDApiResponse,
  StockGetManyApiResponse,
} from "@/features/stocks/stock.types";
import prisma from "@/shared/db/prisma";
import { forbidden } from "@/shared/lib/error-handlers";
import {
  handleError,
  printConsoleError,
} from "@/shared/lib/error-handlers/handleError";
import {
  canManageStock,
  canViewStock,
} from "@/shared/lib/validations/user-access-validation";
import sessionValidation from "@/shared/lib/validations/user-session-validation";
import {
  stockCreateSchema,
  stockGetManySchema,
} from "@/shared/lib/zods/stock.zod";

export async function POST(req: Request) {
  try {
    const session = await sessionValidation();

    if (!canManageStock(session.role)) {
      throw forbidden("You're not allowed to access this feature");
    }

    const body = await req.json();
    const data = stockCreateSchema.parse(body);

    const result = await stockService.create(session, data, prisma);

    const response: StockCUDApiResponse = {
      message: result.message,
      data: {
        stockId: result.id,
      },
      status: 201,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    printConsoleError(error, "POST", req.url);
    return handleError(error);
  }
}

export async function GET(req: Request) {
  try {
    const session = await sessionValidation();

    if (!canViewStock(session.role)) {
      throw forbidden("You're not allowed to access this feature");
    }

    const { searchParams } = new URL(req.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const params = stockGetManySchema.parse(rawParams);

    const result = await stockService.getMany(session, params, prisma);

    const response: StockGetManyApiResponse = {
      message: result.message,
      data: result.data,
      status: 200,
    };
    return Response.json(response, { status: 200 });
  } catch (error) {
    printConsoleError(error, "GET", req.url);
    return handleError(error);
  }
}
