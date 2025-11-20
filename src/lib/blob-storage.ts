// src/lib/blob-storage.ts
import { put } from "@vercel/blob";

/**
 * Upload a PDF Buffer to Vercel Blob.
 * `buffer` MUST be a Node.js Buffer (we convert to Buffer in the caller).
 */
export async function uploadPdfToBlob(
  filename: string,
  buffer: Buffer
) {
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false, // slug-based path stays stable
  });

  // blob: { url, pathname, size, uploadedAt, ... }
  return blob;
}
