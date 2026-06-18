'use client';

/**
 * ObjectiveInput — shared component for learning objective text input
 * with live SMART validation feedback.
 *
 * Shows a colored validation indicator dot and expandable detail panel
 * with SMART score badges and specific issues/suggestions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  validateObjective,
  type ObjectiveValidation,
} from '@/lib/agents/objective-validator';

interface ObjectiveInputProps {
  value: string;
  onChange: (value: string) => void;
  index: number;
  onRemove?: () => void;
  showRemove?: boolean;
  disabled?: boolean;
}

const SMART_LABELS = [
  { key: 'specific' as const, letter: 'S', tooltip: 'Specific' },
  { key: 'measurable' as const, letter: 'M', tooltip: 'Measurable' },
  { key: 'actionOriented' as const, letter: 'A', tooltip: 'Action-oriented' },
  { key: 'reasonable' as const, letter: 'R', tooltip: 'Reasonable' },
  { key: 'timeBound' as const, letter: 'T', tooltip: 'Time-bound' },
];

export default function ObjectiveInput({
  value,
  onChange,
  index,
  onRemove,
  showRemove = true,
  disabled = false,
}: ObjectiveInputProps) {
  const [validation, setValidation] = useState<ObjectiveValidation | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced validation
  const runValidation = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text.trim().length >= 3) {
        setValidation(validateObjective(text));
      } else {
        setValidation(null);
      }
    }, 300);
  }, []);

  useEffect(() => {
    runValidation(value);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, runValidation]);

  // Dot color
  const dotColor = useMemo(() => {
    if (!validation || value.trim().length < 10) return '#6b7187';
    if (!validation.isValid) return '#ef4444';
    if (validation.issues.length > 0) return '#f59e0b';
    return '#22c55e';
  }, [validation, value]);

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Input row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Index label */}
        <span
          style={{
            fontSize: 11,
            color: 'var(--fg-3)',
            minWidth: 18,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {index + 1}.
        </span>

        {/* Text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g., Given a reference manual, the trainee will be able to identify..."
          style={{
            flex: 1,
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border)',
            color: 'var(--fg-1)',
            padding: '8px 12px',
            borderRadius: 'var(--r-sm)',
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        />

        {/* Validation dot */}
        <button
          type="button"
          onClick={() => {
            if (validation) setShowDetail((prev) => !prev);
          }}
          disabled={!validation}
          title={
            !validation
              ? 'Type an objective to validate'
              : validation.isValid && validation.issues.length === 0
                ? 'All SMART checks pass'
                : validation.isValid
                  ? `${validation.issues.length} suggestion(s)`
                  : `${validation.issues.filter((i) => i.severity === 'error').length} issue(s)`
          }
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: 'none',
            background: dotColor,
            cursor: validation ? 'pointer' : 'default',
            flexShrink: 0,
            transition: 'background 0.2s, transform 0.15s',
            transform: showDetail ? 'scale(1.2)' : 'scale(1)',
            padding: 0,
          }}
          aria-label="Toggle objective validation details"
        />

        {/* Remove button */}
        {showRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fg-3)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--fg-3)';
            }}
            aria-label={`Remove objective ${index + 1}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Expandable detail panel */}
      {showDetail && validation && (
        <div
          style={{
            marginTop: 6,
            marginLeft: 26,
            padding: '10px 12px',
            background: 'var(--bg-raised)',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {/* SMART score badges */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginBottom: 8,
            }}
          >
            {SMART_LABELS.map(({ key, letter, tooltip }) => (
              <span
                key={key}
                title={tooltip}
                style={{
                  width: 22,
                  height: 22,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: validation.smartScore[key]
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(107, 113, 135, 0.12)',
                  color: validation.smartScore[key] ? '#22c55e' : '#6b7187',
                  border: `1px solid ${
                    validation.smartScore[key]
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'rgba(107, 113, 135, 0.2)'
                  }`,
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Issues */}
          {validation.issues.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              {validation.issues.map((issue, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginBottom: 4,
                    color:
                      issue.severity === 'error' ? '#ef4444' : '#f59e0b',
                  }}
                >
                  <span style={{ fontSize: 10, marginTop: 2 }}>
                    {issue.severity === 'error' ? '✕' : '△'}
                  </span>
                  <div>
                    <span style={{ color: 'var(--fg-2)' }}>
                      {issue.message}
                    </span>
                    {issue.suggestion && (
                      <div
                        style={{
                          color: 'var(--fg-3)',
                          fontSize: 11,
                          marginTop: 1,
                        }}
                      >
                        → {issue.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detected components */}
          {Object.entries(validation.detectedComponents).some(
            ([, v]) => v,
          ) && (
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: 6,
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: 'var(--fg-3)',
                  letterSpacing: '0.05em',
                }}
              >
                Detected
              </span>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  marginTop: 4,
                }}
              >
                {validation.detectedComponents.audience && (
                  <Tag label="Audience" value={validation.detectedComponents.audience} />
                )}
                {validation.detectedComponents.actionVerb && (
                  <Tag label="Verb" value={validation.detectedComponents.actionVerb} />
                )}
                {validation.detectedComponents.conditions && (
                  <Tag label="Conditions" value={validation.detectedComponents.conditions} />
                )}
                {validation.detectedComponents.standard && (
                  <Tag label="Standard" value={validation.detectedComponents.standard} />
                )}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions.length > 0 && (
            <div
              style={{
                marginTop: 6,
                color: 'var(--fg-3)',
                fontSize: 11,
                fontStyle: 'italic',
              }}
            >
              {validation.suggestions[0]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Small styled tag for detected components */
function Tag({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 11,
        background: 'rgba(45, 212, 191, 0.08)',
        border: '1px solid rgba(45, 212, 191, 0.15)',
        color: 'var(--fg-2)',
      }}
    >
      <span style={{ color: '#2dd4bf', fontWeight: 500 }}>{label}:</span>
      <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </span>
  );
}
