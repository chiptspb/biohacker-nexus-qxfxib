
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import { format, parseISO } from 'date-fns';

interface MarkedDate {
  dots: { key: string; color: string }[];
  marked: boolean;
}

interface ProductColor {
  productId: string;
  productName: string;
  color: string;
}

const PRODUCT_COLORS = [
  colors.primary,
  colors.alert,
  colors.success,
  colors.highlight,
  '#9C27B0', // Purple
  '#FF5722', // Deep Orange
  '#00BCD4', // Cyan
  '#8BC34A', // Light Green
];

export default function CalendarScreen() {
  const { products, scheduledDoses } = useApp();
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7));

  // Assign colors to products
  const productColors = useMemo((): ProductColor[] => {
    return products.map((product, index) => ({
      productId: product.id,
      productName: product.name,
      color: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
    }));
  }, [products]);

  // Get color for a product
  const getProductColor = (productId: string): string => {
    const productColor = productColors.find(pc => pc.productId === productId);
    return productColor?.color || colors.primary;
  };

  // Prepare marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: { [key: string]: MarkedDate } = {};

    console.log('Preparing calendar marks for', scheduledDoses.length, 'scheduled doses');

    scheduledDoses.forEach(dose => {
      if (!dose.completed) {
        const dateKey = dose.scheduledDate;
        const color = getProductColor(dose.productId);

        if (!marked[dateKey]) {
          marked[dateKey] = {
            dots: [],
            marked: true,
          };
        }

        // Check if this product already has a dot for this date
        const existingDot = marked[dateKey].dots.find(dot => dot.key === dose.productId);
        if (!existingDot) {
          marked[dateKey].dots.push({
            key: dose.productId,
            color,
          });
        }
      }
    });

    console.log('Marked dates count:', Object.keys(marked).length);

    // Add selection styling if a date is selected
    if (selectedDate && marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.card,
      } as any;
    } else if (selectedDate) {
      marked[selectedDate] = {
        dots: [],
        marked: false,
        selected: true,
        selectedColor: colors.card,
      } as any;
    }

    return marked;
  }, [scheduledDoses, productColors, selectedDate]);

  // Get doses for selected date
  const dosesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    const doses = scheduledDoses
      .filter(dose => dose.scheduledDate === selectedDate && !dose.completed)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    console.log(`Doses for ${selectedDate}:`, doses.length);
    
    return doses;
  }, [selectedDate, scheduledDoses]);

  const handleDayPress = (day: DateData) => {
    console.log('Day pressed:', day.dateString);
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString.substring(0, 7));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dose Calendar',
          headerShown: true,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView style={commonStyles.content}>
          {/* Calendar */}
          <View style={styles.calendarContainer}>
            <Calendar
              current={currentMonth}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              markingType="multi-dot"
              markedDates={markedDates}
              theme={{
                backgroundColor: colors.background,
                calendarBackground: colors.card,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.text,
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary,
                dotColor: colors.primary,
                selectedDotColor: colors.text,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                indicatorColor: colors.primary,
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Medications</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendScroll}>
              {productColors.map(pc => (
                <View key={pc.productId} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: pc.color }]} />
                  <Text style={styles.legendText}>{pc.productName}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Selected Date Doses */}
          {selectedDate && (
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateTitle}>
                {format(parseISO(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
              </Text>

              {dosesForSelectedDate.length === 0 ? (
                <View style={styles.emptyCard}>
                  <IconSymbol name="calendar" size={32} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No doses scheduled for this date</Text>
                </View>
              ) : (
                dosesForSelectedDate.map((dose, index) => (
                  <View key={`${dose.id}-${index}`} style={commonStyles.card}>
                    <View style={commonStyles.cardHeader}>
                      <View 
                        style={[
                          styles.productIndicator, 
                          { backgroundColor: getProductColor(dose.productId) }
                        ]} 
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={commonStyles.cardTitle}>{dose.productName}</Text>
                        <Text style={commonStyles.cardSubtitle}>
                          {dose.doseMg}mg • {dose.route} • {dose.scheduledTime}
                        </Text>
                      </View>
                      <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Instructions */}
          {!selectedDate && (
            <View style={styles.instructionsContainer}>
              <IconSymbol name="hand.tap" size={32} color={colors.textSecondary} />
              <Text style={styles.instructionsText}>
                Tap a date to view scheduled doses
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  legendContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  legendScroll: {
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  selectedDateContainer: {
    marginBottom: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  productIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  instructionsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  instructionsText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});
