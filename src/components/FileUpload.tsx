import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "./ui/button";

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  onRemove?: () => void;
  accept: string;
  preview?: string;
  placeholder: string;
  hasFile?: boolean;
  multiple?: boolean;
}

export const FileUpload = ({ 
  onFileSelect, 
  onRemove, 
  accept, 
  preview, 
  placeholder,
  hasFile,
  multiple = false
}: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (multiple) {
        onFileSelect(Array.from(files));
      } else {
        const file = files[0];
        if (file) {
          onFileSelect([file]);
        }
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (hasFile && preview) {
    return (
      <div className="relative group">
        <div className="w-full h-32 bg-muted rounded-lg overflow-hidden border-2 border-border">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
        </div>
        {onRemove && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className="w-full h-32 border-2 border-dashed border-border hover:border-primary bg-muted/50 hover:bg-muted rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
    >
      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground text-center">{placeholder}</p>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};