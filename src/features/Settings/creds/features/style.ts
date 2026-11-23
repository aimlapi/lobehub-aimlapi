import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';

import { densityTokens } from '@/styles/density.stylex';

export const styles = stylex.create({
  // The whole row opens the detail modal. The hover fill bleeds 8px past the
  // card padding so the text column stays aligned with the header above.
  container: {
    cursor: 'pointer',
    marginInline: '-8px',
    paddingBlock: densityTokens['--lobe-density-content-gap'],
    paddingInline: '8px',
    borderRadius: cssVar.borderRadiusLG,
    outline: { 'default': 'none', ':focus-visible': `2px solid ${cssVar.colorPrimaryBorder}` },
    transition: 'background-color 0.2s',
    backgroundColor: { 'default': null, ':hover': cssVar.colorFillQuaternary },
    backgroundImage: { 'default': null, ':hover': 'none' },
  },
  // Compact density: 6px block padding, 36px tile, 14px title → ~55px two-line rows.
  containerCompact: {
    paddingBlock: '6px',
  },
  description: {
    overflow: 'hidden',
    fontSize: '12px',
    color: cssVar.colorTextTertiary,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  descriptionCompact: { lineHeight: '18px' },
  icon: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: cssVar.colorFillTertiary,
    backgroundImage: 'none',
  },
  iconCompact: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
  },
  typeIcon: { display: 'flex', color: cssVar.colorTextSecondary },
  title: {
    overflow: 'hidden',
    fontSize: '15px',
    fontWeight: 500,
    color: cssVar.colorText,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  titleCompact: {
    fontSize: '14px',
  },
});
