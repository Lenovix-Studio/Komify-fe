"use client";
import { useEffect, useRef, useState } from "react";

export function RotatableImage({
  src,
  alt,
  rotation,
  className,
}: {
  src: string;
  alt: string;
  rotation: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded || !imgRef.current || !canvasRef.current) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rot = ((rotation % 360) + 360) % 360;

    if (rot === 90 || rot === 270) {
      canvas.width = img.naturalHeight;
      canvas.height = img.naturalWidth;
    } else {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  }, [rotation, loaded]);

  return (
    <>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className="hidden"
        crossOrigin="anonymous"
      />
      {rotation === 0 ? (
        <img src={src} alt={alt} className={className} />
      ) : (
        <canvas
          ref={canvasRef}
          className={className}
          style={{ width: "100%", height: "auto" }}
        />
      )}
    </>
  );
}
