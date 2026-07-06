import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Label, Muted, Text } from '@/components/ui/text';
import { layout } from '@/lib/layout';
import { colors } from '@/lib/theme';
import type { SurveyField } from '@/modules/api/types';

type AnswerMap = Record<string, unknown>;

type SurveyFieldControlProps = {
  field: SurveyField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
};

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatTime(value: Date): string {
  return value.toTimeString().slice(0, 5);
}

function optionStyle(selected: boolean) {
  return [layout.option, selected && layout.optionSelected];
}

export function SurveyFieldControl({
  field,
  value,
  onChange,
  readOnly = false,
}: SurveyFieldControlProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  if (field.type === 'SECTION_BREAK') {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{field.label}</Text>
        {field.helpText ? <Muted style={layout.mtSm}>{field.helpText}</Muted> : null}
      </View>
    );
  }

  const disabled = readOnly || field.config?.readOnly;

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
            onPress={() => setShowDatePicker(true)}
            style={styles.pickerTrigger}
          >
            <Text>{value ? String(value) : 'Select date'}</Text>
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={value ? new Date(String(value)) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === 'ios');
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
            onPress={() => setShowTimePicker(true)}
            style={styles.pickerTrigger}
          >
            <Text>{value ? String(value) : 'Select time'}</Text>
          </Pressable>
          {showTimePicker ? (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (date) onChange(formatTime(date));
              }}
            />
          ) : null}
        </>
      )}

      {(field.type === 'FILE' || field.type === 'IMAGE') && (
        <Muted>
          File uploads require connectivity. Enter a reference URL or name for offline capture.
        </Muted>
      )}
      {(field.type === 'FILE' || field.type === 'IMAGE') && (
        <Input
          value={
            typeof value === 'object' && value
              ? String((value as { name?: string }).name ?? '')
              : String(value ?? '')
          }
          onChangeText={(text) => onChange({ name: text, url: text })}
          editable={!disabled}
          placeholder="Reference name or URL"
        />
      )}
    </View>
  );
}

export function SurveyFormRenderer({
  fields,
  answers,
  onChange,
  readOnly = false,
}: {
  fields: SurveyField[];
  answers: AnswerMap;
  onChange: (fieldId: string, value: unknown) => void;
  readOnly?: boolean;
}) {
  const sorted = [...fields].sort((a, b) => a.order - b.order);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {sorted.map((field) => (
        <SurveyFieldControl
          key={field.id}
          field={field}
          value={answers[field.id]}
          onChange={(value) => onChange(field.id, value)}
          readOnly={readOnly}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  sectionTitle: {
    fontWeight: '600',
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
});
