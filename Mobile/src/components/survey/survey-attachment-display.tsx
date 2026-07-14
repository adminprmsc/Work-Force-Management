import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Muted, Text } from '@/components/ui/text';
import { attachmentDisplayName, isSurveyAttachmentValue } from '@/lib/survey-attachment';
import { colors, spacing } from '@/lib/theme';
import { getSurveyAttachmentUrl } from '@/modules/api/storage-api';
import type { SurveyField } from '@/modules/api/types';

type SurveyAttachmentDisplayProps = {
  field: SurveyField;
  value: unknown;
  token?: string | null;
};

export function SurveyAttachmentDisplay({
  field,
  value,
  token,
}: SurveyAttachmentDisplayProps) {
  const attachment = isSurveyAttachmentValue(value) ? value : null;
  const [url, setUrl] = useState(attachment?.url ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!attachment || !token) {
      setUrl(attachment?.url ?? null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getSurveyAttachmentUrl(token, attachment.attachmentId)
      .then((result) => {
        if (!cancelled) setUrl(result.url);
      })
      .catch(() => {
        if (!cancelled) setUrl(attachment.url);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attachment, token]);

  if (!attachment) {
    return <Muted>{attachmentDisplayName(value)}</Muted>;
  }

  const openFile = () => {
    if (url) void Linking.openURL(url);
  };

  if (field.type === 'IMAGE') {
    return (
      <View style={styles.container}>
        {loading ? (
          <View style={styles.imagePlaceholder}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : url ? (
          <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Muted>Image unavailable</Muted>
          </View>
        )}
        <Pressable onPress={openFile} disabled={!url}>
          <Text style={styles.link}>{attachment.name}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={openFile} disabled={!url || loading}>
      <View style={styles.fileRow}>
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        <Text style={styles.link}>{attachment.name}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  image: {
    width: 160,
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  link: {
    color: colors.primary,
    fontSize: 14,
  },
});
