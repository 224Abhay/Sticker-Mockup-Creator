import { useState, useRef, useCallback, useEffect } from "react";

interface BackgroundFile {
  file: File;
  preview: string;
}

interface PreviewPanelProps {
  currentBackground?: BackgroundFile;
  currentPosition: { x: number; y: number; width: number; height: number };
  onStickerPositionChange: (position: { x: number; y: number; width: number; height: number }) => void;
  onPreviewDimensionsChange: (dimensions: { width: number; height: number }) => void;
  onMeasurementLineToggle?: (show: boolean) => void;
  onMeasurementSettingsChange?: (settings: {
    lineWidth: number;
    fontSize: number;
    distance: number;
    color: string;
    endStyle: 'perpendicular' | 'arrow';
  }) => void;
  onBackgroundRemove?: () => void;
  measurementSettings?: {
    showMeasurementLine: boolean;
    lineWidth: number;
    fontSize: number;
    distance: number;
    color: string;
    endStyle: 'perpendicular' | 'arrow';
  };
}

export const PreviewPanel = ({ currentBackground, currentPosition, onStickerPositionChange, onPreviewDimensionsChange, onMeasurementLineToggle, onMeasurementSettingsChange, onBackgroundRemove, measurementSettings }: PreviewPanelProps) => {
  const [stickerBox, setStickerBox] = useState(currentPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  const handleStickerBoxChange = useCallback((newStickerBox: typeof stickerBox) => {
    if (!isUpdatingRef.current) {
      setStickerBox(newStickerBox);
      onStickerPositionChange(newStickerBox);
    }
  }, [onStickerPositionChange]);

  useEffect(() => {
    isUpdatingRef.current = true;
    setStickerBox(currentPosition);
    isUpdatingRef.current = false;
  }, [currentPosition]);

  // Track preview dimensions and notify parent
  useEffect(() => {
    if (previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      onPreviewDimensionsChange({ width: rect.width, height: rect.height });
    }
  }, [onPreviewDimensionsChange]);

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    if (!previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();

    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - rect.left - stickerBox.x,
        y: e.clientY - rect.top - stickerBox.y
      });
    } else {
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();

    if (isDragging) {
      const newX = Math.max(0, Math.min(rect.width - stickerBox.width, e.clientX - rect.left - dragStart.x));
      const newY = Math.max(0, Math.min(rect.height - stickerBox.height, e.clientY - rect.top - dragStart.y));
      handleStickerBoxChange({ ...stickerBox, x: newX, y: newY });
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      // Use the larger delta to maintain square aspect ratio
      const delta = Math.max(deltaX, deltaY);
      const newSize = Math.max(20, Math.min(
        Math.min(rect.width - stickerBox.x, rect.height - stickerBox.y),
        stickerBox.width + delta
      ));
      handleStickerBoxChange({ ...stickerBox, width: newSize, height: newSize });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  return (
    <div className="space-y-4">
      <div
        ref={previewRef}
        className="relative w-full h-full bg-muted rounded-lg overflow-hidden border-2 border-border"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {currentBackground ? (
          <>
            <img
              src={currentBackground.preview}
              alt="Background preview"
              className="w-full h-full object-contain"
            />
            <button
              onClick={onBackgroundRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              aria-label="Remove background"
              title="Remove background"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Select a background to preview
          </div>
        )}

        {/* Sticker position box */}
        <div
          className="absolute border-2 border-primary bg-primary/20 cursor-move"
          style={{
            left: stickerBox.x,
            top: stickerBox.y,
            width: stickerBox.width,
            height: stickerBox.height,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-primary cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e, 'resize');
            }}
          />
        </div>

        {/* Measurement line preview */}
        {measurementSettings?.showMeasurementLine && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            {(() => {
              const isWider = stickerBox.width > stickerBox.height;
              // Calculate line length based on end style (100% for perpendicular, 95% for arrow)
              const lineLength = (measurementSettings.endStyle === 'arrow' ? 90 : 100) / 100;

              // Calculate absolute values based on sticker box size in preview
              // This matches the same calculation used in the final mockup generation
              const absoluteLineWidth = Math.max(1, (stickerBox.width * measurementSettings.lineWidth) / 100);
              const absoluteFontSize = Math.max(8, (stickerBox.height * measurementSettings.fontSize) / 100);
              const absoluteDistance = (stickerBox.width * measurementSettings.distance) / 100;
              const absoluteEndSize = Math.max(5, (stickerBox.width * 2) / 100); // 2% of sticker width for end elements

              if (isWider) {
                // Horizontal measurement line
                const lineY = stickerBox.y + stickerBox.height + absoluteDistance;
                const totalLength = stickerBox.width * lineLength;
                const lineX1 = stickerBox.x + (stickerBox.width - totalLength) / 2;
                const lineX2 = lineX1 + totalLength;
                const centerX = (lineX1 + lineX2) / 2;
                const textWidth = absoluteFontSize * 0.7; // Approximate text width based on font size
                const gapSize = textWidth + (absoluteFontSize * 2); // Scale gap with font size

                return (
                  <>
                    {/* Left line segment */}
                    <line
                      x1={lineX1}
                      y1={lineY}
                      x2={centerX - gapSize / 2}
                      y2={lineY}
                      stroke={measurementSettings.color}
                      strokeWidth={absoluteLineWidth}
                    />

                    {/* Right line segment */}
                    <line
                      x1={centerX + gapSize / 2}
                      y1={lineY}
                      x2={lineX2}
                      y2={lineY}
                      stroke={measurementSettings.color}
                      strokeWidth={absoluteLineWidth}
                    />

                    {/* Left end */}
                    {measurementSettings.endStyle === 'perpendicular' ? (
                      <line
                        x1={lineX1}
                        y1={lineY - absoluteEndSize}
                        x2={lineX1}
                        y2={lineY + absoluteEndSize}
                        stroke={measurementSettings.color}
                        strokeWidth={absoluteLineWidth}
                      />
                    ) : (
                      <polygon
                        points={`${lineX1 - absoluteEndSize * 1.25},${lineY} ${lineX1},${lineY - absoluteEndSize} ${lineX1},${lineY + absoluteEndSize}`}
                        fill={measurementSettings.color}
                      />
                    )}

                    {/* Right end */}
                    {measurementSettings.endStyle === 'perpendicular' ? (
                      <line
                        x1={lineX2}
                        y1={lineY - absoluteEndSize}
                        x2={lineX2}
                        y2={lineY + absoluteEndSize}
                        stroke={measurementSettings.color}
                        strokeWidth={absoluteLineWidth}
                      />
                    ) : (
                      <polygon
                        points={`${lineX2 + absoluteEndSize * 1.25},${lineY} ${lineX2},${lineY - absoluteEndSize} ${lineX2},${lineY + absoluteEndSize}`}
                        fill={measurementSettings.color}
                      />
                    )}

                    {/* Size text */}
                    <text
                      x={centerX}
                      y={lineY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={measurementSettings.color}
                      fontSize={absoluteFontSize}
                      fontFamily="Open Sans"
                      fontWeight="bold"
                    >
                      {absoluteFontSize > 20 ? '4cm' : '4cm'}
                    </text>
                  </>
                );
              } else {
                // Vertical measurement line
                const lineX = stickerBox.x + stickerBox.width + absoluteDistance;
                const totalLength = stickerBox.height * lineLength;
                const lineY1 = stickerBox.y + (stickerBox.height - totalLength) / 2;
                const lineY2 = lineY1 + totalLength;
                const centerY = (lineY1 + lineY2) / 2;
                const textHeight = absoluteFontSize;
                const gapSize = textHeight + (absoluteFontSize * 2);

                return (
                  <>
                    {/* Top line segment */}
                    <line
                      x1={lineX}
                      y1={lineY1}
                      x2={lineX}
                      y2={centerY - gapSize / 2}
                      stroke={measurementSettings.color}
                      strokeWidth={absoluteLineWidth}
                    />

                    {/* Bottom line segment */}
                    <line
                      x1={lineX}
                      y1={centerY + gapSize / 2}
                      x2={lineX}
                      y2={lineY2}
                      stroke={measurementSettings.color}
                      strokeWidth={absoluteLineWidth}
                    />

                    {/* Top end */}
                    {measurementSettings.endStyle === 'perpendicular' ? (
                      <line
                        x1={lineX - absoluteEndSize}
                        y1={lineY1}
                        x2={lineX + absoluteEndSize}
                        y2={lineY1}
                        stroke={measurementSettings.color}
                        strokeWidth={absoluteLineWidth}
                      />
                    ) : (
                      <polygon
                        points={`${lineX},${lineY1 - absoluteEndSize * 1.25} ${lineX - absoluteEndSize},${lineY1} ${lineX + absoluteEndSize},${lineY1}`}
                        fill={measurementSettings.color}
                      />
                    )}

                    {/* Bottom end */}
                    {measurementSettings.endStyle === 'perpendicular' ? (
                      <line
                        x1={lineX - absoluteEndSize}
                        y1={lineY2}
                        x2={lineX + absoluteEndSize}
                        y2={lineY2}
                        stroke={measurementSettings.color}
                        strokeWidth={absoluteLineWidth}
                      />
                    ) : (
                      <polygon
                        points={`${lineX},${lineY2 + absoluteEndSize * 1.25} ${lineX - absoluteEndSize},${lineY2} ${lineX + absoluteEndSize},${lineY2}`}
                        fill={measurementSettings.color}
                      />
                    )}

                    {/* Size text (rotated) */}
                    <text
                      x={lineX}
                      y={centerY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={measurementSettings.color}
                      fontSize={absoluteFontSize}
                      fontFamily="Open Sans"
                      fontWeight="bold"
                      transform={`rotate(-90 ${lineX} ${centerY})`}
                    >
                      {absoluteFontSize > 20 ? '4cm' : '4cm'}
                    </text>
                  </>
                );
              }
            })()}
          </svg>
        )}
      </div>
    </div>
  );
};