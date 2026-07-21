import stockService from "@/features/stocks/stock.service";
import {
  StockCUDApiResponse,
  StockGetByIdApiResponse,
} from "@/features/stocks/stock.types";
import prisma from "@/shared/db/prisma";
import { badRequest, forbidden } from "@/shared/lib/error-handlers";
import {
  handleError,
  printConsoleError,
} from "@/shared/lib/error-handlers/handleError";
import { canManageStock } from "@/shared/lib/validations/user-access-validation";
import sessionValidation from "@/shared/lib/validations/user-session-validation";
import {
  stockGetByIdSchema,
  stockUpdateSchema,
} from "@/shared/lib/zods/stock.zod";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await sessionValidation();

    if (!canManageStock(session.role)) {
      throw forbidden("You're not allowed to access this feature");
    }

    const { id } = await params;

    const result = await stockService.delete(session, id, prisma);

    const response: StockCUDApiResponse = {
      message: result.message,
      data: {
        id: result.data.stockId,
      },
      status: 200,
    };

    return Response.json(response, { status: 200 });
  } catch (error) {
    printConsoleError(error, "DELETE", req.url);
    return handleError(error);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await sessionValidation();

    if (!canManageStock(session.role)) {
      throw forbidden("You're not allowed to access this feature");
    }

    const { id } = await params;

    if (!id)
      throw badRequest(
        "Stock id is missing. Something went wrong. Try it again later.",
      );

    const { searchParams } = new URL(req.url);
    const rawSchemaParams = Object.fromEntries(searchParams.entries());
    const schemaParams = stockGetByIdSchema.parse(rawSchemaParams);

    const result = await stockService.getById(
      session,
      id,
      schemaParams,
      prisma,
    );

    const response: StockGetByIdApiResponse = {
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await sessionValidation();

    if (!canManageStock(session.role)) {
      throw forbidden("You're not allowed to access this feature");
    }

    const { id: stockId } = await params;

    const body = await req.json();
    const data = stockUpdateSchema.parse(body);

    const result = await stockService.update(session, stockId, data, prisma);

    const response: StockCUDApiResponse = {
      message: result.message,
      data: {
        id: result.id,
      },
      status: 200,
    };

    return Response.json(response, { status: 200 });
  } catch (error) {
    printConsoleError(error, "PATCH", req.url);
    return handleError(error);
  }
}
