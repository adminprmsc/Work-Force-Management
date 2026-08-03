import { AlertTriangle, MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Muted, Text } from '@/components/ui/text';
import { layout } from '@/lib/layout';
import {
  responseActionLabel,
  responseStatusBadgeVariant,
  responseStatusLabel,
} from '@/lib/survey';
import { colors, spacing } from '@/lib/theme';
import type { SurveyResponse } from '@/modules/api/types';

function siteLabel(response: SurveyResponse): string {
  const villageName = response.village?.name ?? 'Unknown village';
  return response.settlement?.name
    ? `${villageName} · ${response.settlement.name}`
    : villageName;
}

type SubmissionCardProps = {
  response: SurveyResponse;
  onOpen: (response: SurveyResponse) => void;
  showRemarks?: boolean;
};

export function SubmissionCard({ response, onOpen, showRemarks = false }: SubmissionCardProps) {
  const formTitle = response.form?.title ?? 'Survey';
  const packageName = response.procurementPackage?.name ?? 'Package';

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <CardTitle style={styles.title}>{formTitle}</CardTitle>
          <CardDescription style={layout.mtSm}>{packageName}</CardDescription>
        </View>
        <Badge
          label={responseStatusLabel(response.status)}
          variant={responseStatusBadgeVariant(response.status)}
        />
      </View>

      <View style={[layout.row, layout.gapSm, layout.mtSm]}>
        <MapPin size={14} color={colors.muted} />
        <Muted style={styles.site}>{siteLabel(response)}</Muted>
      </View>

      {showRemarks && response.reviewRemarks ? (
        <View style={styles.remarksBox}>
          <Text style={styles.remarksTitle}>Reviewer feedback</Text>
          <Text style={styles.remarksBody}>{response.reviewRemarks}</Text>
        </View>
      ) : null}

      <Button
        style={layout.mtMd}
        variant={response.status === 'REVERTED' ? 'default' : 'outline'}
        label={responseActionLabel(response.status)}
        onPress={() => onOpen(response)}
      />
    </Card>
  );
}

type RevertedSectionProps = {
  responses: SurveyResponse[];
  onOpen: (response: SurveyResponse) => void;
};

export function RevertedSubmissionsSection({ responses, onOpen }: RevertedSectionProps) {
  if (responses.length === 0) return null;

  return (
    <View style={styles.revertedSection}>
      <View style={[layout.row, layout.gapSm, layout.mbMd]}>
        <AlertTriangle size={20} color={colors.warning} />
        <View style={layout.flex1}>
          <Text style={styles.revertedTitle}>Reverted — resubmit for review</Text>
          <Muted style={layout.mtSm}>
            These surveys were sent back by your reviewer. Address the feedback below, then edit and
            resubmit.
          </Muted>
        </View>
      </View>

      <View style={styles.revertedList}>
        {responses.map((response) => (
          <SubmissionCard
            key={response.id}
            response={response}
            onOpen={onOpen}
            showRemarks
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    flex: 1,
  },
  site: {
    flex: 1,
  },
  remarksBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  remarksTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.amber900,
  },
  remarksBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.slate700,
  },
  revertedSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: colors.warningBg,
  },
  revertedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.amber900,
  },
  revertedList: {
    gap: spacing.md,
  },
});
