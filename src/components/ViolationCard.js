import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StatusBadge from './StatusBadge';

/**
 * ViolationCard — displays a single dispatch order in the list.
 * @param {object}   order         - Dispatch order object from /api/mobile/dispatch
 * @param {function} onPress       - Called when the card is tapped
 */
export default function ViolationCard({ order, onPress }) {
  const isCritical = order.violations.some(v => v.severity === 'critical');

  return (
    <TouchableOpacity
      style={[styles.card, isCritical && styles.cardCritical]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.plateWrap}>
          <Text style={styles.plate}>{order.plate}</Text>
          <Text style={styles.company} numberOfLines={1}>{order.company}</Text>
        </View>
        <View style={styles.badgeCol}>
          {order.violations.map((v, i) => (
            <StatusBadge key={i} type={v.type} style={{ marginBottom: 4 }} />
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Violation details */}
      {order.violations.map((v, i) => (
        <Text key={i} style={styles.violationDetail}>• {v.detail}</Text>
      ))}

      {/* Footer meta */}
      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText} numberOfLines={1}>{order.loc_name}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>👤</Text>
          <Text style={styles.metaText} numberOfLines={1}>{order.driver}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>🕒</Text>
          <Text style={styles.metaText}>{order.last_update}</Text>
        </View>
      </View>

      <View style={styles.respondRow}>
        <Text style={styles.respondBtn}>Respond & Intercept →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardCritical: {
    borderColor: '#fecaca',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  plateWrap: { flex: 1, marginRight: 10 },
  plate:     { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.4 },
  company:   { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  badgeCol:  { alignItems: 'flex-end', gap: 4 },
  divider:   { height: 1, backgroundColor: '#f1f5f9', marginBottom: 10 },
  violationDetail: { fontSize: 12, color: '#475569', fontWeight: '600', marginBottom: 4, lineHeight: 18 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { fontSize: 12 },
  metaText: { fontSize: 12, color: '#64748b', fontWeight: '600', maxWidth: 120 },
  respondRow: { marginTop: 14, alignItems: 'flex-end' },
  respondBtn: { fontSize: 13, fontWeight: '800', color: '#2563eb' },
});