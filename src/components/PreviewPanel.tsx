import { useState, useRef, useEffect, useCallback } from "react";

interface BackgroundFile {
  file: File;
  preview: string;
}

interface PreviewPanelProps {
  currentBackground?: BackgroundFile;
  currentPosition: { x: number; y: number; width: number; height: number };
  onStickerPositionChange: (position: { x: number; y: number; width: number; height: number }) => void;
  onPreviewDimensionsChange: (dimensions: { width: number; height: number }) => void;
  measurementSettings?: {
    showMeasurementLine: boolean;
    lineWidth: number;
    fontSize: number;
    distance: number;
    color: string;
    lineLength: number;
    endStyle: 'perpendicular' | 'arrow';
  };
}

export const PreviewPanel = ({ currentBackground, currentPosition, onStickerPositionChange, onPreviewDimensionsChange, measurementSettings }: PreviewPanelProps) => {
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
          <img 
            src={currentBackground.preview} 
            alt="Background preview"
            className="w-full h-full object-contain"
          />
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
              const lineLength = measurementSettings.lineLength / 100;
              
              // Scale factors to match the final mockup output
              // Get actual preview container dimensions
              const previewContainer = previewRef.current;
              const previewWidth = previewContainer ? previewContainer.offsetWidth : 400;
              const previewHeight = previewContainer ? previewContainer.offsetHeight : 256;
              
              // Calculate scale based on actual container size
              const scaleX = stickerBox.width / previewWidth;
              const scaleY = stickerBox.height / previewHeight;
              const baseScale = Math.min(scaleX, scaleY);
              
              // Apply additional scaling factor to account for higher resolution in final output
              // This makes preview elements smaller to match the relative size in final mockups
              const scale = baseScale; // Reduce by 80% to account for resolution difference
              
              // Scale the measurement settings to match preview size
              const scaledLineWidth = Math.max(1, measurementSettings.lineWidth * scale);
              const scaledFontSize = Math.max(8, measurementSettings.fontSize * scale);
              const scaledDistance = measurementSettings.distance * scale;
              const scaledEndSize = 20 * scale; // Size of perpendicular lines and arrow heads
              
                              if (isWider) {
                  // Horizontal measurement line
                  const lineY = stickerBox.y + stickerBox.height + scaledDistance;
                  const totalLength = stickerBox.width * lineLength;
                  const lineX1 = stickerBox.x + (stickerBox.width - totalLength) / 2;
                  const lineX2 = lineX1 + totalLength;
                  const centerX = (lineX1 + lineX2) / 2;
                  const textWidth = scaledFontSize * 0.7; // Approximate text width based on font size
                  const gapSize = textWidth + 20;
                
                return (
                  <>
                                         {/* Left line segment */}
                     <line
                       x1={lineX1}
                       y1={lineY}
                       x2={centerX - gapSize / 2}
                       y2={lineY}
                       stroke={measurementSettings.color}
                       strokeWidth={scaledLineWidth}
                     />
                     
                     {/* Right line segment */}
                     <line
                       x1={centerX + gapSize / 2}
                       y1={lineY}
                       x2={lineX2}
                       y2={lineY}
                       stroke={measurementSettings.color}
                       strokeWidth={scaledLineWidth}
                     />
                    
                                         {/* Left end */}
                     {measurementSettings.endStyle === 'perpendicular' ? (
                       <line
                         x1={lineX1}
                         y1={lineY - scaledEndSize}
                         x2={lineX1}
                         y2={lineY + scaledEndSize}
                         stroke={measurementSettings.color}
                         strokeWidth={scaledLineWidth}
                       />
                     ) : (
                       <polygon
                         points={`${lineX1 - scaledEndSize * 1.25},${lineY} ${lineX1},${lineY - scaledEndSize} ${lineX1},${lineY + scaledEndSize}`}
                         fill={measurementSettings.color}
                       />
                     )}
                     
                     {/* Right end */}
                     {measurementSettings.endStyle === 'perpendicular' ? (
                       <line
                         x1={lineX2}
                         y1={lineY - scaledEndSize}
                         x2={lineX2}
                         y2={lineY + scaledEndSize}
                         stroke={measurementSettings.color}
                         strokeWidth={scaledLineWidth}
                       />
                     ) : (
                       <polygon
                         points={`${lineX2 + scaledEndSize * 1.25},${lineY} ${lineX2},${lineY - scaledEndSize} ${lineX2},${lineY + scaledEndSize}`}
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
                       fontSize={scaledFontSize}
                       fontFamily="Open Sans"
                       fontWeight="bold"
                     >
                       {scaledFontSize > 20 ? '4cm' : '4cm'}
                     </text>
                  </>
                );
                             } else {
                 // Vertical measurement line
                 const lineX = stickerBox.x + stickerBox.width + scaledDistance;
                 const totalLength = stickerBox.height * lineLength;
                 const lineY1 = stickerBox.y + (stickerBox.height - totalLength) / 2;
                 const lineY2 = lineY1 + totalLength;
                 const centerY = (lineY1 + lineY2) / 2;
                 const textHeight = scaledFontSize;
                 const gapSize = textHeight + 20;
                
                return (
                  <>
                                         {/* Top line segment */}
                     <line
                       x1={lineX}
                       y1={lineY1}
                       x2={lineX}
                       y2={centerY - gapSize / 2}
                       stroke={measurementSettings.color}
                       strokeWidth={scaledLineWidth}
                     />
                     
                     {/* Bottom line segment */}
                     <line
                       x1={lineX}
                       y1={centerY + gapSize / 2}
                       x2={lineX}
                       y2={lineY2}
                       stroke={measurementSettings.color}
                       strokeWidth={scaledLineWidth}
                     />
                    
                                         {/* Top end */}
                     {measurementSettings.endStyle === 'perpendicular' ? (
                       <line
                         x1={lineX - scaledEndSize}
                         y1={lineY1}
                         x2={lineX + scaledEndSize}
                         y2={lineY1}
                         stroke={measurementSettings.color}
                         strokeWidth={scaledLineWidth}
                       />
                     ) : (
                       <polygon
                         points={`${lineX},${lineY1 - scaledEndSize * 1.25} ${lineX - scaledEndSize},${lineY1} ${lineX + scaledEndSize},${lineY1}`}
                         fill={measurementSettings.color}
                       />
                     )}
                     
                     {/* Bottom end */}
                     {measurementSettings.endStyle === 'perpendicular' ? (
                       <line
                         x1={lineX - scaledEndSize}
                         y1={lineY2}
                         x2={lineX + scaledEndSize}
                         y2={lineY2}
                         stroke={measurementSettings.color}
                         strokeWidth={scaledLineWidth}
                       />
                     ) : (
                       <polygon
                         points={`${lineX},${lineY2 + scaledEndSize * 1.25} ${lineX - scaledEndSize},${lineY2} ${lineX + scaledEndSize},${lineY2}`}
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
                       fontSize={scaledFontSize}
                       fontFamily="Open Sans"
                       fontWeight="bold"
                       transform={`rotate(-90 ${lineX} ${centerY})`}
                     >
                       {scaledFontSize > 20 ? '4cm' : '4cm'}
                     </text>
                  </>
                );
              }
            })()}
          </svg>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Drag to move, resize from bottom-right corner
        </p>
        
        {/* Position and size details */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">X Position:</span>
              <span className="font-mono font-medium">{Math.round(stickerBox.x)}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Y Position:</span>
              <span className="font-mono font-medium">{Math.round(stickerBox.y)}px</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Width:</span>
              <span className="font-mono font-medium">{Math.round(stickerBox.width)}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Height:</span>
              <span className="font-mono font-medium">{Math.round(stickerBox.height)}px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};