// src/app/api/ai-readiness-results/route.ts (only showing POST)
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { pool } from "@/lib/db";
import {
  buildAiReadinessPdfServerBytes,
  type TotalsRowServer,
  type UserInfoServer,
  type AnswerSummaryServer,
} from "@/lib/aiReadinessPdfServer";

type PostBody = {
  totals: TotalsRowServer[];
  avg: number;
  userInfo?: UserInfoServer;
  answers?: AnswerSummaryServer[];
  createdAt?: string;
};

function generateSlug(length = 6): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return slug;
}

// POST: create DB row + server-side PDF in Vercel Blob
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;

    if (!body?.totals || typeof body.avg !== "number") {
      return NextResponse.json(
        { error: "Invalid payload: totals/avg missing" },
        { status: 400 }
      );
    }

    const slug = generateSlug();
    const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();

    // Build the server-side PDF (with answers)
    const serverPdfBytes = await buildAiReadinessPdfServerBytes(
      body.totals,
      body.avg,
      body.userInfo,
      createdAt,
      body.answers
    );

    const pdfBuffer = Buffer.from(serverPdfBytes);
    const pdfKey = `ai-readiness/${slug}.pdf`;

    let pdfUrl: string | null = null;
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;

    if (!hasBlobToken && process.env.NODE_ENV === "development") {
      // Local dev with no Blob token: skip upload but don't crash
      console.warn(
        "BLOB_READ_WRITE_TOKEN not set in dev – skipping PDF upload locally."
      );
    } else {
      // On Vercel, Blob SDK uses BLOB_READ_WRITE_TOKEN automatically.
      const blob = await put(pdfKey, pdfBuffer, {
        access: "public",
        contentType: "application/pdf",
        addRandomSuffix: false,
      });

      pdfUrl = blob.url;
    }

    const userName = body.userInfo
      ? `${body.userInfo.firstName ?? ""} ${
          body.userInfo.lastName ?? ""
        }`.trim() || null
      : null;

    const userEmail = body.userInfo?.email ?? null;
    const company = body.userInfo?.company ?? null;

    await pool.query(
      `
      INSERT INTO ai_readiness_results
        (slug, totals, avg, user_name, user_email, company, pdf_url, created_at)
      VALUES
        ($1,   $2,     $3,  $4,       $5,         $6,      $7,      $8)
      `,
      [
        slug,
        JSON.stringify(body.totals),
        body.avg,
        userName,
        userEmail,
        company,
        pdfUrl,
        createdAt.toISOString(),
      ]
    );

    return NextResponse.json({ slug }, { status: 200 });
  } catch (error) {
    console.error("ai-readiness-results POST error", error);
    return NextResponse.json(
      { error: "Failed to persist AI readiness results" },
      { status: 500 }
    );
  }
}
