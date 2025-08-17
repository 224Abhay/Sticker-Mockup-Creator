import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { FileUpload } from "./FileUpload";
import { TemplateSelector } from "./TemplateSelector";

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
  onBackgroundSelect: (background: {
    name: string;
    url: string;
    coords: [number, number];
    length: number;
  }) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BackgroundPanel = ({ 
  backgrounds, 
  onBackgroundChange, 
  onBackgroundSelect,
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Backgrounds</h2>
        <TemplateSelector onBackgroundSelect={onBackgroundSelect} />
      </div>
      
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="small">Small</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
          <TabsTrigger value="large">Large</TabsTrigger>
        </TabsList>
        
        <TabsContent value="small" className="mt-4">
          {!backgrounds.small && (
            <FileUpload
              onFileSelect={(files) => handleFileSelect('small', files[0])}
              accept="image/*"
              placeholder="Upload small background"
              hasFile={false}
            />
          )}
        </TabsContent>
        
        <TabsContent value="medium" className="mt-4">
          {!backgrounds.medium && (
            <FileUpload
              onFileSelect={(files) => handleFileSelect('medium', files[0])}
              accept="image/*"
              placeholder="Upload medium background"
              hasFile={false}
            />
          )}
        </TabsContent>
        
        <TabsContent value="large" className="mt-4">
          {!backgrounds.large && (
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