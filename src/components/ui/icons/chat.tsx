import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Chat({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M12 2C6.486 2 2 5.589 2 10c0 2.908 1.898 5.516 5 6.934V22l5.34-4.005C17.697 17.852 22 14.32 22 10c0-4.411-4.486-8-10-8Zm0 14c-.339 0-.672-.02-1-.054l-2.47 1.852.011-2.563C5.746 14.283 4 12.238 4 10c0-3.309 3.589-6 8-6s8 2.691 8 6-3.589 6-8 6Z"
        fill={color}
      />
    </Svg>
  );
}
