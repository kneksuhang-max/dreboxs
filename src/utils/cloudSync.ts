import type { Product, Category, Tag, AppSettings } from "../types";
import { generatePDFBlob, generateExcelBlob } from "./export";
import { db, addLog } from "../db/dexie";

export interface CloudUploadResult {
  service: "gdrive" | "dropbox";
  format: "pdf" | "excel";
  success: boolean;
  message: string;
  filename: string;
  fileId?: string;
  url?: string;
}

/**
 * Upload a file directly to Google Drive using Google Drive API v3 Multipart Upload.
 */
export async function uploadToGoogleDrive(
  blob: Blob,
  filename: string,
  accessToken: string,
  folderId?: string,
): Promise<CloudUploadResult> {
  if (!accessToken || !accessToken.trim()) {
    return {
      service: "gdrive",
      format: filename.endsWith(".pdf") ? "pdf" : "excel",
      success: false,
      message: "Access Token Google Drive belum dikonfigurasi.",
      filename,
    };
  }

  try {
    const metadata: Record<string, unknown> = {
      name: filename,
      mimeType: blob.type,
    };

    if (folderId && folderId.trim()) {
      metadata.parents = [folderId.trim()];
    }

    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
      metadata,
    )}\r\n`;

    const reader = new FileReader();
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });

    const multipartRequestBody = new Blob(
      [
        metadataPart,
        `--${boundary}\r\nContent-Type: ${blob.type}\r\n\r\n`,
        arrayBuffer,
        closeDelimiter,
      ],
      { type: `multipart/related; boundary=${boundary}` },
    );

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
        },
        body: multipartRequestBody,
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const json = JSON.parse(errText);
        parsedErr = json.error?.message || errText;
      } catch {
        // use raw
      }
      return {
        service: "gdrive",
        format: filename.endsWith(".pdf") ? "pdf" : "excel",
        success: false,
        message: `Google Drive Error (${response.status}): ${parsedErr}`,
        filename,
      };
    }

    const data = await response.json();
    return {
      service: "gdrive",
      format: filename.endsWith(".pdf") ? "pdf" : "excel",
      success: true,
      message: `File berhasil diunggah ke Google Drive (ID: ${data.id})`,
      filename,
      fileId: data.id,
      url: `https://drive.google.com/file/d/${data.id}/view`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Koneksi gagal";
    return {
      service: "gdrive",
      format: filename.endsWith(".pdf") ? "pdf" : "excel",
      success: false,
      message: `Gagal mengunggah ke Google Drive: ${errorMsg}`,
      filename,
    };
  }
}

/**
 * Upload a file directly to Dropbox using Dropbox API v2.
 */
export async function uploadToDropbox(
  blob: Blob,
  filename: string,
  accessToken: string,
  folderPath: string = "/DreBoXs",
): Promise<CloudUploadResult> {
  if (!accessToken || !accessToken.trim()) {
    return {
      service: "dropbox",
      format: filename.endsWith(".pdf") ? "pdf" : "excel",
      success: false,
      message: "Access Token Dropbox belum dikonfigurasi.",
      filename,
    };
  }

  try {
    const cleanFolder = folderPath.startsWith("/")
      ? folderPath
      : `/${folderPath}`;
    const destinationPath = `${cleanFolder}/${filename}`;

    const response = await fetch(
      "https://content.dropboxapi.com/2/files/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
          "Dropbox-API-Arg": JSON.stringify({
            path: destinationPath,
            mode: "overwrite",
            autorename: true,
            mute: false,
          }),
          "Content-Type": "application/octet-stream",
        },
        body: blob,
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const json = JSON.parse(errText);
        parsedErr = json.error_summary || json.error?.message || errText;
      } catch {
        // use raw
      }
      return {
        service: "dropbox",
        format: filename.endsWith(".pdf") ? "pdf" : "excel",
        success: false,
        message: `Dropbox Error (${response.status}): ${parsedErr}`,
        filename,
      };
    }

    const data = await response.json();
    return {
      service: "dropbox",
      format: filename.endsWith(".pdf") ? "pdf" : "excel",
      success: true,
      message: `File berhasil diunggah ke Dropbox (${data.path_display})`,
      filename,
      fileId: data.id,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Koneksi gagal";
    return {
      service: "dropbox",
      format: filename.endsWith(".pdf") ? "pdf" : "excel",
      success: false,
      message: `Gagal mengunggah ke Dropbox: ${errorMsg}`,
      filename,
    };
  }
}

/**
 * Execute Cloud Auto-Export pipeline based on current AppSettings.
 */
export async function executeCloudAutoExport(
  products: Product[],
  categories: Category[],
  tags: Tag[],
  settings: AppSettings,
): Promise<{
  success: boolean;
  results: CloudUploadResult[];
  summaryMessage: string;
}> {
  const format = settings.autoExportFormat || "both";
  const service = settings.autoExportService || "both";

  const filesToUpload: Array<{
    blob: Blob;
    filename: string;
    format: "pdf" | "excel";
  }> = [];

  if (format === "pdf" || format === "both") {
    const pdfData = generatePDFBlob(products, categories);
    filesToUpload.push({ ...pdfData, format: "pdf" });
  }

  if (format === "excel" || format === "both") {
    const excelData = generateExcelBlob(products, categories, tags);
    filesToUpload.push({ ...excelData, format: "excel" });
  }

  const results: CloudUploadResult[] = [];

  for (const file of filesToUpload) {
    // 1. Google Drive
    if (service === "gdrive" || service === "both") {
      const gdriveRes = await uploadToGoogleDrive(
        file.blob,
        file.filename,
        settings.googleDriveAccessToken || "",
        settings.googleDriveFolderId,
      );
      results.push(gdriveRes);
    }

    // 2. Dropbox
    if (service === "dropbox" || service === "both") {
      const dropboxRes = await uploadToDropbox(
        file.blob,
        file.filename,
        settings.dropboxAccessToken || settings.dropboxToken || "",
        settings.googleDriveFolder || "/DreBoXs",
      );
      results.push(dropboxRes);
    }
  }

  const hasSuccess = results.some((r) => r.success);
  const successCount = results.filter((r) => r.success).length;
  const summaryMessage = hasSuccess
    ? `Berhasil mengekspor ${successCount} dari ${results.length} target cloud.`
    : `Ekspor cloud gagal: ${results.map((r) => `${r.service.toUpperCase()} (${r.message})`).join("; ")}`;

  // Update Settings in DB with status
  try {
    await db.settings.update("config", {
      lastCloudExportTimestamp: Date.now(),
      lastCloudExportStatus: hasSuccess ? "SUCCESS" : "FAILED",
      lastCloudExportFileName: filesToUpload.map((f) => f.filename).join(", "),
    });

    await addLog(
      "BACKUP",
      "system",
      `Cloud auto-export [${format.toUpperCase()} -> ${service.toUpperCase()}]: ${summaryMessage}`,
    );
  } catch (err) {
    console.error("Failed to update cloud export log:", err);
  }

  return {
    success: hasSuccess,
    results,
    summaryMessage,
  };
}
