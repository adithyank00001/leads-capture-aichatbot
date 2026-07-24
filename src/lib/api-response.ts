import { NextResponse } from "next/server";

export type ApiErrorBody = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiSuccessBody<T> = {
  ok: true;
  data: T;
};

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiSuccessBody<T>, {
    status,
  });
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: { code, message } } satisfies ApiErrorBody,
    { status },
  );
}
