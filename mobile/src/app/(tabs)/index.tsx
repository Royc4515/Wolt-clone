import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { isDark } = useContext(ThemeContext);
  const currentColors = isDark ? Colors.dark : Colors.light;

  return (
    // General background color.
    <ScrollView style={[styles.container, { backgroundColor: currentColors.background }]}>
      
      {/* Page header*/}
      <Text style={[styles.headerTitle, { color: currentColors.text }]}>
        Restaurants near you
      </Text>

      {/* Restaurant card */}
      <View style={[
        styles.restoCard, 
        { 
          backgroundColor: currentColors.surface,
          borderColor: currentColors.border 
        }
      ]}>
        {/* Image placeholder */}
        <View style={styles.imagePlaceholder}>
          <Ionicons name="fast-food-outline" size={48} color={currentColors.textMuted} />
        </View>
        
        {/* Restaurant's details */}
        <View style={styles.cardInfo}>
          <Text style={[styles.restoName, { color: currentColors.text }]}>Tony Vespa Pizza</Text>
          <Text style={[styles.restoMeta, { color: currentColors.textMuted }]}>
            Italian • ₪₪ • 20-30 min
          </Text>
          
          {/* Discount tag */}
          <View style={[styles.badge, { backgroundColor: currentColors.accent + '20' }]}>
            <Text style={[styles.badgeText, { color: currentColors.accent }]}>
              Delivery: ₪0.00
            </Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: Spacing[4], 
  },
  headerTitle: {
    fontSize: Typography.h2,
    fontWeight: '900',
    marginBottom: Spacing[4],
    letterSpacing: -0.5,
  },
  restoCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing[5],
  },
  imagePlaceholder: {
    height: 160,
    backgroundColor: '#00000010',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: Spacing[4],
  },
  restoName: {
    fontSize: Typography.h3,
    fontWeight: 'bold',
    marginBottom: Spacing[1],
  },
  restoMeta: {
    fontSize: Typography.sm,
    marginBottom: Spacing[3],
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
  }
});