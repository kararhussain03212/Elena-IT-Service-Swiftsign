import { useEffect, useId, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MODAL_CLOSE_MS = 200;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.15;
const CROP_OUTPUT_SIZE = 300;

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const isAllowedImageType = (file) => {
  const type = String(file?.type || "").toLowerCase();
  if (ACCEPTED_TYPES.includes(type) || type === "image/jpg") return true;

  const fileName = String(file?.name || "").toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].some((ext) => fileName.endsWith(ext));
};

const getFileValidationError = (file) => {
  if (!file) return "No image was selected.";
  if (!isAllowedImageType(file)) {
    return "Invalid file type. Please upload JPG, PNG, or WEBP.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File is too large. Maximum size is 2MB.";
  }
  return "";
};

const getInitialLetter = (value) => {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toUpperCase() : "U";
};

const createImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load selected image."));
    image.src = src;
  });

const getOutputType = (fileType) => {
  if (fileType === "image/png") return "image/png";
  if (fileType === "image/webp") return "image/webp";
  return "image/jpeg";
};

const getFileExtension = (fileType) => {
  if (fileType === "image/png") return "png";
  if (fileType === "image/webp") return "webp";
  return "jpg";
};

const cropImageToBlob = async (
  imageSrc,
  cropPixels,
  outputType,
  outputSize = CROP_OUTPUT_SIZE,
) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image processing is not available.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (!nextBlob) {
          reject(new Error("Unable to create cropped image."));
          return;
        }
        resolve(nextBlob);
      },
      outputType,
      0.92,
    );
  });

  return blob;
};

export default function ProfilePhotoUpload({
  initialImage = "",
  fallbackText = "U",
  disabled = false,
  onChange,
}) {
  const inputId = useId();
  const fileInputRef = useRef(null);
  const sourceObjectUrlRef = useRef("");
  const previewObjectUrlRef = useRef("");
  const closeTimeoutRef = useRef(null);
  const livePreviewCanvasRef = useRef(null);
  const livePreviewImageRef = useRef(null);

  const [localAvatarPreview, setLocalAvatarPreview] = useState("");
  const [hasLocalPreviewOverride, setHasLocalPreviewOverride] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [cropSaving, setCropSaving] = useState(false);
  const [sourceImage, setSourceImage] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("image/jpeg");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const setZoomWithinBounds = (value) => {
    if (!Number.isFinite(value)) return;
    setZoom(clampZoom(value));
  };

  const clearSourceObjectUrl = () => {
    if (sourceObjectUrlRef.current) {
      URL.revokeObjectURL(sourceObjectUrlRef.current);
      sourceObjectUrlRef.current = "";
    }
  };

  const clearPreviewObjectUrl = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = "";
    }
  };

  useEffect(() => {
    if (!sourceImage) {
      livePreviewImageRef.current = null;
      return;
    }

    let active = true;
    createImage(sourceImage)
      .then((image) => {
        if (!active) return;
        livePreviewImageRef.current = image;
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load image for crop preview.");
      });

    return () => {
      active = false;
      livePreviewImageRef.current = null;
    };
  }, [sourceImage]);

  useEffect(() => {
    const canvas = livePreviewCanvasRef.current;
    const image = livePreviewImageRef.current;
    if (!canvas || !image || !croppedAreaPixels) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }, [croppedAreaPixels, sourceImage]);

  useEffect(
    () => () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      clearSourceObjectUrl();
      clearPreviewObjectUrl();
    },
    [],
  );

  const openFilePicker = () => {
    if (disabled || cropSaving) return;
    fileInputRef.current?.click();
  };

  const openCropModal = (file) => {
    const validationError = getFileValidationError(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    clearSourceObjectUrl();
    const sourceUrl = URL.createObjectURL(file);
    sourceObjectUrlRef.current = sourceUrl;

    setError("");
    setSourceImage(sourceUrl);
    setSelectedFileType(getOutputType(file.type));
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setCroppedAreaPixels(null);
    setModalClosing(false);
    setModalOpen(true);
  };

  const closeCropModal = () => {
    setModalClosing(true);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setModalOpen(false);
      setModalClosing(false);
      setCropSaving(false);
      setSourceImage("");
      setCrop({ x: 0, y: 0 });
      setZoom(MIN_ZOOM);
      setCroppedAreaPixels(null);
      clearSourceObjectUrl();
    }, MODAL_CLOSE_MS);
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) openCropModal(file);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || cropSaving) return;

    const file = event.dataTransfer.files?.[0];
    if (file) openCropModal(file);
  };

  const handleCropSave = async () => {
    if (!sourceImage || !croppedAreaPixels) {
      setError("Please adjust the crop area first.");
      return;
    }

    try {
      setCropSaving(true);
      setError("");

      const outputType = getOutputType(selectedFileType);
      const blob = await cropImageToBlob(sourceImage, croppedAreaPixels, outputType);
      const extension = getFileExtension(outputType);
      const croppedFile = new File([blob], `profile-${Date.now()}.${extension}`, {
        type: outputType,
      });

      clearPreviewObjectUrl();
      const nextPreviewUrl = URL.createObjectURL(croppedFile);
      previewObjectUrlRef.current = nextPreviewUrl;
      setLocalAvatarPreview(nextPreviewUrl);
      setHasLocalPreviewOverride(true);

      if (typeof onChange === "function") {
        onChange({ file: croppedFile, removeAvatar: false });
      }

      closeCropModal();
    } catch (cropError) {
      setError(cropError?.message || "Failed to crop image.");
      setCropSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    if (disabled || cropSaving) return;

    clearPreviewObjectUrl();
    setLocalAvatarPreview("");
    setHasLocalPreviewOverride(true);
    setError("");

    if (typeof onChange === "function") {
      onChange({ file: null, removeAvatar: true });
    }
  };

  const avatarPreview = hasLocalPreviewOverride
    ? localAvatarPreview
    : String(initialImage || "");
  const hasPreview = Boolean(avatarPreview);

  return (
    <>
      <div className="min-w-0 rounded-2xl border border-white/10 bg-[#151327] p-4 shadow-[0_16px_45px_rgba(6,9,20,0.45)]">
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label="Upload profile photo"
          disabled={disabled || cropSaving}
        />

        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            if (!disabled && !cropSaving) setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-4 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f8fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151327] ${
            isDragging
              ? "border-[#74a6ff] bg-[#122143]"
              : "border-white/15 bg-gradient-to-b from-[#1a1830] to-[#111124] hover:border-[#5f8fff]/70 hover:bg-[#182043]"
          } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(116,166,255,0.2),_transparent_56%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="h-32 w-32 overflow-hidden rounded-full border border-white/20 bg-[#22203a] shadow-lg transition-transform duration-300 group-hover:scale-[1.03] sm:h-36 sm:w-36">
              {hasPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile photo preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2a3d7e] to-[#3f6ff8]">
                  <span className="text-4xl font-semibold text-white/90">
                    {getInitialLetter(fallbackText)}
                  </span>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-white">Upload a profile photo</p>
              <p className="mt-1 text-xs text-white/65">JPG, PNG, WEBP up to 2MB</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled || cropSaving}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#3c72fc] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#2d5fe1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Upload Photo
          </button>

          <button
            type="button"
            onClick={handleRemovePhoto}
            disabled={disabled || cropSaving || !hasPreview}
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove Photo
          </button>
        </div>

        {error ? (
          <p
            className="mt-3 rounded-lg border border-red-400/35 bg-red-400/10 px-3 py-2 text-xs text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      {modalOpen ? (
        <div
          className={`fixed inset-0 z-[140] flex items-center justify-center p-4 transition-all duration-200 ${
            modalClosing ? "bg-black/0 opacity-0" : "bg-black/75 opacity-100"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Crop profile photo"
        >
          <div
            className={`w-full max-w-5xl rounded-2xl border border-white/15 bg-[#0f0d1d] p-4 shadow-2xl transition-all duration-200 sm:p-5 ${
              modalClosing ? "scale-[0.98] opacity-0" : "scale-100 opacity-100"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Crop Photo</h3>
                <p className="mt-1 text-sm text-white/65">
                  Drag image to reposition, then increase or decrease image size for easy crop.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div>
                <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-xl border border-white/15 bg-[#131127] aspect-square">
                  {sourceImage ? (
                    <Cropper
                      image={sourceImage}
                      crop={crop}
                      zoom={zoom}
                      minZoom={MIN_ZOOM}
                      maxZoom={MAX_ZOOM}
                      objectFit="cover"
                      cropShape="round"
                      showGrid={false}
                      aspect={1}
                      zoomWithScroll
                      onCropChange={setCrop}
                      onZoomChange={setZoomWithinBounds}
                      onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                    />
                  ) : null}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-xs text-white/75">Image Zoom: {zoom.toFixed(2)}x</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoomWithinBounds(zoom - ZOOM_STEP)}
                        disabled={cropSaving || zoom <= MIN_ZOOM}
                        className="h-7 w-7 rounded border border-white/20 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Zoom out image"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomWithinBounds(zoom + ZOOM_STEP)}
                        disabled={cropSaving || zoom >= MAX_ZOOM}
                        className="h-7 w-7 rounded border border-white/20 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Zoom in image"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/55">
                    Mouse wheel or +/- changes image size. Final upload size is 300x300.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#141228] p-3">
                <p className="text-xs font-semibold text-white/80">Live Preview</p>
                <p className="mt-1 text-xs text-white/60">How your avatar will look after save.</p>
                <div className="mt-3 flex items-center justify-center">
                  <canvas
                    ref={livePreviewCanvasRef}
                    width={180}
                    height={180}
                    className="h-36 w-36 rounded-full border border-white/20 bg-[#1f1b38] object-cover sm:h-40 sm:w-40"
                    aria-label="Cropped photo preview"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCropModal}
                disabled={cropSaving}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={cropSaving}
                className="inline-flex items-center justify-center rounded-lg bg-[#3c72fc] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2d5fe1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cropSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    Saving...
                  </span>
                ) : (
                  "Crop & Save"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
