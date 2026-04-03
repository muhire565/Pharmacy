import { useEffect, useRef, useState, type RefObject } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { Modal } from "@/components/ui/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  /** Modal title (e.g. "Scan batch / lot code"). */
  title?: string;
  /** Shown under the title (e.g. mention QR vs barcode). */
  description?: string;
};

const DEDUP_MS = 2000;

function scanHints() {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.TRY_HARDER, true);
  return hints;
}

async function waitForVideo(
  ref: RefObject<HTMLVideoElement | null>,
  maxMs = 2500
): Promise<HTMLVideoElement | null> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const el = ref.current;
    if (el) return el;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  return ref.current;
}

export function BarcodeCameraModal({
  open,
  onClose,
  onDetected,
  title = "Scan with camera",
  description = "Allow camera access when prompted. Hold the product steady so the barcode fills most of the frame.",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [hint, setHint] = useState<string | null>(null);
  const lastRef = useRef<{ code: string; t: number }>({ code: "", t: 0 });

  useEffect(() => {
    if (!open) {
      setHint(null);
      return;
    }

    let cancelled = false;
    let scannerControls: IScannerControls | null = null;
    const reader = new BrowserMultiFormatReader(scanHints());

    const run = async () => {
      setHint("Starting camera…");
      const el = await waitForVideo(videoRef);
      if (!el) {
        setHint("Camera preview is not ready. Close and open scan again.");
        return;
      }

      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const preferred =
          devices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ??
          devices[0]?.deviceId;

        setHint("Point the camera at the barcode or QR code");

        scannerControls = await reader.decodeFromVideoDevice(
          preferred,
          el,
          (result, _error, controls) => {
            if (cancelled || !result) return;
            const text = result.getText().trim();
            if (!text) return;
            const now = Date.now();
            if (
              text === lastRef.current.code &&
              now - lastRef.current.t < DEDUP_MS
            ) {
              return;
            }
            lastRef.current = { code: text, t: now };
            try {
              controls.stop();
            } catch {
              /* ignore */
            }
            onDetectedRef.current(text);
            onCloseRef.current();
          }
        );
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Could not access the camera";
        setHint(msg);
      }
    };

    void run();

    return () => {
      cancelled = true;
      try {
        scannerControls?.stop();
      } catch {
        /* ignore */
      }
    };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">{description}</p>
        <div className="overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            className="mx-auto max-h-[55vh] w-full object-contain"
            muted
            playsInline
          />
        </div>
        {hint ? (
          <p className="text-center text-sm text-ink-muted">{hint}</p>
        ) : null}
      </div>
    </Modal>
  );
}
