"use client";
import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TONE_CLASSES } from "@/components/dashboard/DashboardWidgets";
import {
  FieldError,
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
} from "@/components/forms/FormParts";
import { useRemoveMyPhoto, useUploadMyPhoto } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const INPUT_ID = "profile-photo-input";

interface ProfilePhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl: string | null;
  initials: string;
  name: string;
}

export const ProfilePhotoDialog = ({
  open,
  onOpenChange,
  currentUrl,
  initials,
  name,
}: ProfilePhotoDialogProps) => {
  const t = useTranslations("profilePhoto");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { mutate: uploadPhoto, isPending: isUploading } = useUploadMyPhoto();
  const { mutate: removePhoto, isPending: isRemoving } = useRemoveMyPhoto();
  const isBusy = isUploading || isRemoving;

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    setFile(null);
    setError(null);
    setIsDragging(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (isBusy) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const pickFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setError(t("errType"));
      return;
    }
    if (candidate.size > MAX_PHOTO_BYTES) {
      setError(t("errSize"));
      return;
    }
    setError(null);
    setFile(candidate);
  };

  const handleSave = () => {
    if (!file) return;
    uploadPhoto(file, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  const handleRemove = () => {
    removePhoto(undefined, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  const shownUrl = previewUrl ?? currentUrl;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
          >
            <ImagePlus className="size-5" />
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {t("subtitle")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-32 w-32 ring-4 ring-indigo-500/15">
            {shownUrl && (
              <AvatarImage src={shownUrl} alt={name} className="object-cover" />
            )}
            <AvatarFallback className="bg-linear-to-br from-indigo-500 to-indigo-700 font-jakarta text-4xl font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <p className="font-manrope text-[11px] text-muted-foreground">
            {previewUrl
              ? t("newPhoto")
              : currentUrl
                ? t("currentPhoto")
                : t("noPhoto")}
          </p>
        </div>

        <label
          htmlFor={INPUT_ID}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            pickFile(e.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-indigo-500 ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/5"
              : "border-border bg-muted/30 hover:border-indigo-500/50 hover:bg-indigo-500/5"
          }`}
        >
          <Upload className="size-5 text-muted-foreground" />
          <span className="font-jakarta text-sm font-semibold text-foreground">
            {file ? (
              file.name
            ) : (
              <>
                {t("dropTitle")}{" "}
                <span className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400">
                  {t("browse")}
                </span>
              </>
            )}
          </span>
          <span className="font-manrope text-[11px] text-muted-foreground">
            {t("hint")}
          </span>
          <input
            id={INPUT_ID}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            disabled={isBusy}
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <FieldError message={error ?? undefined} />

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          {currentUrl && !file ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemove}
              disabled={isBusy}
              className="h-10 gap-1.5 rounded-full px-4 font-manrope text-sm text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            >
              {isRemoving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {isRemoving ? t("removing") : t("remove")}
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isBusy}
              className={`h-10 flex-1 px-4 text-sm sm:flex-none ${OUTLINE_PILL_CLASS}`}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!file || isBusy}
              className={`h-10 flex-1 gap-2 px-5 text-sm sm:flex-none ${PRIMARY_PILL_CLASS}`}
            >
              {isUploading && <Loader2 className="size-4 animate-spin" />}
              {isUploading ? t("saving") : t("save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
