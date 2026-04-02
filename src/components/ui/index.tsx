/* eslint-disable react-refresh/only-export-components */
import Svg from 'react-native-svg';
import { withUniwind } from 'uniwind';

// Local components (not in @mongrov/ui yet)
export * from './checkbox';

export { default as colors } from './colors';

export * from './focus-aware-status-bar';
export * from './image';
export * from './input';
export * from './list';
export * from './modal';
export * from './progress-bar';
export * from './select';
export * from './utils';
// Re-export primitives from @mongrov/ui
export {
  // Button
  Button,
  buttonTextVariants,
  buttonVariants,
  // Card
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  // Utils
  cn,
  // Separator
  Separator,
  // Skeleton
  Skeleton,
  // Text
  Text,
  TextClassContext,
  textVariants,
} from '@mongrov/ui';
export type { ButtonProps, TextProps, TextVariant } from '@mongrov/ui';

// export base components from react-native
export {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
export { SafeAreaView } from 'react-native-safe-area-context';

// Apply withUniwind to Svg to add className support
export const StyledSvg = withUniwind(Svg);
