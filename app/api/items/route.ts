import itemService from "@/features/items/item.service";
import {
  ItemCUDApiResponse,
  ItemGetManyApiResponse,
} from "@/features/items/item.types";
import prisma from "@/shared/db/prisma";
import { forbidden } from "@/shared/lib/error-handlers";
import {
  handleError,
  printConsoleError,
} from "@/shared/lib/error-handlers/handleError";
import {
  canManageItem,
  canViewItem,
} from "@/shared/lib/validations/user-access-validation";
import sessionValidation from "@/shared/lib/validations/user-session-validation";
import {
  itemCreateSchema,
  itemGetManyschema,
} from "@/shared/lib/zods/item.zod";

export async function POST(request: Request) {
  try {
    const session = await sessionValidation();

    if (!canManageItem(session.role)) {
      throw forbidden("You're not allowed to access this feature");
    }

    const body = await request.json();
    const data = itemCreateSchema.parse(body);

    const result = await itemService.create(session, data, prisma);

    const response: ItemCUDApiResponse = {
      message: result.message,
      data: {
        id: result.id,
      },
      status: 201,
    };

    return Response.json(response, {
      status: response.status,
    });
  } catch (error) {
    printConsoleError(error, "POST", request.url);
    return handleError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await sessionValidation();

    if (!canViewItem(session.role)) {
      throw forbidden("You're not allowed to access this feature");
    }

    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const params = itemGetManyschema.parse(rawParams);

    const result = await itemService.getMany(session, params, prisma);

    const response: ItemGetManyApiResponse = {
      message: result.message,
      data: result.data,
      status: 200,
    };

    return Response.json(response, {
      status: response.status,
    });
  } catch (error) {
    printConsoleError(error, "GET", request.url);
    return handleError(error);
  }
}
