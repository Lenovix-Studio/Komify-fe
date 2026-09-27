"use client";

import React, { useState, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Area } from "@/types/uploadPage";

interface ImageCropModalProps {
  imageSrc: string | null;
  setImageSrc: (src: string | null) => void;
  crop?: any;
  setCrop?: any;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  zoom?: any;
  setZoom?: any;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  saveCroppedImage: () => void;
  skipCrop: () => void;
}

export function ImageCropModal({
  imageSrc,
  setImageSrc,
  rotation,
  setRotation,
  onCropComplete,
  saveCroppedImage,
  skipCrop,
}: ImageCropModalProps) {
  const isOpen = !!imageSrc;

  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });

  const imgRef = useRef<HTMLImageElement>(null);

  const handleComplete = (c: PixelCrop, percentCrop: any) => {
    if (!imgRef.current) return;
    if (c.width === 0 || c.height === 0) return;

    const { naturalWidth, naturalHeight } = imgRef.current;
    const actualPixelCrop = {
      x: (percentCrop.x * naturalWidth) / 100,
      y: (percentCrop.y * naturalHeight) / 100,
      width: (percentCrop.width * naturalWidth) / 100,
      height: (percentCrop.height * naturalHeight) / 100,
    };

    onCropComplete(percentCrop, actualPixelCrop);
  };

  const handleApply = () => {
    if (!imgRef.current) return;
    saveCroppedImage();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setImageSrc(null)}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden flex flex-col max-h-[85vh] bg-background gap-0 border">
        <DialogHeader className="p-4 border-b text-center sm:text-center">
          <DialogTitle className="text-base font-bold text-foreground">
            Adjust Cover Image
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex-1 bg-muted/40 overflow-auto flex items-center justify-center p-4">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={handleComplete}
              aspect={aspect}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease",
                  maxHeight: "50vh",
                  width: "auto",
                }}
              />
            </ReactCrop>
          )}
        </div>

        <div className="space-y-4 border-t p-5 bg-card flex flex-col">
          <div className="flex gap-2 justify-center pb-2 border-b border-border/40">
            <Button
              type="button"
              variant={aspect === 2 / 3 ? "default" : "outline"}
              size="sm"
              onClick={() => setAspect(2 / 3)}
            >
              2:3
            </Button>
            <Button
              type="button"
              variant={aspect === 3 / 2 ? "default" : "outline"}
              size="sm"
              onClick={() => setAspect(3 / 2)}
            >
              3:2
            </Button>
            <Button
              type="button"
              variant={aspect === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setAspect(1)}
            >
              1:1
            </Button>
            <Button
              type="button"
              variant={aspect === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setAspect(undefined)}
            >
              Free
            </Button>
          </div>

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

          <DialogFooter className="flex sm:flex-row gap-2 pt-2 sm:justify-stretch">
            <Button
              type="button"
              variant="secondary"
              onClick={skipCrop}
              className="flex-1 font-semibold"
            >
              Skip Crop
            </Button>
            <Button
              type="button"
              onClick={handleApply}
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
