import { userService } from "@/features/users/user.service";
import { UserUpdateApiResponse } from "@/features/users/user.types";
import prisma from "@/shared/db/prisma";
import {
  handleError,
  printConsoleError,
} from "@/shared/lib/error-handlers/handleError";
import sessionValidation from "@/shared/lib/validations/user-session-validation";
import { userUpdateschema } from "@/shared/lib/zods/user.zod";

export async function PATCH(req: Request) {
  try {
    const session = await sessionValidation();

    const body = await req.json();
    const data = userUpdateschema.parse(body);

    const result = await userService.update(session, data, prisma);

    const response: UserUpdateApiResponse = {
      data: {
        userId: result.userId,
      },
      message: result.message,
      status: 200,
    };

    return Response.json(response, {
      status: 200,
    });
  } catch (error) {
    printConsoleError(error, "PATCH", req.url);
    return handleError(error);
  }
}
