import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, X, ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

const ACCEPT = ["image/png", "image/jpeg"];
const MAX_BYTES = 2 * 1024 * 1024;

function validateFile(f: File): string | null {
  if (!ACCEPT.includes(f.type)) {
    return "Please use a PNG or JPEG image.";
  }
  if (f.size > MAX_BYTES) {
    return "File must be 2MB or smaller.";
  }
  return null;
}

type LogoUploadModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called when user confirms; parent owns long-lived preview URLs */
  onConfirm: (file: File) => void;
  initialFile: File | null;
};

export function LogoUploadModal({
  open,
  onClose,
  onConfirm,
  initialFile,
}: LogoUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const revokePreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const applyFile = useCallback(
    (f: File | null) => {
      setError(null);
      if (!f) {
        revokePreview();
        setPendingFile(null);
        return;
      }
      const err = validateFile(f);
      if (err) {
        setError(err);
        return;
      }
      revokePreview();
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      setPendingFile(f);
    },
    [revokePreview]
  );

  useEffect(() => {
    if (!open) return;
    dragDepth.current = 0;
    setGuideOpen(false);
    setDragOver(false);
    setError(null);
    if (initialFile) {
      applyFile(initialFile);
    } else {
      revokePreview();
      setPendingFile(null);
    }
  }, [open, initialFile, applyFile, revokePreview]);

  useEffect(() => {
    return () => {
      revokePreview();
    };
  }, [revokePreview]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleConfirm = () => {
    if (!pendingFile || error) return;
    onConfirm(pendingFile);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logo-upload-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={handleCancel}
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
        )}
      >
        {/* Header — centered like reference */}
        <div className="relative border-b border-ink/10 px-6 pb-4 pt-6 text-center">
          <button
            type="button"
            onClick={handleCancel}
            className="absolute right-4 top-4 rounded-lg p-2 text-ink-muted transition hover:bg-muted hover:text-ink"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
          <h2
            id="logo-upload-title"
            className="pr-8 text-lg font-semibold tracking-tight text-ink"
          >
            Upload pharmacy logo
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            For best results, use a square or wide image at least 256×256 pixels. PNG
            or JPEG only, maximum 2&nbsp;MB. Your logo appears in the sidebar and header
            after you sign in.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) applyFile(f);
              e.target.value = "";
            }}
          />

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              dragDepth.current += 1;
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (dragDepth.current === 0) setDragOver(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className={cn(
              "rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              dragOver
                ? "border-blue-500 bg-blue-50/60"
                : "border-blue-400/80 bg-muted/30 hover:border-blue-500 hover:bg-blue-50/40"
            )}
          >
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-ink/5 text-ink-muted">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="size-full rounded-xl object-cover"
                />
              ) : (
                <ImageIcon className="size-7 stroke-[1.25]" />
              )}
            </div>
            <p className="text-base font-semibold text-ink">
              Drag and drop an image to upload
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-ink-muted">
              Logo is required for registration and will be shown on your pharmacy
              dashboard.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-6 border-ink/15 bg-surface"
              onClick={() => inputRef.current?.click()}
            >
              Select files
            </Button>
            {error ? (
              <p className="mt-4 text-sm font-medium text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          {/* Accordion */}
          <div className="mt-4 overflow-hidden rounded-xl bg-muted/80">
            <button
              type="button"
              onClick={() => setGuideOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-muted"
            >
              Step-by-step guide
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-ink-muted transition-transform",
                  guideOpen && "rotate-180"
                )}
              />
            </button>
            {guideOpen ? (
              <div className="border-t border-ink/10 px-4 pb-4 pt-2 text-sm leading-relaxed text-ink-muted">
                <ol className="list-decimal space-y-2 pl-4">
                  <li>Click &ldquo;Select files&rdquo; or drag a PNG/JPEG onto the dashed area.</li>
                  <li>Check the preview — crop your source image beforehand if needed.</li>
                  <li>Click &ldquo;Add to profile&rdquo; to attach the logo to this registration.</li>
                  <li>You can change it later from Settings after you create the account.</li>
                </ol>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-ink/10 bg-surface px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            className="border-ink/15 bg-surface"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <button
            type="button"
            disabled={!pendingFile || !!error}
            onClick={handleConfirm}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-semibold text-white transition",
              "bg-ink hover:bg-ink/90 disabled:pointer-events-none disabled:opacity-40"
            )}
          >
            Add to profile
          </button>
        </div>
      </div>
    </div>
  );
}
