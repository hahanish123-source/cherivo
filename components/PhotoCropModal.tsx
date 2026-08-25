"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, RotateCcw, ZoomIn, ZoomOut, Crop, Move } from "lucide-react";
import { ImageAdjustment } from "@/lib/types";

export type CropRatio = "free" | "original" | "1:1" | "4:5" | "16:9" | "3:4" | "4:3";

interface PhotoCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  photoTitle?: string;
  initialAdjustment?: ImageAdjustment;
  onSave: (adjustment: ImageAdjustment) => void;
  onClose: () => void;
}

const RATIO_OPTIONS: { id: CropRatio; label: string; value: number | null }[] = [
  { id: "original", label: "Original", value: null },
  { id: "1:1", label: "1:1 Square", value: 1 / 1 },
  { id: "4:5", label: "4:5 Portrait", value: 4 / 5 },
  { id: "16:9", label: "16:9 Landscape", value: 16 / 9 },
  { id: "3:4", label: "3:4 Classic", value: 3 / 4 },
  { id: "4:3", label: "4:3 Standard", value: 4 / 3 },
  { id: "free", label: "Free", value: null }
];

export default function PhotoCropModal({
  isOpen,
  imageSrc,
  photoTitle = "Photo",
  initialAdjustment,
  onSave,
  onClose
}: PhotoCropModalProps) {
  const [scale, setScale] = useState<number>(initialAdjustment?.scale ?? 100);
  const [panX, setPanX] = useState<number>(initialAdjustment?.x ?? 50);
  const [panY, setPanY] = useState<number>(initialAdjustment?.y ?? 50);
  const [ratio, setRatio] = useState<CropRatio>(initialAdjustment?.cropRatio ?? "original");
  const [naturalAspect, setNaturalAspect] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; initPanX: number; initPanY: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(initialAdjustment?.scale ?? 100);
      setPanX(initialAdjustment?.x ?? 50);
      setPanY(initialAdjustment?.y ?? 50);
      setRatio(initialAdjustment?.cropRatio ?? "original");
    }
  }, [isOpen, initialAdjustment]);

  // Load natural aspect ratio of image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setNaturalAspect(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Calculate viewport frame aspect ratio
  const getActiveAspectRatio = useCallback((): number => {
    const opt = RATIO_OPTIONS.find((r) => r.id === ratio);
    if (opt?.value) return opt.value;
    if (ratio === "original" && naturalAspect > 0) return naturalAspect;
    return naturalAspect || 1;
  }, [ratio, naturalAspect]);

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initPanX: panX,
      initPanY: panY
    });
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Convert pixel delta to percentage offset (inverted to move image under frame)
    const pctDeltaX = (deltaX / rect.width) * 100;
    const pctDeltaY = (deltaY / rect.height) * 100;

    const newX = Math.max(0, Math.min(100, dragStart.initPanX + pctDeltaX));
    const newY = Math.max(0, Math.min(100, dragStart.initPanY + pctDeltaY));

    setPanX(Math.round(newX));
    setPanY(Math.round(newY));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setDragStart(null);
    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    setScale((prev) => Math.max(50, Math.min(300, prev + delta)));
  };

  const handleRestore = () => {
    const restored: ImageAdjustment = {
      ...(initialAdjustment || { scale: 100, x: 50, y: 50 }),
      scale: 100,
      x: 50,
      y: 50,
      cropRatio: "original",
      cropScale: 100,
      cropX: 50,
      cropY: 50,
      isCustomCropped: false,
      fit: "contain",
      crop: {
        scale: 100,
        offsetX: 0,
        offsetY: 0,
        cropX: 50,
        cropY: 50,
        aspectRatio: "original",
        isCustomCropped: false
      }
    };
    setScale(100);
    setPanX(50);
    setPanY(50);
    setRatio("original");
    onSave(restored);
    onClose();
  };

  const handleResetPreview = () => {
    setScale(100);
    setPanX(50);
    setPanY(50);
    setRatio("original");
  };

  const handleApply = () => {
    const updated: ImageAdjustment = {
      ...(initialAdjustment || { scale: 100, x: 50, y: 50 }),
      scale,
      x: panX,
      y: panY,
      cropRatio: ratio,
      cropScale: scale,
      cropX: panX,
      cropY: panY,
      isCustomCropped: true,
      fit: "cover",
      crop: {
        scale,
        offsetX: panX - 50,
        offsetY: panY - 50,
        cropX: panX,
        cropY: panY,
        aspectRatio: ratio,
        isCustomCropped: true
      }
    };
    onSave(updated);
    onClose();
  };

  if (!isOpen) return null;

  const targetAspect = getActiveAspectRatio();

  // Compute frame display dimensions inside 460px x 380px max bounds
  const maxBoxW = 440;
  const maxBoxH = 360;
  let frameW = maxBoxW;
  let frameH = frameW / targetAspect;
  if (frameH > maxBoxH) {
    frameH = maxBoxH;
    frameW = frameH * targetAspect;
  }

  return (
    <div
      className="cropModalOverlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(8, 5, 14, 0.88)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box"
      }}
      onClick={onClose}
    >
      <div
        className="cropModalCard"
        style={{
          width: "100%",
          maxWidth: "580px",
          background: "#140e1f",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.75)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: "#fff"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Crop size={18} style={{ color: "var(--accent, #ff4f8b)" }} />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Crop & Frame — {photoTitle}</h3>
          </div>
          <button
            type="button"
            className="btn ghost small"
            onClick={onClose}
            style={{ padding: "6px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.08)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Aspect Ratio Selector Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "12px 20px",
            overflowX: "auto",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(0, 0, 0, 0.2)"
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--muted, #c8bacb)", marginRight: "4px" }}>Ratio:</span>
          {RATIO_OPTIONS.map((opt) => {
            const active = ratio === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`btn small ${active ? "primary" : ""}`}
                style={{
                  fontSize: "12px",
                  padding: "5px 10px",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                  background: active ? "linear-gradient(135deg, var(--accent, #ff4f8b), #d81762)" : "rgba(255, 255, 255, 0.06)",
                  border: active ? "none" : "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#fff"
                }}
                onClick={() => setRatio(opt.id)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Interactive Workspace / Viewport */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          style={{
            position: "relative",
            width: "100%",
            height: "380px",
            background: "#0a0711",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            touchAction: "none"
          }}
        >
          {/* Fixed Crop Viewport Frame */}
          <div
            style={{
              position: "relative",
              width: `${frameW}px`,
              height: `${frameH}px`,
              borderRadius: "12px",
              boxShadow: "0 0 0 9999px rgba(8, 5, 14, 0.72), 0 0 0 2px rgba(255, 255, 255, 0.6)",
              overflow: "hidden",
              pointerEvents: "none"
            }}
          >
            {/* Movable / Zoomable Original Image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${scale / 100}) translate(${(panX - 50) * 0.8}%, ${(panY - 50) * 0.8}%)`,
                  transformOrigin: "center center",
                  pointerEvents: "none",
                  transition: isDragging ? "none" : "transform 0.1s ease-out"
                }}
              />
            </div>

            {/* Rule of Thirds Grid Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridTemplateRows: "1fr 1fr 1fr",
                pointerEvents: "none",
                opacity: 0.35
              }}
            >
              <div style={{ borderRight: "1px solid #fff", borderBottom: "1px solid #fff" }} />
              <div style={{ borderRight: "1px solid #fff", borderBottom: "1px solid #fff" }} />
              <div style={{ borderBottom: "1px solid #fff" }} />
              <div style={{ borderRight: "1px solid #fff", borderBottom: "1px solid #fff" }} />
              <div style={{ borderRight: "1px solid #fff", borderBottom: "1px solid #fff" }} />
              <div style={{ borderBottom: "1px solid #fff" }} />
              <div style={{ borderRight: "1px solid #fff" }} />
              <div style={{ borderRight: "1px solid #fff" }} />
              <div />
            </div>
          </div>

          {/* Floating Pan/Drag Hint */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(8px)",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.85)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              pointerEvents: "none"
            }}
          >
            <Move size={12} /> Drag image to position • Scroll to zoom
          </div>
        </div>

        {/* Zoom Controls & Sliders */}
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(0, 0, 0, 0.25)",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              className="btn small"
              onClick={() => setScale((s) => Math.max(50, s - 10))}
              style={{ padding: "6px", borderRadius: "8px" }}
              aria-label="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <input
              type="range"
              min={50}
              max={300}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              style={{ flex: 1, accentColor: "var(--accent, #ff4f8b)" }}
            />
            <button
              type="button"
              className="btn small"
              onClick={() => setScale((s) => Math.min(300, s + 10))}
              style={{ padding: "6px", borderRadius: "8px" }}
              aria-label="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            <span style={{ fontSize: "12px", width: "42px", textAlign: "right", color: "var(--muted, #c8bacb)" }}>
              {scale}%
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              className="btn small ghost"
              onClick={handleRestore}
              style={{ gap: "6px", color: "var(--muted, #c8bacb)" }}
              title="Restore full original uncropped photo"
            >
              <RotateCcw size={13} /> Restore Full Image
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button type="button" className="btn small" onClick={onClose} style={{ padding: "8px 16px" }}>
                Cancel
              </button>
              <button
                type="button"
                className="btn small primary"
                onClick={handleApply}
                style={{ padding: "8px 18px", gap: "6px", fontWeight: 600 }}
              >
                <Check size={14} /> Apply Crop
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
