import { CloudOff, RefreshCw, Wifi } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme';
import { layout } from '@/lib/layout';
import { useAuth } from '@/modules/auth/auth-context';

export function ConnectivityBanner() {
  const { isOnline, pendingSync, runSync } = useAuth();

  if (isOnline && pendingSync === 0) {
    return (
      <View style={[styles.banner, styles.online]}>
        <Wifi size={16} color={colors.success} />
        <Text style={styles.onlineText}>Online — all changes synced</Text>
      </View>
    );
  }

  if (isOnline && pendingSync > 0) {
    return (
      <Pressable onPress={() => void runSync()} style={[styles.banner, styles.sync]}>
        <View style={[layout.row, layout.gapSm]}>
          <RefreshCw size={16} color={colors.warning} />
          <Text style={styles.syncText}>
            {pendingSync} item{pendingSync === 1 ? '' : 's'} waiting to sync
          </Text>
        </View>
        <Badge label="Sync now" variant="warning" />
      </Pressable>
    );
  }

  return (
    <View style={[styles.banner, styles.offline]}>
      <View style={[layout.row, layout.gapSm]}>
        <CloudOff size={16} color={colors.slate700} />
        <Text style={styles.offlineText}>Offline — saves locally until connected</Text>
      </View>
      {pendingSync > 0 ? <Badge label={`${pendingSync} queued`} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  online: {
    backgroundColor: colors.successBg,
    borderBottomColor: '#d1fae5',
    gap: 8,
  },
  onlineText: {
    fontSize: 14,
    color: colors.emerald800,
  },
  sync: {
    backgroundColor: colors.warningBg,
    borderBottomColor: '#fde68a',
  },
  syncText: {
    fontSize: 14,
    color: colors.amber900,
  },
  offline: {
    backgroundColor: colors.slate100,
    borderBottomColor: colors.border,
  },
  offlineText: {
    fontSize: 14,
    color: colors.slate700,
  },
});
