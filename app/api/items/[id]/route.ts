import itemService from "@/features/items/item.service";
import {
  ItemCUDApiResponse,
  ItemGetByIdApiResponse,
} from "@/features/items/item.types";
import prisma from "@/shared/db/prisma";
import { forbidden } from "@/shared/lib/error-handlers";
import {
  handleError,
  printConsoleError,
} from "@/shared/lib/error-handlers/handleError";
import { canManageItem } from "@/shared/lib/validations/user-access-validation";
import sessionValidation from "@/shared/lib/validations/user-session-validation";
import {
  itemGetByIdSchema,
  itemUpdateSchema,
} from "@/shared/lib/zods/item.zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await sessionValidation();

    if (!canManageItem(session.role)) {
      throw forbidden("You're not allowed to access this feature");
    }

    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const rawParamsSchema = Object.fromEntries(searchParams.entries());
    const paramsSchema = itemGetByIdSchema.parse(rawParamsSchema);

    const result = await itemService.getById(session, id, paramsSchema, prisma);

    const response: ItemGetByIdApiResponse = {
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await sessionValidation();

    if (!canManageItem(session.role)) {
      throw forbidden("You're not allowed to access this feature");
    }

    const { id } = await params;

    const body = await request.json();
    const data = itemUpdateSchema.parse(body);

    const result = await itemService.update(session, id, data, prisma);

    const response: ItemCUDApiResponse = {
      message: result.message,
      data: {
        id: result.id,
      },
      status: 200,
    };

    return Response.json(response, {
      status: response.status,
    });
  } catch (error) {
    printConsoleError(error, "PATCH", request.url);
    return handleError(error);
  }
}

// export async function DELETE(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const session = await sessionValidation();

//     if (!canManageItem(session.role)) {
//       throw forbidden("You're not allowed to access this feature");
//     }

//     const { id } = await params;

//     const result = await itemService.delete(session, id, prisma);

//     const response: ItemCUDApiResponse = {
//       message: result.message,
//       data: {
//         id: result.id,
//       },
//       status: 200,
//     };

//     return Response.json(response, {
//       status: response.status,
//     });
//   } catch (error) {
//     printConsoleError(error, "DELETE", request.url);
//     return handleError(error);
//   }
// }
