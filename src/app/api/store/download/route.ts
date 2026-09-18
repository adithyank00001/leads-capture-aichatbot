import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { STORE_DOWNLOAD_FILE } from "@/lib/store/download";
import { getPaidPurchaseByDownloadToken } from "@/lib/store/purchases";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing download token." } },
        { status: 400 },
      );
    }

    const purchase = await getPaidPurchaseByDownloadToken(token);
    if (!purchase) {
      return NextResponse.json(
        { ok: false, error: { message: "Download not available." } },
        { status: 403 },
      );
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      STORE_DOWNLOAD_FILE.absolutePublicPath,
    );
    const file = await readFile(filePath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": STORE_DOWNLOAD_FILE.contentType,
        "Content-Disposition": `attachment; filename="${STORE_DOWNLOAD_FILE.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[store/download]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          message:
            error instanceof Error ? error.message : "Download failed.",
        },
      },
      { status: 500 },
    );
  }
}
