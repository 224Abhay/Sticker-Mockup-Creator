import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

interface MeasurementLinePanelProps {
  isOpen: boolean;
  onClose: () => void;
  measurementSettings: {
    showMeasurementLine: boolean;
    lineWidth: number;
    fontSize: number;
    distance: number;
    color: string;
    endStyle: 'perpendicular' | 'arrow';
  };
  onMeasurementLineToggle: (show: boolean) => void;
  onMeasurementSettingsChange: (settings: {
    lineWidth: number;
    fontSize: number;
    distance: number;
    color: string;
    endStyle: 'perpendicular' | 'arrow';
  }) => void;
}

export function MeasurementLinePanel({
  isOpen,
  onClose,
  measurementSettings,
  onMeasurementLineToggle,
  onMeasurementSettingsChange
}: MeasurementLinePanelProps) {
  const [localSettings, setLocalSettings] = useState(measurementSettings);

  const updateLocalSettings = (updates: Partial<typeof localSettings>) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);

    // Auto-save changes in real-time
    if (updates.showMeasurementLine !== undefined) {
      onMeasurementLineToggle(updates.showMeasurementLine);
    }

    // Only update measurement settings if showMeasurementLine is true
    if (localSettings.showMeasurementLine || updates.showMeasurementLine) {
      const settingsToUpdate = {
        ...localSettings,
        ...updates
      };

      // Remove showMeasurementLine from the settings object since it's handled separately
      const { showMeasurementLine, ...measurementSettingsOnly } = settingsToUpdate;
      onMeasurementSettingsChange(measurementSettingsOnly);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for click-outside-to-close */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      <div className="absolute top-0 transform mt-[50%] z-50 bg-card border rounded-lg shadow-lg p-4 w-80">
        {/* Arrow pointing down */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-card"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="measurement-line" className="text-sm font-medium pr-4">
            Show Measurement Line
          </Label>
          <Switch
            id="measurement-line"
            checked={localSettings.showMeasurementLine}
            onCheckedChange={(checked) => updateLocalSettings({ showMeasurementLine: checked })}
          />
        </div>
        <button
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-accent rounded-sm flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">

        {localSettings.showMeasurementLine && (
          <div className="space-y-4 pl-4 border-l-2 border-border">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Line Width: {localSettings.lineWidth}% of sticker length
              </Label>
              <Slider
                value={[localSettings.lineWidth]}
                onValueChange={(value) => updateLocalSettings({ lineWidth: value[0] })}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Font Size: {localSettings.fontSize}% of sticker length
              </Label>
              <Slider
                value={[localSettings.fontSize]}
                onValueChange={(value) => updateLocalSettings({ fontSize: value[0] })}
                min={2}
                max={20}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Distance: {localSettings.distance}% of sticker length
              </Label>
              <Slider
                value={[localSettings.distance]}
                onValueChange={(value) => updateLocalSettings({ distance: value[0] })}
                min={5}
                max={30}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-style" className="text-xs text-muted-foreground">
                End Style
              </Label>
              <Select
                value={localSettings.endStyle}
                onValueChange={(value: 'perpendicular' | 'arrow') => updateLocalSettings({ endStyle: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="perpendicular">Perpendicular Line</SelectItem>
                  <SelectItem value="arrow">Arrow Head</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-xs text-muted-foreground">
                Color
              </Label>
              <Select
                value={localSettings.color}
                onValueChange={(value) => updateLocalSettings({ color: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#FFFFFF">White</SelectItem>
                  <SelectItem value="#000000">Black</SelectItem>
                  <SelectItem value="#FF0000">Red</SelectItem>
                  <SelectItem value="#00FF00">Green</SelectItem>
                  <SelectItem value="#0000FF">Blue</SelectItem>
                  <SelectItem value="#FFFF00">Yellow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
