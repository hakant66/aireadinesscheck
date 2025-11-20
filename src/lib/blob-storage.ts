// src/lib/blob-storage.ts
import { put } from "@vercel/blob";

/**
 * Upload a PDF Buffer to Vercel Blob.
 * Returns the blob object (includes url & pathname).
 */
export async function uploadPdfToBlob(
  filename: string,
  buffer: Buffer | Uint8Array
) {
  // access: 'public' → the URL is directly usable
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: true, // avoids collisions
  });

  // blob has shape: { url, pathname, size, uploadedAt, ... }
  return blob;
}
