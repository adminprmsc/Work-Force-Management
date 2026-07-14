import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenLayout } from '@/components/app/screen-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Muted } from '@/components/ui/text';
import type { AppNavigationProp } from '@/navigation/types';
import { layout } from '@/lib/layout';
import { colors, layoutPadding, spacing } from '@/lib/theme';
import { useAuth } from '@/modules/auth/auth-context';
import {
  listOfflineDrafts,
  removeOfflineDraft,
  withdrawQueuedSubmit,
  type OfflineSurveyDraft,
} from '@/modules/offline/offline-store';

function statusBadge(draft: OfflineSurveyDraft) {
  if (draft.pendingSubmit) return <Badge label="Submit queued" variant="warning" />;
  if (draft.status === 'failed') return <Badge label="Sync failed" variant="outline" />;
  if (draft.status === 'synced' || draft.status === 'submitted')
    return <Badge label="Synced" variant="success" />;
  return <Badge label="Saved offline" variant="secondary" />;
}

function confirmDiscard(onConfirm: () => void) {
  Alert.alert(
    'Discard draft?',
    'This removes the local copy from your device. It cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onConfirm },
    ],
  );
}

function confirmWithdraw(onConfirm: () => void) {
  Alert.alert(
    'Withdraw from queue?',
    'The submit will be cancelled. Your answers stay saved as a draft on this device.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', onPress: onConfirm },
    ],
  );
}

export function DraftsScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { runSync, isOnline, refreshPendingCount } = useAuth();
  const [drafts, setDrafts] = useState<OfflineSurveyDraft[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setDrafts(await listOfflineDrafts());
    await refreshPendingCount();
    setRefreshing(false);
  }, [refreshPendingCount]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const handleSyncAll = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Connect to the internet to sync queued work.');
      return;
    }
    await runSync();
    await load();
  };

  const handleWithdraw = (draft: OfflineSurveyDraft) => {
    confirmWithdraw(() => {
      void (async () => {
        await withdrawQueuedSubmit(draft.localId);
        await load();
      })();
    });
  };

  const handleDiscard = (draft: OfflineSurveyDraft) => {
    confirmDiscard(() => {
      void (async () => {
        await removeOfflineDraft(draft.localId);
        await load();
      })();
    });
  };

  return (
    <ScreenLayout
      action={
        <Button
          size="sm"
          variant="outline"
          label="Sync all"
          onPress={() => void handleSyncAll()}
        />
      }
    >
      <ScrollView
        style={layout.flex1}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {drafts.length === 0 ? (
          <Card>
            <CardTitle>No local drafts</CardTitle>
            <CardDescription>
              Start a village visit from an assignment. Drafts are saved here when offline.
            </CardDescription>
          </Card>
        ) : (
          drafts.map((draft) => (
            <Card key={draft.localId}>
              <Pressable
                onPress={() => navigation.navigate('Response', { localId: draft.localId })}
              >
                <View style={styles.cardHeader}>
                  <CardTitle style={styles.cardTitle}>
                    {draft.assignmentSnapshot.formTitle}
                  </CardTitle>
                  {statusBadge(draft)}
                </View>
                <CardDescription style={layout.mtSm}>
                  {draft.assignmentSnapshot.procurementPackage.name} · {draft.villageName}
                  {draft.settlementName ? ` · ${draft.settlementName}` : ''}
                </CardDescription>
                {draft.error ? (
                  <Muted style={[layout.mtSm, styles.errorText]}>{draft.error}</Muted>
                ) : null}
                <Muted style={layout.mtSm}>
                  Updated {new Date(draft.updatedAt).toLocaleString()}
                </Muted>
              </Pressable>

              <View style={styles.actions}>
                <Button
                  style={layout.flexButton}
                  variant="outline"
                  size="sm"
                  label="Open"
                  onPress={() => navigation.navigate('Response', { localId: draft.localId })}
                />
                {draft.pendingSubmit ? (
                  <Button
                    style={layout.flexButton}
                    variant="outline"
                    size="sm"
                    label="Withdraw"
                    onPress={() => handleWithdraw(draft)}
                  />
                ) : null}
                <Button
                  style={layout.flexButton}
                  variant="outline"
                  size="sm"
                  label="Discard"
                  onPress={() => handleDiscard(draft)}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: layoutPadding.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: { flex: 1 },
  errorText: {
    color: colors.destructive,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
