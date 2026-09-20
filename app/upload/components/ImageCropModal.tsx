"use client";

import React from "react";
import Cropper from "react-easy-crop";
import { RotateCw } from "lucide-react";
import { Area } from "@/types/uploadPage";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ImageCropModalProps {
  imageSrc: string | null;
  setImageSrc: (src: string | null) => void;
  crop: { x: number; y: number };
  setCrop: (crop: { x: number; y: number }) => void;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  zoom: number;
  setZoom: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  saveCroppedImage: () => void;
}

export function ImageCropModal({
  imageSrc,
  setImageSrc,
  crop,
  setCrop,
  rotation,
  setRotation,
  zoom,
  setZoom,
  onCropComplete,
  saveCroppedImage,
}: ImageCropModalProps) {
  const isOpen = !!imageSrc;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setImageSrc(null)}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden flex flex-col h-[520px] bg-background gap-0 border">
        {/* Header Modal */}
        <DialogHeader className="p-4 border-b text-center sm:text-center">
          <DialogTitle className="text-base font-bold text-foreground">
            Adjust Cover Image
          </DialogTitle>
        </DialogHeader>

        {/* Area Kerja Cropper */}
        <div className="relative flex-1 bg-muted/40">
          <Cropper
            image={imageSrc || undefined}
            crop={crop}
            rotation={rotation}
            zoom={zoom}
            aspect={2 / 3}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Panel Kontrol & Footer */}
        <div className="space-y-4 border-t p-5 bg-card">
          {/* Kontrol Zoom */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-muted-foreground w-12 shrink-0">
              Zoom
            </span>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onValueChange={(values: any) => setZoom(values[0])}
              className="flex-1 cursor-pointer"
            />
          </div>

          {/* Kontrol Rotasi */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Rotation
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="gap-2 font-medium"
            >
              <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />
              Rotate 90°
            </Button>
          </div>

          {/* Tombol Aksi Akhir */}
          <DialogFooter className="flex sm:flex-row gap-2 pt-2 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImageSrc(null)}
              className="flex-1 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveCroppedImage}
              className="flex-1 font-semibold"
            >
              Apply & Save
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
