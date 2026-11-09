import React, { useCallback } from 'react';
import { FlatList, ListRenderItem, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { colors, layout } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';
import { Offer, OFFERS, WELCOME_COPY } from '../welcomeContent';
import { OfferCard } from './OfferCard';

const ItemGap: React.FC<{ width: number }> = ({ width }) => <View style={{ width }} />;

/** Header row + snapping horizontal carousel that bleeds to the screen edges. */
export const OfferCarousel: React.FC = () => {
  const { s, font, contentWidth } = useResponsive();
  const gap = s(14);
  const cardWidth = Math.round(Math.min(s(260), (contentWidth - layout.margin * 2) * 0.72));
  const interval = cardWidth + gap;
  const separator = useCallback(() => <ItemGap width={gap} />, [gap]);

  const renderItem: ListRenderItem<Offer> = useCallback(({ item }) => <OfferCard offer={item} width={cardWidth} />, [cardWidth]);
  const getItemLayout = useCallback((_: unknown, index: number) => ({ length: interval, offset: interval * index, index }), [interval]);

  return (
    <View testID="welcome-offers">
      <View style={styles.header}>
        <AppText variant="labelMd" color={colors.goldDeep} style={{ fontSize: font(12), letterSpacing: font(1), flexShrink: 1 }} accessibilityRole="header">
          {WELCOME_COPY.offersHeading}
        </AppText>
        <AppText variant="labelMd" color={colors.tertiary} style={{ fontSize: font(12), marginLeft: s(8) }}>
          {WELCOME_COPY.offersHint}
        </AppText>
      </View>
      <FlatList
        horizontal
        data={OFFERS as Offer[]}
        keyExtractor={o => o.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        snapToInterval={interval}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={separator}
        contentContainerStyle={{ paddingHorizontal: layout.margin, paddingTop: s(12), paddingBottom: s(20) }}
        style={{ marginHorizontal: -layout.margin }}
        initialNumToRender={2}
        removeClippedSubviews={false}
        accessibilityLabel="First-time guest offers"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
