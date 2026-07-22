import { useId, useRef, useState } from 'react';
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  uploadOrganizationBrandingAsset,
  type OrganizationBrandingAssetType,
} from '@/services/organization/organizationBrandingUploadService';
import { cn } from '@/lib/utils';

interface OrgHubAssetUploadFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  organizationId: number;
  assetType: OrganizationBrandingAssetType;
  accept: string;
  previewClassName?: string;
}

export function OrgHubAssetUploadField({
  label,
  description,
  value,
  onChange,
  organizationId,
  assetType,
  accept,
  previewClassName,
}: OrgHubAssetUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const hasPreview = Boolean(value.trim()) && !previewFailed;

  const handleUpload = async (file: File | null | undefined) => {
    if (!file) return;

    setUploading(true);
    setPreviewFailed(false);
    try {
      const publicUrl = await uploadOrganizationBrandingAsset({
        organizationId,
        assetType,
        file,
      });
      onChange(publicUrl);
      toast({
        title: 'Bestand geüpload',
        description: `${label} is bijgewerkt. Vergeet niet op te slaan.`,
      });
    } catch (error) {
      toast({
        title: 'Upload mislukt',
        description: error instanceof Error ? error.message : 'Probeer opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={inputId}>{label}</Label>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {hasPreview ? (
        <div className="rounded-lg border border-primary/15 bg-background/80 p-3 sm:p-4 space-y-3">
          <div className="flex min-h-[88px] items-center justify-center rounded-md border border-dashed border-brand-300/50 bg-brand-100 p-3">
            <img
              src={value}
              alt=""
              className={cn('max-h-20 w-auto max-w-full object-contain', previewClassName)}
              onError={() => setPreviewFailed(true)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] w-full sm:w-auto"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="mr-2 h-4 w-4" aria-hidden />
              )}
              Vervangen
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-[44px] w-full sm:w-auto text-destructive hover:text-destructive"
              disabled={uploading}
              onClick={() => {
                onChange('');
                setPreviewFailed(false);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              Verwijderen
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-brand-300/50',
            'bg-brand-100 px-4 py-6 text-center transition-colors',
            'hover:bg-brand-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            uploading && 'opacity-70 cursor-wait',
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          ) : (
            <ImageIcon className="h-8 w-8 text-primary/70" aria-hidden />
          )}
          <span className="text-sm font-medium text-brand-dark">
            {uploading ? 'Uploaden…' : `${label} uploaden`}
          </span>
          <span className="text-xs text-muted-foreground">PNG, JPG, WEBP, SVG of ICO · max. 5 MB</span>
        </button>
      )}

      <Input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={uploading}
        onChange={(event) => void handleUpload(event.target.files?.[0])}
      />

      <div className="space-y-1">
        <Label htmlFor={`${inputId}-url`} className="text-xs text-muted-foreground">
          URL of pad (optioneel handmatig)
        </Label>
        <Input
          id={`${inputId}-url`}
          className="min-h-[44px] text-sm"
          value={value}
          placeholder="/images/logos/…"
          onChange={(event) => {
            setPreviewFailed(false);
            onChange(event.target.value);
          }}
        />
      </div>
    </div>
  );
}
