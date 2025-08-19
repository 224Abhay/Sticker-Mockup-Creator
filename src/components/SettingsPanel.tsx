import { Settings, Package, Plus, Trash2, Download, Upload, Image } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DestinationForm } from "./DestinationForm";

export interface MockupSettings {
  includeSquareMockup: boolean;
  squareMockupSuffix: string;
  smallMockupSuffix: string;
  mediumMockupSuffix: string;
  largeMockupSuffix: string;
}

export interface DownloadSettings {
  downloadAsZip: boolean;
}

export interface UploadDestination {
  id: string;
  name?: string; // Optional since WordPress destinations don't need names
  type: 'wordpress' | 'aws-s3' | 'google-cloud' | 'azure-blob' | 'dropbox' | 'onedrive';
  config: {
    siteUrl?: string; // WordPress
    username?: string; // WordPress
    password?: string; // WordPress
    // Future bucket types will have their own config properties
  };
  isActive: boolean;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isUploadMode: boolean;
  onSettingsSave: (settings: { destinations: UploadDestination[] }) => void;
  onDownloadSettingsSave: (settings: DownloadSettings) => void;
  onMockupSettingsSave: (settings: MockupSettings) => void;
  currentUploadDestinations: UploadDestination[];
  currentDownloadSettings: DownloadSettings;
  currentMockupSettings: MockupSettings;
}

export function SettingsPanel({
  isOpen,
  onClose,
  isUploadMode,
  onSettingsSave,
  onDownloadSettingsSave,
  onMockupSettingsSave,
  currentUploadDestinations,
  currentDownloadSettings,
  currentMockupSettings
}: SettingsPanelProps) {
  const { toast } = useToast();
  
  // Mockup settings state
  const [mockupSettings, setMockupSettings] = useState<MockupSettings>(currentMockupSettings);
  
  // Download settings state
  const [downloadSettings, setDownloadSettings] = useState<DownloadSettings>(currentDownloadSettings);
  
  // Upload destinations state
  const [destinations, setDestinations] = useState<UploadDestination[]>(currentUploadDestinations);
  
  // Modal states
  const [isAddDestinationModalOpen, setIsAddDestinationModalOpen] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMockupSettings(currentMockupSettings);
      setDownloadSettings(currentDownloadSettings);
      setDestinations(currentUploadDestinations);
    }
  }, [isOpen, currentMockupSettings, currentDownloadSettings, currentUploadDestinations]);

  const saveAllSettings = () => {
    // Save mockup settings
    onMockupSettingsSave(mockupSettings);
    
    // Save download settings
    onDownloadSettingsSave(downloadSettings);
    
    // Save upload settings
    onSettingsSave({ destinations });
    
    // Save to localStorage
    localStorage.setItem("mockup_settings", JSON.stringify(mockupSettings));
    localStorage.setItem("download_settings", JSON.stringify(downloadSettings));
    localStorage.setItem("upload_destinations", JSON.stringify(destinations));
  };

  // Auto-save function for individual settings
  const autoSave = () => {
    saveAllSettings();
  };

  // Auto-save when destinations change
  useEffect(() => {
    // Only auto-save if destinations have actually changed from the current props
    if (destinations.length !== currentUploadDestinations.length || 
        JSON.stringify(destinations) !== JSON.stringify(currentUploadDestinations)) {
      autoSave();
    }
  }, [destinations, currentUploadDestinations]);

  // Auto-save when mockup settings change
  useEffect(() => {
    if (mockupSettings !== currentMockupSettings) {
      autoSave();
    }
  }, [mockupSettings]);

  // Auto-save when download settings change
  useEffect(() => {
    if (downloadSettings !== currentDownloadSettings) {
      autoSave();
    }
  }, [downloadSettings]);

  const addDestination = (destination: Omit<UploadDestination, 'id'>) => {
    const newDestination: UploadDestination = {
      ...destination,
      id: Date.now().toString(),
    };
    setDestinations([...destinations, newDestination]);
    setIsAddDestinationModalOpen(false);
  };

  const removeDestination = (id: string) => {
    setDestinations(destinations.filter(d => d.id !== id));
  };

  const toggleDestination = (id: string) => {
    setDestinations(destinations.map(d => 
      d.id === id ? { ...d, isActive: !d.isActive } : d
    ));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="mockup" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mockup" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Mockup Configuration
              </TabsTrigger>
              <TabsTrigger value="download" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Configuration
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Configuration
              </TabsTrigger>
            </TabsList>

            {/* Mockup Configuration Tab */}
            <TabsContent value="mockup" className="space-y-6">
              <div className="space-y-4 m-8">
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeSquareMockup" className="text-sm font-medium">
                    Include 1080x1080 Square Mockup
                  </Label>
                  <Switch
                    id="includeSquareMockup"
                    checked={mockupSettings.includeSquareMockup}
                    onCheckedChange={(checked) => {
                      const newSettings = { ...mockupSettings, includeSquareMockup: checked };
                      setMockupSettings(newSettings);
                      onMockupSettingsSave(newSettings);
                    }}
                  />
                </div>

                {/* Mockup Naming Convention - Always Visible */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Mockup Naming Convention</Label>
                  
                  <div className="space-y-3 pl-6 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label htmlFor="squareMockupSuffix" className="text-xs text-muted-foreground">
                        Square Mockup Suffix
                      </Label>
                      <Input
                        id="squareMockupSuffix"
                        value={mockupSettings.squareMockupSuffix}
                        onChange={(e) => {
                          const newSettings = { ...mockupSettings, squareMockupSuffix: e.target.value };
                          setMockupSettings(newSettings);
                          onMockupSettingsSave(newSettings);
                        }}
                        placeholder="square-mockup"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smallMockupSuffix" className="text-xs text-muted-foreground">
                        Small Mockup Suffix
                      </Label>
                      <Input
                        id="smallMockupSuffix"
                        value={mockupSettings.smallMockupSuffix}
                        onChange={(e) => {
                          const newSettings = { ...mockupSettings, smallMockupSuffix: e.target.value };
                          setMockupSettings(newSettings);
                          onMockupSettingsSave(newSettings);
                        }}
                        placeholder="small-mockup"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mediumMockupSuffix" className="text-xs text-muted-foreground">
                        Medium Mockup Suffix
                      </Label>
                      <Input
                        id="mediumMockupSuffix"
                        value={mockupSettings.mediumMockupSuffix}
                        onChange={(e) => {
                          const newSettings = { ...mockupSettings, mediumMockupSuffix: e.target.value };
                          setMockupSettings(newSettings);
                          onMockupSettingsSave(newSettings);
                        }}
                        placeholder="medium-mockup"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="largeMockupSuffix" className="text-xs text-muted-foreground">
                        Large Mockup Suffix
                      </Label>
                      <Input
                        id="largeMockupSuffix"
                        value={mockupSettings.largeMockupSuffix}
                        onChange={(e) => {
                          const newSettings = { ...mockupSettings, largeMockupSuffix: e.target.value };
                          setMockupSettings(newSettings);
                          onMockupSettingsSave(newSettings);
                        }}
                        placeholder="large-mockup"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Download Configuration Tab */}
            <TabsContent value="download" className="space-y-6">
                
                <div className="space-y-4 m-8">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="downloadAsZip" className="text-sm font-medium">
                      Download as ZIP
                    </Label>
                    <Switch
                      id="downloadAsZip"
                      checked={downloadSettings.downloadAsZip}
                      onCheckedChange={(checked) => {
                        const newSettings = { ...downloadSettings, downloadAsZip: checked };
                        setDownloadSettings(newSettings);
                        onDownloadSettingsSave(newSettings);
                      }}
                    />
                  </div>
                </div>
            </TabsContent>

            {/* Upload Configuration Tab */}
            <TabsContent value="upload" className="space-y-6">
                
                <div className="space-y-4 m-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium">Upload Destinations</h4>
                    <Button
                      onClick={() => setIsAddDestinationModalOpen(true)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add New
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {destinations.map((destination) => (
                      <div
                        key={destination.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{destination.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground capitalize">
                                {destination.type === 'aws-s3' ? 'Amazon S3' :
                                 destination.type === 'google-cloud' ? 'Google Cloud' :
                                 destination.type === 'azure-blob' ? 'Azure Blob' :
                                 destination.type === 'dropbox' ? 'Dropbox' :
                                 destination.type === 'onedrive' ? 'OneDrive' :
                                 destination.type}
                              </span>
                              {destination.type !== 'wordpress' && (
                                <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={destination.isActive}
                            onCheckedChange={(checked) => {
                              setDestinations(prev =>
                                prev.map(d =>
                                  d.id === destination.id ? { ...d, isActive: checked } : d
                                )
                              );
                            }}
                            disabled={destination.type !== 'wordpress'}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              removeDestination(destination.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {destinations.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No upload destinations configured</p>
                        <p className="text-sm">Add a destination to upload your mockups</p>
                      </div>
                    )}
                  </div>
                </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Destination Modal */}
      <Dialog open={isAddDestinationModalOpen} onOpenChange={setIsAddDestinationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Upload Destination</DialogTitle>
          </DialogHeader>
          <DestinationForm
            isOpen={isAddDestinationModalOpen}
            onClose={() => setIsAddDestinationModalOpen(false)}
            onSave={(destination) => {
              const newDestination = {
                ...destination,
                id: `dest_${Date.now()}` // Generate unique ID
              };
              setDestinations(prev => [...prev, newDestination]);
              setIsAddDestinationModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
