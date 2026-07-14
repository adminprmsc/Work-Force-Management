import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { Muted, Text } from '@/components/ui/text';
import {
  assetFileName,
  pickFromCamera,
  pickFromLibrary,
} from '@/lib/media-picker';
import {
  isSurveyAttachmentValue,
  type SurveyAttachmentUploadContext,
} from '@/lib/survey-attachment';
import { colors, spacing } from '@/lib/theme';
import { uploadSurveyAttachment } from '@/modules/api/storage-api';
import type { SurveyAttachmentFileValue, SurveyField } from '@/modules/api/types';

type SurveyAttachmentFieldProps = {
  field: SurveyField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  uploadContext?: SurveyAttachmentUploadContext;
  token?: string | null;
  isOnline?: boolean;
};

const IMAGE_PICKER_OPTIONS = {
  mediaType: 'photo' as const,
  quality: 0.8 as const,
  selectionLimit: 1,
};

export function SurveyAttachmentField({
  field,
  value,
  onChange,
  readOnly = false,
  uploadContext,
  token,
  isOnline = true,
}: SurveyAttachmentFieldProps) {
  const [uploading, setUploading] = useState(false);
  const fileValue = isSurveyAttachmentValue(value) ? value : null;
  const canUpload = Boolean(uploadContext?.formId && token && isOnline && !readOnly);

  const uploadAsset = async (uri: string, mimeType: string, name: string) => {
    if (!uploadContext || !token) return;

    setUploading(true);
    try {
      const result = await uploadSurveyAttachment(
        token,
        {
          formId: uploadContext.formId,
          fieldId: field.id,
          assignmentId: uploadContext.assignmentId,
          responseId: uploadContext.responseId ?? undefined,
        },
        { uri, type: mimeType, name },
      );

      const next: SurveyAttachmentFileValue = {
        attachmentId: result.id,
        url: result.url,
        name: result.name,
        mimeType: result.mimeType,
        size: result.size,
        storagePath: result.storagePath,
      };
      onChange(next);
    } catch (error) {
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Could not upload file',
      );
    } finally {
      setUploading(false);
    }
  };

  const uploadPickedAsset = async (
    asset: Awaited<ReturnType<typeof pickFromLibrary>>,
    fallbackName: string,
  ) => {
    if (!asset?.uri) return;
    await uploadAsset(
      asset.uri,
      asset.type ?? 'image/jpeg',
      assetFileName(asset, fallbackName),
    );
  };

  const pickImage = () => {
    Alert.alert('Add photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: () => {
          void (async () => {
            const asset = await pickFromCamera({
              ...IMAGE_PICKER_OPTIONS,
              saveToPhotos: false,
            });
            await uploadPickedAsset(asset, 'photo.jpg');
          })();
        },
      },
      {
        text: 'Gallery',
        onPress: () => {
          void (async () => {
            const asset = await pickFromLibrary(IMAGE_PICKER_OPTIONS);
            await uploadPickedAsset(asset, 'photo.jpg');
          })();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickFile = () => {
    void (async () => {
      const asset = await pickFromLibrary({
        mediaType: 'mixed',
        quality: 0.8,
        selectionLimit: 1,
      });
      await uploadPickedAsset(asset, 'attachment');
    })();
  };

  return (
    <View style={styles.container}>
      {fileValue ? (
        <View style={styles.preview}>
          {field.type === 'IMAGE' ? (
            <Image source={{ uri: fileValue.url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.fileBadge}>
              <Text style={styles.fileBadgeText}>File attached</Text>
            </View>
          )}
          <View style={styles.previewMeta}>
            <Text style={styles.fileName}>{fileValue.name}</Text>
            {fileValue.size ? (
              <Muted>{`${(fileValue.size / 1024).toFixed(1)} KB`}</Muted>
            ) : null}
          </View>
          {canUpload ? (
            <Pressable onPress={() => onChange(null)} style={styles.removeButton}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {canUpload ? (
        <Button
          variant="outline"
          label={
            uploading
              ? 'Uploading…'
              : fileValue
                ? field.type === 'IMAGE'
                  ? 'Replace photo'
                  : 'Replace file'
                : field.type === 'IMAGE'
                  ? 'Take or choose photo'
                  : 'Choose file'
          }
          onPress={field.type === 'IMAGE' ? pickImage : pickFile}
          disabled={uploading}
        />
      ) : !readOnly ? (
        <Muted>
          {!uploadContext?.formId
            ? 'File upload is not available here.'
            : !isOnline
              ? 'Connect to upload evidence photos and files.'
              : 'Start the visit before uploading evidence.'}
        </Muted>
      ) : null}

      {uploading ? (
        <View style={styles.uploadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Muted>Uploading…</Muted>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  fileBadge: {
    width: 72,
    height: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileBadgeText: {
    fontSize: 12,
    color: colors.muted,
  },
  previewMeta: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    paddingHorizontal: spacing.sm,
  },
  removeText: {
    color: colors.destructive,
    fontSize: 13,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
