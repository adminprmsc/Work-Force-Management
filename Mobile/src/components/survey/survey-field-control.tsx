import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SurveyAttachmentField } from '@/components/survey/survey-attachment-field';
import { SurveyAttachmentDisplay } from '@/components/survey/survey-attachment-display';
import type { SurveyAttachmentUploadContext } from '@/lib/survey-attachment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Muted, Text } from '@/components/ui/text';
import { layout } from '@/lib/layout';
import { resolveVisibleFieldIds, sectionToggleKey } from '@/lib/survey-field-visibility';
import { colors, spacing } from '@/lib/theme';
import type { SurveyField } from '@/modules/api/types';

type AnswerMap = Record<string, unknown>;

type SurveyFieldControlProps = {
  field: SurveyField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  uploadContext?: SurveyAttachmentUploadContext;
  token?: string | null;
  isOnline?: boolean;
};

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatTime(value: Date): string {
  return value.toTimeString().slice(0, 5);
}

function parseDateValue(value: unknown): Date {
  if (value) {
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function optionStyle(selected: boolean) {
  return [layout.option, selected && layout.optionSelected];
}

function IosPickerActions({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.pickerActions}>
      <Button variant="ghost" size="sm" label="Cancel" onPress={onCancel} />
      <Button size="sm" label="OK" onPress={onConfirm} />
    </View>
  );
}

export function SurveyFieldControl({
  field,
  value,
  onChange,
  readOnly = false,
  uploadContext,
  token,
  isOnline = true,
}: SurveyFieldControlProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pendingDate, setPendingDate] = useState(() => parseDateValue(value));
  const [pendingTime, setPendingTime] = useState(() => parseDateValue(value));

  if (field.type === 'SECTION_BREAK') {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{field.label}</Text>
        {field.helpText ? <Muted style={layout.mtSm}>{field.helpText}</Muted> : null}
      </View>
    );
  }

  const disabled = readOnly || field.config?.readOnly;

  const openDatePicker = () => {
    setPendingDate(parseDateValue(value));
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setPendingTime(parseDateValue(value));
    setShowTimePicker(true);
  };

  const confirmDate = () => {
    onChange(formatDate(pendingDate));
    setShowDatePicker(false);
  };

  const confirmTime = () => {
    onChange(formatTime(pendingTime));
    setShowTimePicker(false);
  };

  return (
    <View style={layout.mbLg}>
      <Label>
        {field.label}
        {field.required ? ' *' : ''}
      </Label>
      {field.helpText ? <Muted style={layout.mbSm}>{field.helpText}</Muted> : null}

      {(field.type === 'TEXT' ||
        field.type === 'EMAIL' ||
        field.type === 'CONTACT' ||
        field.type === 'CNIC') && (
        <Input
          value={String(value ?? '')}
          onChangeText={(text) => onChange(text)}
          editable={!disabled}
          keyboardType={
            field.type === 'EMAIL'
              ? 'email-address'
              : field.type === 'CONTACT'
                ? 'phone-pad'
                : 'default'
          }
        />
      )}

      {field.type === 'PARAGRAPH' && (
        <Input
          value={String(value ?? '')}
          onChangeText={(text) => onChange(text)}
          editable={!disabled}
          multiline
          numberOfLines={4}
          style={styles.paragraph}
          textAlignVertical="top"
        />
      )}

      {field.type === 'NUMBER' && (
        <Input
          value={value === undefined || value === null ? '' : String(value)}
          onChangeText={(text) => onChange(text === '' ? '' : Number(text))}
          editable={!disabled}
          keyboardType="numeric"
        />
      )}

      {(field.type === 'MULTIPLE_CHOICE' || field.type === 'DROPDOWN') && (
        <View style={styles.options}>
          {(field.config?.options ?? []).map((option) => {
            const selected = value === option.value;
            return (
              <Pressable
                key={option.value}
                disabled={disabled}
                onPress={() => onChange(option.value)}
                style={optionStyle(selected)}
              >
                <Text>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {field.type === 'CHECKBOXES' && (
        <View style={styles.options}>
          {(field.config?.options ?? []).map((option) => {
            const current = Array.isArray(value) ? (value as string[]) : [];
            const checked = current.includes(option.value);
            return (
              <Pressable
                key={option.value}
                disabled={disabled}
                onPress={() => {
                  const next = checked
                    ? current.filter((v) => v !== option.value)
                    : [...current, option.value];
                  onChange(next);
                }}
                style={optionStyle(checked)}
              >
                <Text>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {field.type === 'DATE' && (
        <>
          <Pressable
            disabled={disabled}
            onPress={openDatePicker}
            style={styles.pickerTrigger}
          >
            <Text>{value ? String(value) : 'Select date'}</Text>
          </Pressable>
          {showDatePicker && Platform.OS === 'ios' ? (
            <View style={styles.pickerSheet}>
              <DateTimePicker
                value={pendingDate}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  if (date) setPendingDate(date);
                }}
              />
              <IosPickerActions onCancel={() => setShowDatePicker(false)} onConfirm={confirmDate} />
            </View>
          ) : null}
          {showDatePicker && Platform.OS === 'android' ? (
            <DateTimePicker
              value={pendingDate}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) onChange(formatDate(date));
              }}
            />
          ) : null}
        </>
      )}

      {field.type === 'TIME' && (
        <>
          <Pressable
            disabled={disabled}
            onPress={openTimePicker}
            style={styles.pickerTrigger}
          >
            <Text>{value ? String(value) : 'Select time'}</Text>
          </Pressable>
          {showTimePicker && Platform.OS === 'ios' ? (
            <View style={styles.pickerSheet}>
              <DateTimePicker
                value={pendingTime}
                mode="time"
                display="spinner"
                onChange={(_, date) => {
                  if (date) setPendingTime(date);
                }}
              />
              <IosPickerActions onCancel={() => setShowTimePicker(false)} onConfirm={confirmTime} />
            </View>
          ) : null}
          {showTimePicker && Platform.OS === 'android' ? (
            <DateTimePicker
              value={pendingTime}
              mode="time"
              display="default"
              onChange={(_, date) => {
                setShowTimePicker(false);
                if (date) onChange(formatTime(date));
              }}
            />
          ) : null}
        </>
      )}

      {(field.type === 'FILE' || field.type === 'IMAGE') &&
        (readOnly || field.config?.readOnly ? (
          <SurveyAttachmentDisplay field={field} value={value} token={token} />
        ) : (
          <SurveyAttachmentField
            field={field}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            uploadContext={uploadContext}
            token={token}
            isOnline={isOnline}
          />
        ))}
    </View>
  );
}

export function SurveyFormRenderer({
  fields,
  answers,
  onChange,
  readOnly = false,
  uploadContext,
  token,
  isOnline = true,
}: {
  fields: SurveyField[];
  answers: AnswerMap;
  onChange: (fieldId: string, value: unknown) => void;
  readOnly?: boolean;
  uploadContext?: SurveyAttachmentUploadContext;
  token?: string | null;
  isOnline?: boolean;
}) {
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  const visibleIds = useMemo(
    () => resolveVisibleFieldIds(fields, answers),
    [fields, answers],
  );

  return (
    <ScrollView
      style={layout.flex1}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
    >
      {sorted.map((field) => {
        if (!visibleIds.has(field.id)) return null;
        if (field.type === 'SECTION_BREAK' && field.config?.optional) {
          const toggleKey = sectionToggleKey(field.id);
          const toggled = answers[toggleKey] === 'yes';
          return (
            <View key={field.id} style={styles.section}>
              <View style={styles.optionalHeader}>
                <Text style={styles.sectionTitle}>{field.label}</Text>
                {!readOnly ? (
                  <Pressable
                    onPress={() => onChange(toggleKey, toggled ? 'no' : 'yes')}
                    style={styles.toggleButton}
                  >
                    <Text style={styles.toggleText}>{toggled ? 'Yes' : 'No'}</Text>
                  </Pressable>
                ) : (
                  <Muted>{toggled ? 'Yes' : 'No'}</Muted>
                )}
              </View>
            </View>
          );
        }
        return (
          <SurveyFieldControl
            key={field.id}
            field={field}
            value={answers[field.id]}
            onChange={(value) => onChange(field.id, value)}
            readOnly={readOnly}
            uploadContext={uploadContext}
            token={token}
            isOnline={isOnline}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.md,
  },
  section: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  optionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  toggleText: {
    fontSize: 13,
    color: colors.foreground,
  },
  paragraph: {
    height: 96,
    paddingVertical: 8,
  },
  options: {
    gap: 8,
  },
  pickerTrigger: {
    height: 44,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  pickerSheet: {
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
