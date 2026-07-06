import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { MapPin, PlayCircle } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Muted, Text } from '@/components/ui/text';
import { layout } from '@/lib/layout';
import { colors } from '@/lib/theme';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/modules/auth/auth-context';
import { getProcurementPackage } from '@/modules/api/procurement-api';
import type { ProcurementPackage, SurveyAssignment } from '@/modules/api/types';
import { getCachedAssignments } from '@/modules/offline/offline-store';
import { listMySurveyAssignments } from '@/modules/api/survey-api';

export function AssignmentDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AssignmentDetail'>>();
  const { id } = route.params;
  const { token, isOnline } = useAuth();
  const [assignment, setAssignment] = useState<SurveyAssignment | null>(null);
  const [pkg, setPkg] = useState<ProcurementPackage | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      let assignments: SurveyAssignment[];
      if (isOnline) {
        assignments = await listMySurveyAssignments(token);
      } else {
        assignments = await getCachedAssignments();
      }
      const found = assignments.find((item) => item.id === id) ?? null;
      setAssignment(found);
      if (found && isOnline) {
        setPkg(await getProcurementPackage(token, found.procurementPackage.id));
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [token, id, isOnline]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={layout.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={[layout.center, styles.notFound]}>
        <Text>Assignment not found.</Text>
      </View>
    );
  }

  const needsBaseline =
    assignment.requiresPackageBaseline && !assignment.procurementPackage.isBaselineComplete;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Card style={layout.mbMd}>
        <CardTitle>{assignment.formTitle}</CardTitle>
        <CardDescription style={layout.mtSm}>
          {assignment.procurementPackage.name} · {assignment.tehsil.name}
        </CardDescription>
        {assignment.instructions ? (
          <Muted style={layout.mtMd}>{assignment.instructions}</Muted>
        ) : null}
      </Card>

      {needsBaseline ? (
        <Card style={[layout.mbMd, styles.warningCard]}>
          <CardTitle>Package baseline required</CardTitle>
          <CardDescription style={[layout.mbMd, layout.mtSm]}>
            Complete the ESMP baseline for this package before starting village visits.
          </CardDescription>
          <Button
            label="Open baseline form"
            onPress={() =>
              navigation.navigate('Baseline', {
                packageId: assignment.procurementPackage.id,
                formId: assignment.formId,
              })
            }
          />
        </Card>
      ) : (
        <Card style={layout.mbMd}>
          <View style={[layout.row, layout.gapSm, layout.mbMd]}>
            <PlayCircle size={20} color={colors.primary} />
            <CardTitle>Start village visit</CardTitle>
          </View>
          <CardDescription>
            Select a village from the package and fill the site visit survey. Works offline — syncs
            when connected.
          </CardDescription>
          <Button
            style={layout.mtMd}
            label="New site visit"
            onPress={() => navigation.navigate('Response', { assignmentId: assignment.id })}
          />
        </Card>
      )}

      {pkg ? (
        <Card>
          <View style={[layout.row, layout.gapSm, layout.mbSm]}>
            <MapPin size={18} color={colors.muted} />
            <CardTitle>Package villages</CardTitle>
          </View>
          {pkg.villages.map((village) => (
            <Text key={village.id} style={styles.villageItem}>
              · {village.name}
            </Text>
          ))}
        </Card>
      ) : !isOnline ? (
        <Muted>Village list loads when you are online.</Muted>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  notFound: {
    paddingHorizontal: 16,
  },
  warningCard: {
    borderColor: '#fde68a',
    backgroundColor: colors.warningBg,
  },
  villageItem: {
    paddingVertical: 4,
  },
});
