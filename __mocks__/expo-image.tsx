/**
 * Mock for expo-image
 */
import React from 'react';
import { View } from 'react-native';

export const Image = ({ testID, ...props }: any) => (
  <View testID={testID} {...props} />
);

export default { Image };
