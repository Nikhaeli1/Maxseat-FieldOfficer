import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CONFIGS = {
  critical: { bg: '#fef2f2', text: '#ef4444', border: '#fecaca' },
  warning:  { bg: '#fffbeb', text: '#f59e0b', border: '#fde68a' },
  success:  { bg: '#f0fdf4', text: '#10b981', border: '#bbf7d0' },
  info:     { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  gray:     { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

const LABELS = {
  OVERLOAD: { variant: 'critical', icon: '⚠',  text: 'OVERLOAD'   },
  THERMAL:  { variant: 'warning',  icon: '🌡',  text: 'THERMAL'    },
  ticket:   { variant: 'critical', icon: '📋',  text: 'TICKET'     },
  warning:  { variant: 'warning',  icon: '⚠',  text: 'WARNING'    },
  apprehend:{ variant: 'info',     icon: '🚔',  text: 'APPREHEND'  },
  PENDING:  { variant: 'warning',  icon: '⏳',  text: 'PENDING'    },
  RESOLVED: { variant: 'success',  icon: '✓',   text: 'RESOLVED'   },
};

/**
 * StatusBadge — renders a colored label pill.
 * @param {string} type       - Key from LABELS map, or a custom label
 * @param {string} [variant]  - Override: 'critical' | 'warning' | 'success' | 'info' | 'gray'
 * @param {string} [label]    - Override display text
 */
export default function StatusBadge({ type, variant, label }) {
  const cfg    = LABELS[type] || { variant: variant || 'gray', icon: '', text: type };
  const colors = CONFIGS[variant || cfg.variant] || CONFIGS.gray;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {cfg.icon ? <Text style={[styles.icon, { color: colors.text }]}>{cfg.icon} </Text> : null}
      <Text style={[styles.text, { color: colors.text }]}>{label || cfg.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'flex-start',
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:   20,
    borderWidth:    1,
  },
  icon:  { fontSize: 11 },
  text:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
});