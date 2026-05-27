import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { submitInterception } from '../api/apiService';
import StatusBadge from '../components/StatusBadge';

const ACTIONS = [
  { key: 'warning',  label: 'Issue Warning',    icon: '⚠',  desc: 'Verbal or written warning, no fine' },
  { key: 'ticket',   label: 'Issue Ticket',     icon: '📋', desc: 'Formal citation — ₱5,000.00 fine' },
  { key: 'apprehend',label: 'Apprehend Vehicle',icon: '🚔', desc: 'Full apprehension — ₱10,000.00 fine' },
];

export default function ActionScreen({ route, navigation }) {
  const { order }           = route.params;
  const [action, setAction] = useState('');
  const [notes, setNotes]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isCritical = order.violations.some(v => v.severity === 'critical');

  const handleSubmit = async () => {
    if (!action) {
      Alert.alert('Required', 'Please select an enforcement action before submitting.');
      return;
    }
    Alert.alert(
      'Confirm Submission',
      `Submit interception report for ${order.plate}?\nAction: ${ACTIONS.find(a => a.key === action)?.label}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const result = await submitInterception(order.plate, action, notes);
              Alert.alert(
                '✅ Report Submitted',
                `${result.message}\n\nSerial: ${result.serial}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (err) {
              const msg = err?.response?.data?.error || err.message || 'Submission failed.';
              Alert.alert('Error', msg);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{order.plate}</Text>
          <Text style={styles.headerSub}>{order.company}</Text>
        </View>
        <View style={styles.badgeStack}>
          {order.violations.map((v, i) => <StatusBadge key={i} type={v.type} />)}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* MAP */}
        <View style={styles.mapCard}>
          <Text style={styles.sectionLabel}>📍 Live GNSS Location</Text>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude:      order.lat,
              longitude:     order.lng,
              latitudeDelta:  0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{ latitude: order.lat, longitude: order.lng }}
              pinColor={isCritical ? '#ef4444' : '#f59e0b'}
              title={order.plate}
              description={order.loc_name}
            />
          </MapView>
          <Text style={styles.locationText}>📌 {order.loc_name}</Text>
        </View>

        {/* VIOLATION SUMMARY */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>🚌 Vehicle Info</Text>
          <View style={styles.infoGrid}>
            {[
              ['Plate',    order.plate],
              ['Driver',   order.driver],
              ['Passengers', `${order.passengers}/${order.capacity}`],
              ['Cabin Temp', `${order.temp}°C`],
              ['Speed',    order.speed],
              ['Schedule', order.schedule],
            ].map(([label, value]) => (
              <View key={label} style={styles.infoItem}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={[
                  styles.infoValue,
                  label === 'Passengers' && order.passengers > order.capacity && { color: '#ef4444' },
                  label === 'Cabin Temp' && order.temp >= 37.5 && { color: '#f59e0b' },
                ]}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>⚠ Active Violations</Text>
          {order.violations.map((v, i) => (
            <View key={i} style={[styles.violationRow, { borderLeftColor: v.severity === 'critical' ? '#ef4444' : '#f59e0b' }]}>
              <StatusBadge type={v.type} />
              <Text style={styles.violationDetail}>{v.detail}</Text>
            </View>
          ))}
        </View>

        {/* ENFORCEMENT ACTION */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>⚖ Enforcement Action</Text>
          <Text style={styles.sectionHint}>Select the action to be taken against this vehicle.</Text>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.key}
              style={[styles.actionOption, action === a.key && styles.actionOptionSelected]}
              onPress={() => setAction(a.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionLabel, action === a.key && styles.actionLabelSelected]}>
                  {a.label}
                </Text>
                <Text style={styles.actionDesc}>{a.desc}</Text>
              </View>
              <View style={[styles.radio, action === a.key && styles.radioSelected]}>
                {action === a.key && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* OFFICER REMARKS */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>📝 Officer Remarks</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Describe the interception — exact location, officer notes, passenger count at time of intercept, driver response, etc."
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[styles.submitBtn, (!action || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!action || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={styles.submitIcon}>📤 </Text>
                <Text style={styles.submitText}>Submit Interception Report</Text>
              </>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { padding: 16 },

  // HEADER
  header:     { backgroundColor: '#0f172a', paddingTop: 52, paddingBottom: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  backIcon:   { fontSize: 20, color: '#f1f5f9' },
  headerText: { flex: 1 },
  headerTitle:{ fontSize: 20, fontWeight: '800', color: '#f1f5f9' },
  headerSub:  { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  badgeStack: { gap: 4 },

  // CARD
  card:         { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, color: '#475569', marginBottom: 12 },
  sectionHint:  { fontSize: 12, color: '#94a3b8', marginBottom: 12, marginTop: -6 },
  divider:      { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },

  // MAP
  mapCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  map:     { height: 180 },
  locationText: { padding: 12, fontSize: 13, fontWeight: '600', color: '#475569' },

  // INFO GRID
  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoItem:  { width: '47%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 11, borderWidth: 1, borderColor: '#e2e8f0' },
  infoLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#94a3b8', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '800', color: '#0f172a' },

  // VIOLATIONS
  violationRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fafafa', borderRadius: 10, padding: 10, marginBottom: 8, borderLeftWidth: 3 },
  violationDetail:{ flex: 1, fontSize: 12, color: '#475569', fontWeight: '600', lineHeight: 17 },

  // ACTION OPTIONS
  actionOption:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 10, backgroundColor: '#fafafa' },
  actionOptionSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  actionIcon:           { fontSize: 22 },
  actionLabel:          { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  actionLabelSelected:  { color: '#2563eb' },
  actionDesc:           { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  radio:                { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  radioSelected:        { borderColor: '#2563eb' },
  radioDot:             { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563eb' },

  // NOTES
  notesInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc', minHeight: 110, fontWeight: '500' },

  // SUBMIT
  submitBtn:         { backgroundColor: '#0f172a', borderRadius: 16, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 6, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  submitBtnDisabled: { opacity: 0.45 },
  submitIcon:        { fontSize: 18 },
  submitText:        { color: '#fff', fontSize: 16, fontWeight: '800' },
});
