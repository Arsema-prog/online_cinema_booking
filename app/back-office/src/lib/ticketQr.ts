import QrScanner from 'qr-scanner';
import qrWorkerPath from 'qr-scanner/qr-scanner-worker.min?url';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerPath from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

QrScanner.WORKER_PATH = qrWorkerPath;
GlobalWorkerOptions.workerSrc = pdfWorkerPath;

const PDF_RENDER_SCALE = 2.5;

const normalizeQrValue = (rawValue: string): string => {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    throw new Error('The QR code was empty.');
  }

  try {
    const parsedJson = JSON.parse(trimmed) as Record<string, unknown>;
    const jsonValue = ['qrValue', 'ticketId', 'validationToken', 'token']
      .map(key => parsedJson[key])
      .find(value => typeof value === 'string' && value.trim().length > 0);

    if (typeof jsonValue === 'string') {
      return jsonValue.trim();
    }
  } catch {
    // Not JSON, keep checking other formats.
  }

  try {
    const url = new URL(trimmed);
    const urlValue =
      url.searchParams.get('qrValue') ||
      url.searchParams.get('ticketId') ||
      url.searchParams.get('token');

    if (urlValue?.trim()) {
      return urlValue.trim();
    }
  } catch {
    // Not a URL, return the raw text.
  }

  return trimmed;
};

const readQrFromSource = async (source: Blob | HTMLCanvasElement): Promise<string> => {
  const result = await QrScanner.scanImage(source, {
    returnDetailedScanResult: true,
  });

  return normalizeQrValue(result.data);
};

const extractQrFromPdf = async (file: File): Promise<string> => {
  const documentTask = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });

  try {
    const pdf = await documentTask.promise;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Unable to render the uploaded PDF for QR scanning.');
      }

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;

      try {
        return await readQrFromSource(canvas);
      } catch {
        // Keep checking the remaining pages until a QR is found.
      }
    }
  } finally {
    await documentTask.destroy();
  }

  throw new Error('No QR code was found in the uploaded PDF.');
};

const extractQrFromImage = async (file: File): Promise<string> => {
  try {
    return await readQrFromSource(file);
  } catch {
    throw new Error('No QR code was found in the uploaded image.');
  }
};

export const extractQrValueFromFile = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    return extractQrFromPdf(file);
  }

  if (file.type.startsWith('image/')) {
    return extractQrFromImage(file);
  }

  throw new Error('Unsupported file type. Please upload a PDF or image.');
};
