import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Image, FolderOpen, Download } from "lucide-react";

interface BackgroundImage {
  name: string;
  url: string;
  coords: [number, number];
  length: number;
}

interface TemplateSelectorProps {
  onBackgroundSelect: (background: BackgroundImage) => void;
}

export function TemplateSelector({ onBackgroundSelect }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([]);

  useEffect(() => {
    loadBackgroundImages();
  }, []);

  const loadBackgroundImages = async () => {
    try {
      // Load templates.json using Vite base path for GitHub Pages compatibility
      const base = import.meta.env.BASE_URL || '/';
      const normalizedBase = base.endsWith('/') ? base : base + '/';
      const templatesJsonUrl = `${normalizedBase}templates/templates.json`;

      let response = await fetch(templatesJsonUrl);
      if (!response.ok) {
        // Fallback: try relative path without the base (useful in some hosting setups)
        response = await fetch('templates/templates.json');
        if (!response.ok) {
          throw new Error('Failed to load templates.json');
        }
      }

      const templateData = await response.json();

      // Create background image objects with coordinates
      const backgroundImages: BackgroundImage[] = Object.entries(templateData).map(([filename, config]: [string, any]) => ({
        name: filename
          .replace('.png', '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase()),
        url: `${normalizedBase}templates/${filename}`,
        coords: config.coords,
        length: config.length
      }));

      setBackgrounds(backgroundImages);
    } catch (error) {
      console.error("Error loading background images:", error);
      
      // Fallback to hardcoded backgrounds if loading fails
      const base = import.meta.env.BASE_URL || '/';
      const normalizedBase = base.endsWith('/') ? base : base + '/';
      const fallbackBackgrounds: BackgroundImage[] = [
        {
          name: "Small Background",
          url: `${normalizedBase}templates/small-background.png`,
          coords: [12, 12],
          length: 23
        },
        {
          name: "Medium Background", 
          url: `${normalizedBase}templates/medium-background.png`,
          coords: [15, 15],
          length: 30
        },
        {
          name: "Large Background",
          url: `${normalizedBase}templates/large-background.png`,
          coords: [20, 20],
          length: 40
        }
      ];
      
      setBackgrounds(fallbackBackgrounds);
    }
  };

  const handleBackgroundSelect = (background: BackgroundImage) => {
    onBackgroundSelect(background);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Select from Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Background Image Gallery
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Choose a template to apply to your currently selected background size. The template will replace the current background and apply its coordinates.
          </div>

          {/* Background Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {backgrounds.map((background) => (
              <Card 
                key={background.name} 
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{background.name}</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    Coords: ({background.coords[0]}, {background.coords[1]}) | Size: {background.length}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Image Preview */}
                  <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src={background.url} 
                      alt={background.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <Image className="h-16 w-16 text-muted-foreground hidden" />
                  </div>

                  <Button 
                    onClick={() => handleBackgroundSelect(background)}
                    className="w-full"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Apply Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {backgrounds.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No background images available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
