import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar, Alert,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { fetchDispatchOrders } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import ViolationCard from '../components/ViolationCard';

export default function DispatchScreen({ navigation }) {
  const { user, logout }      = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView]       = useState('list'); // 'list' | 'map'

  // CDO city center as default map region
  const [region, setRegion] = useState({
    latitude:      8.4822,
    longitude:     124.6472,
    latitudeDelta:  0.08,
    longitudeDelta: 0.08,
  });

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await fetchDispatchOrders();
      setOrders(data.dispatch_orders || []);
      if (data.dispatch_orders?.length > 0) {
        // Centre map on first violation
        const first = data.dispatch_orders[0];
        setRegion(r => ({ ...r, latitude: first.lat, longitude: first.lng }));
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [{ text: 'OK', onPress: logout }]);
      } else {
        Alert.alert('Error', 'Could not fetch dispatch orders. Check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

  // Reload every time screen comes into focus
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleLogout = () => {
    Alert.alert('Logout', 'End your shift session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout',  style: 'destructive', onPress: logout },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topTitle}>Dispatch Orders</Text>
          <Text style={styles.topSub}>
            {user?.full_name} · {user?.badge || user?.username}
          </Text>
        </View>
        <View style={styles.topRight}>
          {orders.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{orders.length}</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* VIEW TOGGLE */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
          onPress={() => setView('list')}
        >
          <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>
            📋 List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
          onPress={() => setView('map')}
        >
          <Text style={[styles.toggleText, view === 'map' && styles.toggleTextActive]}>
            🗺 Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* LOADING */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching dispatch orders...</Text>
        </View>
      )}

      {/* EMPTY STATE */}
      {!loading && orders.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All Clear</Text>
          <Text style={styles.emptySub}>No active violations at this time.</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => load(true)}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LIST VIEW */}
      {!loading && view === 'list' && orders.length > 0 && (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.puv_id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#2563eb" />
          }
          renderItem={({ item }) => (
            <ViolationCard
              order={item}
              onPress={() => navigation.navigate('Action', { order: item })}
            />
          )}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {orders.length} active violation{orders.length !== 1 ? 's' : ''} — Bugo–Igpit Corridor
            </Text>
          }
        />
      )}

      {/* MAP VIEW */}
      {!loading && view === 'map' && (
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {orders.map(item => {
            const isCritical = item.violations.some(v => v.severity === 'critical');
            return (
              <Marker
                key={item.puv_id}
                coordinate={{ latitude: item.lat, longitude: item.lng }}
                pinColor={isCritical ? '#ef4444' : '#f59e0b'}
              >
                <Callout onPress={() => { setView('list'); navigation.navigate('Action', { order: item }); }}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutPlate}>{item.plate}</Text>
                    <Text style={styles.calloutDetail}>{item.company}</Text>
                    <Text style={styles.calloutDetail}>{item.loc_name}</Text>
                    {item.violations.map((v, i) => (
                      <Text key={i} style={[styles.calloutViolation, isCritical && { color: '#ef4444' }]}>
                        ⚠ {v.label}
                      </Text>
                    ))}
                    <Text style={styles.calloutAction}>Tap to Respond →</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },

  // TOP BAR
  topBar:    { backgroundColor: '#0f172a', paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  topTitle:  { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  topSub:    { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 3 },
  topRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBadge:{ backgroundColor: '#ef4444', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 },
  countText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  logoutBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutIcon:{ fontSize: 16, color: '#ef4444' },

  // TOGGLE
  toggleRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  toggleBtnActive: { borderBottomWidth: 3, borderBottomColor: '#2563eb' },
  toggleText:      { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  toggleTextActive:{ color: '#2563eb', fontWeight: '800' },

  // STATES
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  emptyIcon:   { fontSize: 52, marginBottom: 12 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptySub:    { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  refreshBtn:  { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  refreshBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // LIST
  list:       { padding: 16 },
  listHeader: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  // MAP
  map: { flex: 1 },
  callout:         { width: 200, padding: 4 },
  calloutPlate:    { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  calloutDetail:   { fontSize: 12, color: '#64748b', fontWeight: '500' },
  calloutViolation:{ fontSize: 12, fontWeight: '700', color: '#f59e0b', marginTop: 4 },
  calloutAction:   { fontSize: 12, fontWeight: '800', color: '#2563eb', marginTop: 6 },
});
