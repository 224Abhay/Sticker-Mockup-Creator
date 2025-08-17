import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Info, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// WordPress configuration schema
const wordpressSchema = z.object({
  type: z.literal('wordpress'),
  siteUrl: z.string().min(1, "Site URL is required").url("Must be a valid URL"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type WordPressFormData = z.infer<typeof wordpressSchema>;

interface DestinationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (destination: { name?: string; type: 'wordpress' | 'aws-s3' | 'google-cloud' | 'azure-blob' | 'dropbox' | 'onedrive'; config: { siteUrl?: string; username?: string; password?: string }; isActive: boolean }) => void;
}

export const DestinationForm = ({ isOpen, onClose, onSave }: DestinationFormProps) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedType, setSelectedType] = useState<'wordpress' | 'aws-s3' | 'google-cloud' | 'azure-blob' | 'dropbox' | 'onedrive'>('wordpress');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WordPressFormData>({
    resolver: zodResolver(wordpressSchema),
    defaultValues: {
      type: 'wordpress',
      siteUrl: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: WordPressFormData) => {
    const destination = {
      name: `WordPress - ${data.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}`,
      type: data.type,
      isActive: true,
      config: {
        siteUrl: data.siteUrl,
        username: data.username,
        password: data.password,
      }
    };
    
    onSave(destination);
    toast({
      title: "Destination added",
      description: "WordPress destination added successfully!",
    });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const bucketTypes = [
    { value: 'wordpress', label: 'WordPress', description: 'Upload to WordPress Media Library', available: true },
    { value: 'aws-s3', label: 'Amazon S3', description: 'Upload to AWS S3 bucket', available: false },
    { value: 'google-cloud', label: 'Google Cloud Storage', description: 'Upload to Google Cloud Storage', available: false },
    { value: 'azure-blob', label: 'Azure Blob Storage', description: 'Upload to Azure Blob Storage', available: false },
    { value: 'dropbox', label: 'Dropbox', description: 'Upload to Dropbox folder', available: false },
    { value: 'onedrive', label: 'OneDrive', description: 'Upload to OneDrive folder', available: false },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Upload Destination</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Bucket Type Selection */}
          <div className="space-y-2">
            <Label>Destination Type</Label>
            <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination type" />
              </SelectTrigger>
              <SelectContent>
                {bucketTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} disabled={!type.available}>
                    <div className="flex items-center gap-2">
                      <span>{type.label}</span>
                      {!type.available && (
                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {bucketTypes.find(t => t.value === selectedType)?.description}
            </p>
          </div>

          {/* WordPress Configuration - Only show for WordPress type */}
          {selectedType === 'wordpress' && (
            <>
              {/* WordPress Site URL */}
              <div className="space-y-2">
                <Label htmlFor="siteUrl">WordPress Site URL</Label>
                <Input
                  id="siteUrl"
                  type="text"
                  placeholder="https://yoursite.com"
                  {...register("siteUrl")}
                  className={errors.siteUrl ? "border-red-500" : ""}
                />
                {errors.siteUrl && (
                  <p className="text-sm text-red-500">{errors.siteUrl.message}</p>
                )}
              </div>

              {/* WordPress Username */}
              <div className="space-y-2">
                <Label htmlFor="username">WordPress Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your WordPress username"
                  {...register("username")}
                  className={errors.username ? "border-red-500" : ""}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>

              {/* WordPress Password */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="password">WordPress Password</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => toast({
                      title: "WordPress Password",
                      description: "This is your WordPress user account password, needed to upload media to WordPress.",
                    })}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your WordPress password"
                    {...register("password")}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </>
          )}

          {/* Coming Soon Message for Other Types */}
          {selectedType !== 'wordpress' && (
            <div className="p-4 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {bucketTypes.find(t => t.value === selectedType)?.label} integration is currently under development.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={selectedType !== 'wordpress'}
            >
              Add Destination
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
