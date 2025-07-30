import { useState } from "react";
import { X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { FileUpload } from "./FileUpload";

interface BackgroundFile {
  file: File;
  preview: string;
}

interface BackgroundPanelProps {
  backgrounds: {
    small?: BackgroundFile;
    medium?: BackgroundFile;
    large?: BackgroundFile;
  };
  onBackgroundChange: (size: 'small' | 'medium' | 'large', file: File | null) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BackgroundPanel = ({ 
  backgrounds, 
  onBackgroundChange, 
  activeTab, 
  onTabChange 
}: BackgroundPanelProps) => {
  const handleFileSelect = (size: 'small' | 'medium' | 'large', file: File) => {
    onBackgroundChange(size, file);
  };

  const handleRemove = (size: 'small' | 'medium' | 'large') => {
    onBackgroundChange(size, null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Backgrounds</h2>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="small">Small</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
          <TabsTrigger value="large">Large</TabsTrigger>
        </TabsList>
        
        <TabsContent value="small" className="mt-4">
          {backgrounds.small ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border-2 border-border">
              <span className="text-sm text-muted-foreground">Small background uploaded</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove('small')}
              >
                Remove
              </Button>
            </div>
          ) : (
            <FileUpload
              onFileSelect={(files) => handleFileSelect('small', files[0])}
              accept="image/*"
              placeholder="Upload small background"
              hasFile={false}
            />
          )}
        </TabsContent>
        
        <TabsContent value="medium" className="mt-4">
          {backgrounds.medium ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border-2 border-border">
              <span className="text-sm text-muted-foreground">Medium background uploaded</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove('medium')}
              >
                Remove
              </Button>
            </div>
          ) : (
            <FileUpload
              onFileSelect={(files) => handleFileSelect('medium', files[0])}
              accept="image/*"
              placeholder="Upload medium background"
              hasFile={false}
            />
          )}
        </TabsContent>
        
        <TabsContent value="large" className="mt-4">
          {backgrounds.large ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border-2 border-border">
              <span className="text-sm text-muted-foreground">Large background uploaded</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove('large')}
              >
                Remove
              </Button>
            </div>
          ) : (
            <FileUpload
              onFileSelect={(files) => handleFileSelect('large', files[0])}
              accept="image/*"
              placeholder="Upload large background"
              hasFile={false}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};