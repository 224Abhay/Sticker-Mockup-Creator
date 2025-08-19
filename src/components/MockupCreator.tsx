import { useState, useEffect } from "react";
import { Download, Upload, Settings } from "lucide-react";
import heroBanner from "../assets/hero-banner.jpg";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { SettingsPanel } from "./SettingsPanel";
import { UploadDestination, MockupSettings, DownloadSettings } from "./SettingsPanel";
import { BackgroundPanel } from "./BackgroundPanel";
import { StickerPanel } from "./StickerPanel";
import { PreviewPanel } from "./PreviewPanel";
import { WordPressMediaService } from "../lib/wordpress-media";
import { toast } from "sonner";
import { MeasurementLinePanel } from "./MeasurementLinePanel";
import JSZip from "jszip";

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
  const [isDownloading, setisDownloading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [cancelGeneration, setCancelGeneration] = useState(false);
  const [downloadAsZip, setDownloadAsZip] = useState(false);

  // Mockup settings
  const [mockupSettings, setMockupSettings] = useState<MockupSettings>(() => {
    const saved = localStorage.getItem("mockup_settings");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      includeSquareMockup: true,
      squareMockupSuffix: '',
      smallMockupSuffix: '-S-4-cm',
      mediumMockupSuffix: '-M-6-cm',
      largeMockupSuffix: '-L-10-cm'
    };
  });

  // Mode toggle - Download vs Upload to WordPress
  const [isUploadMode, setIsUploadMode] = useState(false);

  // Upload destinations state
  const [uploadDestinations, setUploadDestinations] = useState<UploadDestination[]>(() => {
    const saved = localStorage.getItem("upload_destinations");
    return saved ? JSON.parse(saved) : [];
  });

  // WordPress services state
  const [mediaService, setMediaService] = useState<WordPressMediaService | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize WordPress media service when destinations change
  useEffect(() => {
    const wordpressDestination = uploadDestinations.find(d => d.type === 'wordpress' && d.isActive);
    if (wordpressDestination && wordpressDestination.config) {
      const media = new WordPressMediaService(
        wordpressDestination.config.siteUrl,
        wordpressDestination.config.username,
        wordpressDestination.config.password
      );
      setMediaService(media);
      console.log('WordPress media service initialized:', wordpressDestination.config.siteUrl);
    } else {
      setMediaService(null);
      console.log('No active WordPress destination found');
    }
  }, [uploadDestinations]);


  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Measurement line settings - now using relative values
  const [showMeasurementLine, setShowMeasurementLine] = useState(true);
  const [measurementSettings, setMeasurementSettings] = useState<{
    lineWidth: number; // Percentage of sticker width
    fontSize: number; // Percentage of sticker height
    distance: number; // Percentage of sticker width
    color: string;
    endStyle: 'perpendicular' | 'arrow';
  }>({
    lineWidth: 1, // 1% of sticker width
    fontSize: 10, // 10% of sticker height
    distance: 10, // 10% of sticker width
    color: '#FFFFFF',
    endStyle: 'perpendicular'
  });

  // Measurement line customization modal state
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);

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
    } else {
      setBackgrounds(prev => ({
        ...prev,
        [size]: undefined
      }));
    }
  };

  const handleBackgroundRemove = (size: 'small' | 'medium' | 'large') => {
    setBackgrounds(prev => ({
      ...prev,
      [size]: undefined
    }));
    toast.info(`${size} background removed`);
  };

  const handleBackgroundSelect = async (background: {
    name: string;
    url: string;
    coords: [number, number];
    length: number;
  }) => {
    try {
      // Load the background image from the URL
      const response = await fetch(background.url);
      if (!response.ok) {
        throw new Error('Failed to load background image');
      }

      const blob = await response.blob();
      const file = new File([blob], `${background.name}.png`, { type: 'image/png' });
      const preview = await createFilePreview(file);

      // Apply the template to the currently selected background size
      const currentSize = activeTab;

      // Add the background to the currently selected size
      setBackgrounds(prev => ({
        ...prev,
        [currentSize]: { file, preview }
      }));

      // Apply the coordinates and sizing from the template
      setStickerPositions(prev => ({
        ...prev,
        [currentSize]: {
          x: background.coords[0],
          y: background.coords[1],
          width: background.length,
          height: background.length
        }
      }));

      toast.success(`Template "${background.name}" applied!`);
    } catch (error) {
      console.error("Error loading background:", error);
      toast.error("Failed to load background image. Please try again.");
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

  const generateSquareMockup = async (sticker: StickerFile): Promise<{ blob: Blob; filename: string }> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Set canvas size to 1080x1080
    canvas.width = 1080;
    canvas.height = 1080;

    // Fill background with #F2F1EF
    ctx.fillStyle = '#F2F1EF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create sticker image
    const stickerImg = new Image();
    stickerImg.src = sticker.preview;

    await new Promise(resolve => {
      stickerImg.onload = resolve;
    });

    // Get the actual content bounds of the sticker (ignoring transparent pixels)
    const contentBounds = getContentBounds(stickerImg);
    const contentWidth = contentBounds.right - contentBounds.left;
    const contentHeight = contentBounds.bottom - contentBounds.top;

    // Calculate sticker size to fit nicely in the center (about 60% of canvas size)
    const maxStickerSize = Math.min(canvas.width, canvas.height) * 0.6;
    const stickerAspectRatio = contentWidth / contentHeight;

    let stickerW, stickerH;
    if (stickerAspectRatio > 1) {
      // Sticker is wider than tall
      stickerW = maxStickerSize;
      stickerH = maxStickerSize / stickerAspectRatio;
    } else {
      // Sticker is taller than wide
      stickerH = maxStickerSize;
      stickerW = maxStickerSize * stickerAspectRatio;
    }

    // Center the sticker
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const finalStickerX = centerX - stickerW / 2;
    const finalStickerY = centerY - stickerH / 2;

    // Create a temporary canvas for the sticker with shadow and outline
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Temp canvas context not available');

    // Set temp canvas size to accommodate shadow and outline
    const padding = 30; // Extra space for shadow and outline
    tempCanvas.width = stickerW + padding * 2;
    tempCanvas.height = stickerH + padding * 2;

    // Draw shadow
    tempCtx.save();
    tempCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    tempCtx.shadowBlur = 25;
    tempCtx.shadowOffsetX = 6;
    tempCtx.shadowOffsetY = 6;

    // Draw the sticker with shadow (this will create shadow only around the actual content)
    const sourceX = contentBounds.left;
    const sourceY = contentBounds.top;
    const sourceWidth = contentWidth;
    const sourceHeight = contentHeight;

    tempCtx.drawImage(stickerImg, sourceX, sourceY, sourceWidth, sourceHeight, padding, padding, stickerW, stickerH);
    tempCtx.restore();

    // Draw the sticker again on top to ensure it's visible
    tempCtx.drawImage(stickerImg, sourceX, sourceY, sourceWidth, sourceHeight, padding, padding, stickerW, stickerH);

    // Draw the temp canvas onto the main canvas
    ctx.drawImage(tempCanvas, finalStickerX - padding, finalStickerY - padding);

    // Convert to blob
    const blob = await new Promise<Blob>(resolve => {
      canvas.toBlob(blob => resolve(blob!), 'image/png');
    });

    // Create filename
    const stickerName = sticker.file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-"); // Remove file extension and replace spaces with hyphens
    const filename = `${stickerName}${mockupSettings.squareMockupSuffix}.png`;

    return { blob, filename };
  };

  const generateMockup = async (sticker: StickerFile, background?: BackgroundFile, backgroundSize?: 'small' | 'medium' | 'large'): Promise<{ blob: Blob; filename: string }> => {
    if (background && backgroundSize) {
      // Generate mockup with background
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

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
      const currentStickerPosition = stickerPositions[backgroundSize];
      const currentPreviewDimensions = previewDimensions[backgroundSize];
      const stickerX = (currentStickerPosition.x / currentPreviewDimensions.width) * canvas.width;
      const stickerY = (currentStickerPosition.y / currentPreviewDimensions.height) * canvas.height;
      const boxW = (currentStickerPosition.width / currentPreviewDimensions.width) * canvas.width;
      const boxH = (currentStickerPosition.height / currentPreviewDimensions.height) * canvas.height;

      // Get the actual content bounds of the sticker (ignoring transparent pixels)
      const contentBounds = getContentBounds(stickerImg);

      // Calculate sticker dimensions to maintain aspect ratio and fit inside the box
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
        // Use the larger dimension (width or height) to calculate font size for consistency
        const largerDimension = Math.max(stickerW, stickerH);
        const absoluteFontSize = Math.max(8, (largerDimension * measurementSettings.fontSize) / 100);
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

      const stickerName = sticker.file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-");
      const sizeSuffix = backgroundSize === 'small' ? mockupSettings.smallMockupSuffix : backgroundSize === 'medium' ? mockupSettings.mediumMockupSuffix : mockupSettings.largeMockupSuffix;
      const filename = `${stickerName}${sizeSuffix}.png`;

      return { blob, filename };
    } else {
      // Generate square mockup
      const squareMockup = await generateSquareMockup(sticker);
      return squareMockup;
    }
  };

  const generateMockups = async () => {
    const backgroundList = Object.values(backgrounds).filter(Boolean);

    if (backgroundList.length === 0 && !mockupSettings.includeSquareMockup) {
      toast.error("Please upload at least one background or enable square mockup");
      return;
    }

    if (stickers.length === 0) {
      toast.error("Please upload at least one sticker");
      return;
    }

    setisDownloading(true);
    setCancelGeneration(false);

    // Calculate total mockups
    let totalMockups = 0;
    if (mockupSettings.includeSquareMockup) {
      totalMockups += stickers.length; // One square mockup per sticker
    }
    if (backgroundList.length > 0) {
      totalMockups += backgroundList.length * stickers.length; // Regular mockups
    }

    setGenerationProgress({ current: 0, total: totalMockups });
    toast.info("Generating mockups...");

    try {
      const mockups: { blob: Blob; filename: string }[] = [];
      let currentProgress = 0;

      // Generate square mockups if enabled
      if (mockupSettings.includeSquareMockup) {
        for (const sticker of stickers) {
          // Check for cancellation
          if (cancelGeneration) {
            toast.info("Generation cancelled");
            return;
          }

          currentProgress++;
          setGenerationProgress({ current: currentProgress, total: totalMockups });

          const squareMockup = await generateSquareMockup(sticker);

          if (downloadAsZip) {
            mockups.push(squareMockup);
          } else {
            // Download immediately if not using ZIP
            const url = URL.createObjectURL(squareMockup.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = squareMockup.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }
      }

      // Generate regular mockups if backgrounds are uploaded
      if (backgroundList.length > 0) {
        for (const background of backgroundList) {
          for (const sticker of stickers) {
            // Check for cancellation
            if (cancelGeneration) {
              toast.info("Generation cancelled");
              return;
            }

            currentProgress++;
            setGenerationProgress({ current: currentProgress, total: totalMockups });

            const mockup = await generateMockup(sticker, background, Object.keys(backgrounds).find(key => backgrounds[key as keyof typeof backgrounds] === background) as 'small' | 'medium' | 'large');

            if (downloadAsZip) {
              mockups.push(mockup);
            } else {
              // Download immediately if not using ZIP
              const url = URL.createObjectURL(mockup.blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = mockup.filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }
        }
      }

      // Download mockups
      if (downloadAsZip && mockups.length > 0) {
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
      } else if (!downloadAsZip) {
        // Individual files were downloaded immediately
        toast.success(`Generated and downloaded ${totalMockups} mockups successfully!`);
      }
    } catch (error) {
      toast.error("Error generating mockups");
      console.error(error);
    } finally {
      setisDownloading(false);
    }
  };

  const uploadMockupsToWordPress = async () => {
    if (!mediaService) {
      toast.error("WordPress credentials not configured");
      return;
    }

    if (stickers.length === 0) {
      toast.error("No stickers to upload");
      return;
    }

    setIsUploading(true);

    try {
      const backgroundList = Object.values(backgrounds).filter(Boolean);
      let currentProgress = 0;
      const totalMockups = (mockupSettings.includeSquareMockup ? stickers.length : 0) + (backgroundList.length * stickers.length);

      // Generate square mockups if enabled
      if (mockupSettings.includeSquareMockup) {
        for (const sticker of stickers) {
          currentProgress++;

          const squareMockup = await generateSquareMockup(sticker);
          const squareFileName = `${sticker.file.name.replace(/\.[^/.]+$/, "")}${mockupSettings.squareMockupSuffix}.png`;

          // Convert to File object for upload
          const squareFile = new File([squareMockup.blob], squareFileName, { type: 'image/png' });

          try {
            await mediaService.uploadMedia(squareFile);
            toast.success(`Uploaded: ${squareFileName}`);
          } catch (error) {
            toast.error(`Failed to upload ${squareFileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Generate regular mockups if backgrounds are uploaded
      if (backgroundList.length > 0) {
        for (const background of backgroundList) {
          for (const sticker of stickers) {
            currentProgress++;

            const mockup = await generateMockup(sticker, background, Object.keys(backgrounds).find(key => backgrounds[key as keyof typeof backgrounds] === background) as 'small' | 'medium' | 'large');

            const sizeFile = new File([mockup.blob], mockup.filename, { type: 'image/png' });

            try {
              await mediaService.uploadMedia(sizeFile);
              toast.success(`Uploaded: ${mockup.filename}`);
            } catch (error) {
              toast.error(`Failed to upload ${mockup.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      }

      toast.success("All mockups uploaded successfully!");

    } catch (error) {
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const totalMockups = (mockupSettings.includeSquareMockup ? stickers.length : 0) + (Object.values(backgrounds).filter(Boolean).length * stickers.length);

  return (
    <div
      className="min-h-screen bg-background p-6 relative"
      style={{
        backgroundImage: `url(${heroBanner})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for 50% opacity */}
      <div className="absolute inset-0 bg-background/60"></div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Sticker Mockup Creator
          </h1>
          <p className="text-muted-foreground">
            Upload backgrounds and stickers to generate beautiful mockups
          </p>
        </div>

        {/* Mode Toggle and Config */}
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border shadow-elegant">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Download className={`h-5 w-5 ${!isUploadMode ? 'text-primary' : 'text-muted-foreground'}`} />
              <Label htmlFor="mode-toggle" className="text-sm font-medium">
                Download Mockups
              </Label>
            </div>
            <Switch
              id="mode-toggle"
              checked={isUploadMode}
              onCheckedChange={setIsUploadMode}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary"
            />
            <div className="flex items-center space-x-2">
              <Upload className={`h-5 w-5 ${isUploadMode ? 'text-primary' : 'text-muted-foreground'}`} />
              <Label htmlFor="mode-toggle" className="text-sm font-medium">
                Upload Mockups
              </Label>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </div>

        {/* Settings Panel Modal */}
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isUploadMode={isUploadMode}
          onSettingsSave={({ destinations }) => {
            setUploadDestinations(destinations);
          }}
          onDownloadSettingsSave={({ downloadAsZip: newDownloadAsZip }) => {
            setDownloadAsZip(newDownloadAsZip);
          }}
          onMockupSettingsSave={setMockupSettings}
          currentUploadDestinations={uploadDestinations}
          currentDownloadSettings={{
            downloadAsZip
          }}
          currentMockupSettings={mockupSettings}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Background Panel - 3 columns */}
          <div className="lg:col-span-3 bg-card p-6 rounded-lg border shadow-elegant">
            <BackgroundPanel
              backgrounds={backgrounds}
              onBackgroundChange={handleBackgroundChange}
              onBackgroundSelect={handleBackgroundSelect}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />



            {backgrounds[activeTab as keyof typeof backgrounds] && (
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Preview</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMeasurementModalOpen(!isMeasurementModalOpen)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Customize Measurement Line
                  </Button>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{activeTab} Background</h4>
                  <PreviewPanel
                    currentBackground={backgrounds[activeTab as keyof typeof backgrounds]}
                    currentPosition={stickerPositions[activeTab as keyof typeof stickerPositions]}
                    onStickerPositionChange={(position) => handleStickerPositionChange(activeTab as 'small' | 'medium' | 'large', position)}
                    onPreviewDimensionsChange={(dimensions) => handlePreviewDimensionsChange(activeTab as 'small' | 'medium' | 'large', dimensions)}
                    onMeasurementLineToggle={setShowMeasurementLine}
                    onMeasurementSettingsChange={setMeasurementSettings}
                    onBackgroundRemove={() => handleBackgroundRemove(activeTab as 'small' | 'medium' | 'large')}
                    measurementSettings={{
                      showMeasurementLine,
                      ...measurementSettings
                    }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Sticker Panel - 2 columns */}
          <div className="lg:col-span-2 bg-card p-6 rounded-lg border shadow-elegant relative">
            {/* Measurement Line Customization Panel */}
            <MeasurementLinePanel
              isOpen={isMeasurementModalOpen}
              onClose={() => setIsMeasurementModalOpen(false)}
              measurementSettings={{
                showMeasurementLine,
                ...measurementSettings
              }}
              onMeasurementLineToggle={setShowMeasurementLine}
              onMeasurementSettingsChange={setMeasurementSettings}
            />

            <StickerPanel
              stickers={stickers}
              onStickerAdd={handleStickerAdd}
              onStickerRemove={handleStickerRemove}
              isUploadMode={isUploadMode}
            />
          </div>
        </div>

        {/* Generate Buttons */}
        {!isUploadMode ? (
          /* Download Mode */
          <Button
            variant="generate"
            size="lg"
            className="w-full"
            onClick={generateMockups}
            disabled={totalMockups === 0 || isDownloading}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Generating...' : `Download ${totalMockups} Mockups`}
          </Button>
        ) : (
          /* Upload to WordPress Mode */
          <div className="space-y-4">

            <Button
              variant="generate"
              size="lg"
              className="w-full"
              onClick={uploadMockupsToWordPress}
              disabled={totalMockups === 0 || isUploading || !uploadDestinations.some(d => d.type === 'wordpress' && d.isActive) || !mediaService}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? 'Uploading...' : `Upload ${totalMockups} Mockups`}
            </Button>



            {/* Display product info status */}
            {/* Removed product info status display */}
          </div>
        )}

        {/* Loading Screen */}
        {(isDownloading || isUploading) && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-8 rounded-lg border shadow-lg max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {isUploading ? 'Uploading to WordPress' : 'Generating Mockups'}
                </h3>
                {isDownloading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelGeneration(true)}
                    className="h-8 px-3"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {isDownloading ? (
                  <>
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
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground">
                      Uploading images...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};