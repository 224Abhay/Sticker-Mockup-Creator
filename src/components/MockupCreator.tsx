import { useState } from "react";
import { Download, X, Archive } from "lucide-react";
import JSZip from "jszip";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { BackgroundPanel } from "./BackgroundPanel";
import { StickerPanel } from "./StickerPanel";
import { PreviewPanel } from "./PreviewPanel";
import { toast } from "sonner";

interface BackgroundFile {
  file: File;
  preview: string;
}

interface StickerFile {
  file: File;
  preview: string;
}

export const MockupCreator = () => {
  const [backgrounds, setBackgrounds] = useState<{
    small?: BackgroundFile;
    medium?: BackgroundFile;
    large?: BackgroundFile;
  }>({});
  const [stickers, setStickers] = useState<StickerFile[]>([]);
  const [activeTab, setActiveTab] = useState("small");
  const [stickerPositions, setStickerPositions] = useState({
    small: { x: 50, y: 50, width: 100, height: 100 },
    medium: { x: 50, y: 50, width: 100, height: 100 },
    large: { x: 50, y: 50, width: 100, height: 100 }
  });
  const [previewDimensions, setPreviewDimensions] = useState({
    small: { width: 400, height: 256 },
    medium: { width: 400, height: 256 },
    large: { width: 400, height: 256 }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [cancelGeneration, setCancelGeneration] = useState(false);
  const [downloadAsZip, setDownloadAsZip] = useState(false);
  
  // Measurement line settings - now using relative values
  const [showMeasurementLine, setShowMeasurementLine] = useState(true);
  const [measurementSettings, setMeasurementSettings] = useState<{
    lineWidth: number; // Percentage of sticker width
    fontSize: number; // Percentage of sticker height
    distance: number; // Percentage of sticker width
    color: string;
    endStyle: 'perpendicular' | 'arrow';
  }>({
    lineWidth: 2, // 2% of sticker width
    fontSize: 8, // 8% of sticker height
    distance: 10, // 10% of sticker width
    color: '#FFFFFF',
    endStyle: 'perpendicular'
  });

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const getContentBounds = (image: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { left: 0, top: 0, right: image.width, bottom: image.height };
    
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let left = canvas.width;
    let top = canvas.height;
    let right = 0;
    let bottom = 0;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3]; // Alpha channel
        
        if (alpha > 0) { // Non-transparent pixel
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }
    
    // If no non-transparent pixels found, return full bounds
    if (left > right || top > bottom) {
      return { left: 0, top: 0, right: image.width, bottom: image.height };
    }
    
    return { left, top, right: right + 1, bottom: bottom + 1 };
  };

  const handleBackgroundChange = async (size: 'small' | 'medium' | 'large', file: File | null) => {
    if (file) {
      const preview = await createFilePreview(file);
      setBackgrounds(prev => ({
        ...prev,
        [size]: { file, preview }
      }));
      toast.success(`${size} background uploaded!`);
    } else {
      setBackgrounds(prev => {
        const newBackgrounds = { ...prev };
        delete newBackgrounds[size];
        return newBackgrounds;
      });
      toast.info(`${size} background removed`);
    }
  };

  const handleStickerAdd = async (files: File[]) => {
    const newStickers = await Promise.all(
      files.map(async (file) => ({
        file,
        preview: await createFilePreview(file)
      }))
    );
    setStickers(prev => [...prev, ...newStickers]);
    toast.success(`${files.length} sticker${files.length > 1 ? 's' : ''} added!`);
  };

  const handleStickerRemove = (index: number) => {
    setStickers(prev => prev.filter((_, i) => i !== index));
    toast.info("Sticker removed");
  };

  const handleStickerPositionChange = (size: 'small' | 'medium' | 'large', position: { x: number; y: number; width: number; height: number }) => {
    setStickerPositions(prev => ({
      ...prev,
      [size]: position
    }));
  };

  const handlePreviewDimensionsChange = (size: 'small' | 'medium' | 'large', dimensions: { width: number; height: number }) => {
    setPreviewDimensions(prev => ({
      ...prev,
      [size]: dimensions
    }));
  };

  const generateMockups = async () => {
    const backgroundList = Object.values(backgrounds).filter(Boolean);
    
    if (backgroundList.length === 0) {
      toast.error("Please upload at least one background");
      return;
    }
    
    if (stickers.length === 0) {
      toast.error("Please upload at least one sticker");
      return;
    }

    setIsGenerating(true);
    setCancelGeneration(false);
    const totalMockups = backgroundList.length * stickers.length;
    setGenerationProgress({ current: 0, total: totalMockups });
    toast.info("Generating mockups...");

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const mockups: { blob: Blob; filename: string }[] = [];
      let currentProgress = 0;

      for (const background of backgroundList) {
        for (const sticker of stickers) {
          // Check for cancellation
          if (cancelGeneration) {
            toast.info("Generation cancelled");
            return;
          }

          currentProgress++;
          setGenerationProgress({ current: currentProgress, total: totalMockups });
          // Create background image
          const bgImg = new Image();
          bgImg.src = background.preview;
          
          await new Promise(resolve => {
            bgImg.onload = resolve;
          });

          // Set canvas size to background size
          canvas.width = bgImg.width;
          canvas.height = bgImg.height;

          // Draw background
          ctx.drawImage(bgImg, 0, 0);

          // Create sticker image
          const stickerImg = new Image();
          stickerImg.src = sticker.preview;
          
          await new Promise(resolve => {
            stickerImg.onload = resolve;
          });

          // Calculate sticker position and size based on preview ratios for each background size
          const backgroundSize = Object.keys(backgrounds).find(key => backgrounds[key as keyof typeof backgrounds] === background) as 'small' | 'medium' | 'large';
          const currentStickerPosition = stickerPositions[backgroundSize];
          const currentPreviewDimensions = previewDimensions[backgroundSize];
          const stickerX = (currentStickerPosition.x / currentPreviewDimensions.width) * canvas.width;
          const stickerY = (currentStickerPosition.y / currentPreviewDimensions.height) * canvas.height;
          const boxW = (currentStickerPosition.width / currentPreviewDimensions.width) * canvas.width;
          const boxH = (currentStickerPosition.height / currentPreviewDimensions.height) * canvas.height;

          // Get the actual content bounds of the sticker (ignoring transparent pixels)
          const contentBounds = getContentBounds(stickerImg);
          
          // Calculate sticker dimensions to maintain aspect ratio and fit inside the box
          // Use the actual content bounds instead of the full image dimensions
          const contentWidth = contentBounds.right - contentBounds.left;
          const contentHeight = contentBounds.bottom - contentBounds.top;
          const stickerAspectRatio = contentWidth / contentHeight;
          const boxAspectRatio = boxW / boxH;
          
          let stickerW, stickerH;
          if (stickerAspectRatio > boxAspectRatio) {
            // Sticker content is wider than box - fit to width
            stickerW = boxW;
            stickerH = boxW / stickerAspectRatio;
          } else {
            // Sticker content is taller than box - fit to height
            stickerH = boxH;
            stickerW = boxH * stickerAspectRatio;
          }

          // Center the sticker within the box
          const centerX = stickerX + boxW / 2;
          const centerY = stickerY + boxH / 2;
          const finalStickerX = centerX - stickerW / 2;
          const finalStickerY = centerY - stickerH / 2;

          // Draw sticker with content bounds offset
          const sourceX = contentBounds.left;
          const sourceY = contentBounds.top;
          const sourceWidth = contentWidth;
          const sourceHeight = contentHeight;
          
          ctx.drawImage(stickerImg, sourceX, sourceY, sourceWidth, sourceHeight, finalStickerX, finalStickerY, stickerW, stickerH);

          // Add measurement line if enabled
          if (showMeasurementLine) {
            const sizeText = backgroundSize === 'small' ? '4cm' : backgroundSize === 'medium' ? '6cm' : '10cm';
            const isWider = stickerW > stickerH;
            
            // Calculate line length based on end style (100% for perpendicular, 95% for arrow)
            const lineLength = measurementSettings.endStyle === 'arrow' ? 90 : 100;
            
            // Calculate absolute values based on sticker size
            const absoluteLineWidth = Math.max(1, (stickerW * measurementSettings.lineWidth) / 100);
            const absoluteFontSize = Math.max(8, (stickerH * measurementSettings.fontSize) / 100);
            const absoluteDistance = (stickerW * measurementSettings.distance) / 100;
            const absoluteEndSize = Math.max(5, (stickerW * 2) / 100); // 2% of sticker width for end elements
            
            // Set line styling
            ctx.strokeStyle = measurementSettings.color;
            ctx.lineWidth = absoluteLineWidth;
            ctx.fillStyle = measurementSettings.color;
            ctx.font = `bold ${absoluteFontSize}px "Open Sans"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
          
          if (isWider) {
            // Horizontal line (width is bigger)
            const lineY = finalStickerY + stickerH + absoluteDistance;
            const totalLength = stickerW * (lineLength / 100);
            const lineX1 = finalStickerX + (stickerW - totalLength) / 2;
            const lineX2 = lineX1 + totalLength;
            const centerX = (lineX1 + lineX2) / 2;
            const textWidth = ctx.measureText(sizeText).width;
            const gapSize = textWidth + (absoluteFontSize * 2); // Scale gap with font size
            
            // Draw left end
            if (measurementSettings.endStyle === 'perpendicular') {
              ctx.beginPath();
              ctx.moveTo(lineX1, lineY - absoluteEndSize);
              ctx.lineTo(lineX1, lineY + absoluteEndSize);
              ctx.stroke();
            } else {
              // Arrow head
              ctx.beginPath();
              ctx.moveTo(lineX1 - absoluteEndSize * 1.25, lineY);
              ctx.lineTo(lineX1, lineY - absoluteEndSize);
              ctx.lineTo(lineX1, lineY + absoluteEndSize);
              ctx.closePath();
              ctx.fill();
            }
            
            // Draw left arrow shaft
            ctx.beginPath();
            ctx.moveTo(lineX1, lineY);
            ctx.lineTo(centerX - gapSize / 2, lineY);
            ctx.stroke();
            
            // Draw right end
            if (measurementSettings.endStyle === 'perpendicular') {
              ctx.beginPath();
              ctx.moveTo(lineX2, lineY - absoluteEndSize);
              ctx.lineTo(lineX2, lineY + absoluteEndSize);
              ctx.stroke();
            } else {
              // Arrow head
              ctx.beginPath();
              ctx.moveTo(lineX2 + absoluteEndSize * 1.25, lineY);
              ctx.lineTo(lineX2, lineY - absoluteEndSize);
              ctx.lineTo(lineX2, lineY + absoluteEndSize);
              ctx.closePath();
              ctx.fill();
            }
            
            // Draw right arrow shaft
            ctx.beginPath();
            ctx.moveTo(lineX2, lineY);
            ctx.lineTo(centerX + gapSize / 2, lineY);
            ctx.stroke();
            
            // Draw size text in the gap
            ctx.fillText(sizeText, centerX, lineY);
            
          } else {
            // Vertical line (height is bigger)
            const lineX = finalStickerX + stickerW + absoluteDistance;
            const totalLength = stickerH * (lineLength / 100);
            const lineY1 = finalStickerY + (stickerH - totalLength) / 2;
            const lineY2 = lineY1 + totalLength;
            const centerY = (lineY1 + lineY2) / 2;
            const textHeight = absoluteFontSize; // Use calculated font size
            const gapSize = textHeight + (absoluteFontSize * 2); // Scale gap with font size
            
            // Draw top end
            if (measurementSettings.endStyle === 'perpendicular') {
              ctx.beginPath();
              ctx.moveTo(lineX - absoluteEndSize, lineY1);
              ctx.lineTo(lineX + absoluteEndSize, lineY1);
              ctx.stroke();
            } else {
              // Arrow head
              ctx.beginPath();
              ctx.moveTo(lineX, lineY1 - absoluteEndSize * 1.25);
              ctx.lineTo(lineX - absoluteEndSize, lineY1);
              ctx.lineTo(lineX + absoluteEndSize, lineY1);
              ctx.closePath();
              ctx.fill();
            }
            
            // Draw top arrow shaft
            ctx.beginPath();
            ctx.moveTo(lineX, lineY1);
            ctx.lineTo(lineX, centerY - gapSize / 2);
            ctx.stroke();
            
            // Draw bottom end
            if (measurementSettings.endStyle === 'perpendicular') {
              ctx.beginPath();
              ctx.moveTo(lineX - absoluteEndSize, lineY2);
              ctx.lineTo(lineX + absoluteEndSize, lineY2);
              ctx.stroke();
            } else {
              // Arrow head
              ctx.beginPath();
              ctx.moveTo(lineX, lineY2 + absoluteEndSize * 1.25);
              ctx.lineTo(lineX - absoluteEndSize, lineY2);
              ctx.lineTo(lineX + absoluteEndSize, lineY2);
              ctx.closePath();
              ctx.fill();
            }
            
            // Draw bottom arrow shaft
            ctx.beginPath();
            ctx.moveTo(lineX, lineY2);
            ctx.lineTo(lineX, centerY + gapSize / 2);
            ctx.stroke();
            
            // Draw size text in the gap (rotated)
            ctx.save();
            ctx.translate(lineX, centerY);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(sizeText, 0, 0);
            ctx.restore();
          }
          }

          // Convert to blob
          const blob = await new Promise<Blob>(resolve => {
            canvas.toBlob(blob => resolve(blob!), 'image/png');
          });
          
          // Create filename with sticker name, background name, and background size
          const stickerName = sticker.file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
          const backgroundName = background.file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
          const filename = `${stickerName}-${backgroundName}-${backgroundSize}.png`;
          
          mockups.push({ blob, filename });
        }
      }

      // Download mockups
      if (downloadAsZip) {
        // Create zip file
        const zip = new JSZip();
        
        // Add all mockups to zip
        mockups.forEach((mockup) => {
          zip.file(mockup.filename, mockup.blob);
        });
        
        // Generate and download zip
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sticker-mockups-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Generated ${mockups.length} mockups and downloaded as ZIP!`);
      } else {
        // Download individual files
        mockups.forEach((mockup) => {
          const url = URL.createObjectURL(mockup.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = mockup.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
        
        toast.success(`Generated ${mockups.length} mockups successfully!`);
      }
    } catch (error) {
      toast.error("Error generating mockups");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalMockups = Object.values(backgrounds).filter(Boolean).length * stickers.length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Sticker Mockup Creator
          </h1>
          <p className="text-muted-foreground">
            Upload backgrounds and stickers to generate beautiful mockups
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Background Panel - 3 columns */}
          <div className="lg:col-span-3 bg-card p-6 rounded-lg border shadow-elegant">
            <BackgroundPanel
              backgrounds={backgrounds}
              onBackgroundChange={handleBackgroundChange}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            
            <div className="mt-6 space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Preview</h3>
              
              {backgrounds[activeTab as keyof typeof backgrounds] ? (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{activeTab} Background</h4>
                  <PreviewPanel
                    currentBackground={backgrounds[activeTab as keyof typeof backgrounds]}
                    currentPosition={stickerPositions[activeTab as keyof typeof stickerPositions]}
                    onStickerPositionChange={(position) => handleStickerPositionChange(activeTab as 'small' | 'medium' | 'large', position)}
                    onPreviewDimensionsChange={(dimensions) => handlePreviewDimensionsChange(activeTab as 'small' | 'medium' | 'large', dimensions)}
                    onMeasurementLineToggle={setShowMeasurementLine}
                    onMeasurementSettingsChange={setMeasurementSettings}
                    measurementSettings={{
                      showMeasurementLine,
                      ...measurementSettings
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center text-muted-foreground border-2 border-border">
                  Upload a {activeTab} background to see preview
                </div>
              )}
            </div>
          </div>

          {/* Sticker Panel - 2 columns */}
          <div className="lg:col-span-2 bg-card p-6 rounded-lg border shadow-elegant">
            <StickerPanel
              stickers={stickers}
              onStickerAdd={handleStickerAdd}
              onStickerRemove={handleStickerRemove}
            />
          </div>
        </div>
        
        {/* Download Options and Generate Button */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Download Options</p>
                <p className="text-xs text-muted-foreground">
                  Choose how to download your mockups
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="downloadAsZip"
                checked={downloadAsZip}
                onChange={(e) => setDownloadAsZip(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="downloadAsZip" className="text-sm text-muted-foreground">
                Download as ZIP
              </label>
            </div>
          </div>
          
          <Button
            variant="generate"
            size="lg"
            className="w-full"
            onClick={generateMockups}
            disabled={totalMockups === 0 || isGenerating}
          >
            {downloadAsZip ? <Archive className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {isGenerating ? 'Generating...' : downloadAsZip ? 'Generate & Download ZIP' : 'Generate Mockups'}
          </Button>
        </div>

        {/* Loading Screen */}
        {isGenerating && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-8 rounded-lg border shadow-lg max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Generating Mockups</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelGeneration(true)}
                  className="h-8 px-3"
                >
                  Cancel
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{generationProgress.current} / {generationProgress.total}</span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${generationProgress.total > 0 ? (generationProgress.current / generationProgress.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  {generationProgress.current === generationProgress.total 
                    ? 'Finalizing...' 
                    : `Generating mockup ${generationProgress.current} of ${generationProgress.total}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};