// src/app/api/ai-readiness-results/route.ts
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
  /** ISO string timestamp; if omitted, server will use current time */
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

    // Convert to Buffer for Vercel Blob
    const pdfBuffer = Buffer.from(serverPdfBytes);
    const pdfKey = `ai-readiness/${slug}.pdf`;

    // Optional: use token if present, so local dev can work if you set BLOB_READ_WRITE_TOKEN
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    let pdfUrl: string | null = null;

    if (!token && process.env.NODE_ENV === "development") {
      // In local dev without token, skip upload but don't fail
      console.warn(
        "BLOB_READ_WRITE_TOKEN not set in dev – skipping PDF upload locally."
      );
    } else {
      const blob = await put(pdfKey, pdfBuffer, {
        access: "public", // public URL for direct download/view
        contentType: "application/pdf",
        addRandomSuffix: false, // keep deterministic path based on slug
        token, // Vercel will inject this in production; local dev can use .env.local
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

    // Persist row in DB
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
        pdfUrl, // may be null in local dev if token missing
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

// GET: list results for admin dashboard (paginated)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page") ?? "1";
    const pageSizeParam = url.searchParams.get("pageSize") ?? "20";

    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const pageSizeRaw = parseInt(pageSizeParam, 10) || 20;
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);
    const offset = (page - 1) * pageSize;

    // Basic list, newest first
    const listResult = await pool.query(
      `
      SELECT
        id,
        slug,
        avg,
        user_name,
        user_email,
        company,
        created_at
      FROM ai_readiness_results
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [pageSize, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS count FROM ai_readiness_results"
    );
    const totalCount: number = countResult.rows[0]?.count ?? 0;

    return NextResponse.json(
      {
        results: listResult.rows,
        totalCount,
        page,
        pageSize,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ai-readiness-results GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch AI readiness results" },
      { status: 500 }
    );
  }
}
