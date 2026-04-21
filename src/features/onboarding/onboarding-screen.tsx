import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  type ViewToken,
} from 'react-native';

import {
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { useIsFirstTime } from '@/lib/hooks';
import { getThemeForScheme, useColorScheme } from '@/lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function createStyles(
  theme: ReturnType<typeof getThemeForScheme>,
  isDark: boolean,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      width: '100%',
      paddingHorizontal: 20,
      paddingTop: 12,
      alignItems: 'flex-end',
    },
    skipButton: {
      paddingHorizontal: 12,
    },
    skipText: {
      fontSize: 16,
      fontFamily: theme.fonts.bodyMedium,
      color: isDark ? '#FFFFFF' : theme.colors.textPrimary,
    },
    illustrationImage: {
      width: '100%',
      height: SCREEN_HEIGHT * 0.5,
    },
    panelItem: {
      width: SCREEN_WIDTH,
      flex: 1,
      justifyContent: 'flex-start',
      paddingBottom: 150,
    },
    illustrationWrapper: {
      width: SCREEN_WIDTH,
      alignSelf: 'stretch',
      marginBottom: 90,
      flexShrink: 0,
    },
    textContainer: {
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      width: '100%',
      flexShrink: 0,
      paddingHorizontal: 20,
    },
    title: {
      marginBottom: 8,
      fontSize: 24,
      fontFamily: theme.fonts.displayBold,
      color: isDark ? '#FFFFFF' : theme.colors.textPrimary,
      letterSpacing: -0.2,
      lineHeight: 30,
    },
    description: {
      fontSize: 16,
      fontFamily: theme.fonts.body,
      color: isDark ? '#FFFFFF' : theme.colors.textSecondary,
      opacity: isDark ? 0.9 : 1,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      marginBottom: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingBottom: 8,
    },
    paginationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    paginationDot: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : theme.colors.borderStrong,
      marginHorizontal: 2,
    },
    paginationDotActive: {
      width: 24,
      backgroundColor: theme.colors.primary600,
    },
    paginationDotInactive: {
      width: 24,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : theme.colors.borderStrong,
    },
    button: {
      backgroundColor: theme.colors.primary500,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 32,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
    },
    buttonText: {
      color: isDark ? '#FFFFFF' : theme.colors.textInverse,
      fontSize: 16,
      fontFamily: theme.fonts.bodyBold,
      letterSpacing: 0.2,
    },
  });
}

type OnboardingPanel = {
  id: string;
  title: string;
  description: string;
  imageSource: number;
};

const onboardingPanels: OnboardingPanel[] = [
  {
    id: '1',
    title: 'Streamlined Task Control',
    description: 'Manage and track all tasks efficiently.',
    imageSource: require('../../../assets/screen1.png'),
  },
  {
    id: '2',
    title: 'Live Progress Visibility',
    description: 'Access real-time updates and status tracking.',
    imageSource: require('../../../assets/screen2.png'),
  },
  {
    id: '3',
    title: 'All-in-One Task View',
    description: 'View maps, contacts, and work notes in one place.',
    imageSource: require('../../../assets/screen3.png'),
  },
];

type OnboardingPanelItemProps = {
  item: OnboardingPanel;
  styles: ReturnType<typeof createStyles>;
};

function OnboardingPanelItem({ item, styles: itemStyles }: OnboardingPanelItemProps) {
  return (
    <View style={itemStyles.panelItem}>
      <View style={itemStyles.illustrationWrapper}>
        <Image
          source={item.imageSource}
          style={itemStyles.illustrationImage}
          contentFit="fill"
        />
      </View>
      <View style={itemStyles.textContainer}>
        <Text style={itemStyles.title}>{item.title}</Text>
        <Text style={itemStyles.description}>{item.description}</Text>
      </View>
    </View>
  );
}

export function OnboardingScreen() {
  const [_, setIsFirstTime] = useIsFirstTime();
  const router = useRouter();
  const { isDark } = useColorScheme();
  const styles = React.useMemo(
    () => createStyles(getThemeForScheme(isDark), isDark),
    [isDark],
  );

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const flatListRef = React.useRef<FlatList<OnboardingPanel>>(null);

  function finishOnboarding() {
    setIsFirstTime(false);
    router.replace('/login');
  }

  function handleSkip() {
    finishOnboarding();
  }

  function getGradientColors() {
    if (isDark) {
      return ['#1C303E', '#0F1A23', '#000000'] as const;
    }
    return ['#A1D1F8', '#FFFFFF', '#FFFFFF'] as const;
  }

  const onViewableItemsChanged = React.useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  function handleNext() {
    if (currentIndex < onboardingPanels.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
    else {
      finishOnboarding();
    }
  }

  const gradientColors = getGradientColors();
  const gradientLocations = isDark ? ([0, 0.5, 1] as const) : ([0, 0.5, 0.5] as const);

  return (
    <LinearGradient
      colors={[...gradientColors]}
      locations={[...gradientLocations]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <FocusAwareStatusBar />
      <View style={styles.safeArea}>
        <SafeAreaView style={styles.header}>
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </SafeAreaView>
        <FlatList
          ref={flatListRef}
          data={onboardingPanels}
          renderItem={({ item }) => (
            <OnboardingPanelItem item={item} styles={styles} />
          )}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={{ paddingHorizontal: 0 }}
        />

        <View style={styles.bottomContainer}>
          <View style={styles.paginationContainer}>
            {onboardingPanels.map((panel, index) => (
              <View
                key={panel.id}
                style={[
                  styles.paginationDot,
                  index === currentIndex
                    ? styles.paginationDotActive
                    : styles.paginationDotInactive,
                ]}
              />
            ))}
          </View>
          <Pressable style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {currentIndex === onboardingPanels.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}
