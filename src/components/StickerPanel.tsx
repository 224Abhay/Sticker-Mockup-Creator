import { X } from "lucide-react";
import { Button } from "./ui/button";
import { FileUpload } from "./FileUpload";

interface StickerFile {
  file: File;
  preview: string;
}

interface StickerPanelProps {
  stickers: StickerFile[];
  onStickerAdd: (files: File[]) => void;
  onStickerRemove: (index: number) => void;
}

export const StickerPanel = ({ stickers, onStickerAdd, onStickerRemove }: StickerPanelProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Stickers</h2>
      
      <FileUpload
        onFileSelect={onStickerAdd}
        accept="image/*"
        placeholder="Upload stickers (multiple files)"
        hasFile={false}
        multiple={true}
      />
      
      {stickers.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Uploaded stickers ({stickers.length})
          </p>
          <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 pr-2">
            {stickers.map((sticker, index) => (
              <div key={index} className="relative group">
                <div className="w-full h-24 bg-muted rounded-lg overflow-hidden border border-border">
                  <img 
                    src={sticker.preview} 
                    alt={`Sticker ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onStickerRemove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};