// src/lib/minio.ts
// Temporary shim so any old imports don't crash when MinIO is not used.

export async function uploadPdfToMinio(
  key: string,
  body: Buffer | Uint8Array | ArrayBuffer
): Promise<string | null> {
  console.warn(
    "uploadPdfToMinio called, but MinIO is disabled (using Vercel Blob instead)."
  );
  // Do nothing, pretend upload succeeded
  return null;
}
