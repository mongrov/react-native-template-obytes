import { defaultDarkTokens, defaultLightTokens } from '@mongrov/theme';
import { appTheme } from '../index';

describe('appTheme', () => {
  it('has light and dark token sets', () => {
    expect(appTheme.light).toBeDefined();
    expect(appTheme.dark).toBeDefined();
  });

  it('overrides light primary color to brand orange', () => {
    expect(appTheme.light.colors.primary).toBe('#FF6C00');
    expect(appTheme.light.colors.primaryForeground).toBe('#FFFFFF');
  });

  it('overrides dark primary color to lighter orange', () => {
    expect(appTheme.dark.colors.primary).toBe('#FFA766');
    expect(appTheme.dark.colors.primaryForeground).toBe('#1E1E1E');
  });

  it('preserves default tokens for non-overridden values', () => {
    expect(appTheme.light.colors.background).toBe(
      defaultLightTokens.colors.background,
    );
    expect(appTheme.dark.colors.background).toBe(
      defaultDarkTokens.colors.background,
    );
    expect(appTheme.light.spacing).toEqual(defaultLightTokens.spacing);
    expect(appTheme.dark.typography).toEqual(defaultDarkTokens.typography);
    expect(appTheme.light.radii).toEqual(defaultLightTokens.radii);
  });
});
