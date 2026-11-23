'use client';

import { type UserCredSummary } from '@lobechat/types';
import { Avatar, Flexbox, Icon } from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import { type FC, type KeyboardEvent, memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useDensity } from '@/styles/density';

import { CRED_TYPE_ICONS } from './credTypes';
import { styles } from './style';

interface CredItemProps {
  cred: UserCredSummary;
  /** Right-aligned row meta, e.g. the workspace visibility tag and the author avatar. */
  extra?: ReactNode;
  /** Opens the credential's detail; every action lives there. */
  onClick: (cred: UserCredSummary) => void;
  /** Tags shown after the name, e.g. how many workspaces a personal credential is shared into. */
  tags?: ReactNode;
}

/**
 * One vault row: only what tells credentials apart — type icon (or the OAuth
 * account avatar), name, and one line of "type · account · description".
 * The whole row opens the detail modal, which holds view, edit and remove.
 */
const CredItem: FC<CredItemProps> = memo(({ cred, extra, onClick, tags }) => {
  const { t } = useTranslation('setting');
  const { compact, tokens } = useDensity();

  const subtitle = [t(`creds.types.${cred.type}`), cred.oauthUsername, cred.description]
    .filter(Boolean)
    .join(' · ');

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onClick(cred);
  };

  return (
    <Flexbox
      horizontal
      align="center"
      aria-label={cred.name}
      className={stylex.props(styles.container, compact && styles.containerCompact).className}
      gap={tokens.sectionGap}
      role="button"
      tabIndex={0}
      onClick={() => onClick(cred)}
      onKeyDown={handleKeyDown}
    >
      <div {...stylex.props(styles.icon, compact && styles.iconCompact)}>
        {cred.type === 'oauth' && cred.oauthAvatar ? (
          <Avatar avatar={cred.oauthAvatar} size={tokens.controlHeight} />
        ) : (
          // `display: flex` collapses the inline span's line box so the svg sits
          // dead-center in the tile instead of on the text baseline.
          <span {...stylex.props(styles.typeIcon)}>
            <Icon icon={CRED_TYPE_ICONS[cred.type]} size={20} />
          </span>
        )}
      </div>
      <Flexbox gap={compact ? 2 : 4} style={{ flex: 1, minWidth: 0 }}>
        <Flexbox horizontal align="center" gap={8} style={{ minWidth: 0 }}>
          <span {...stylex.props(styles.title, compact && styles.titleCompact)}>{cred.name}</span>
          {tags}
        </Flexbox>
        <span {...stylex.props(styles.description, compact && styles.descriptionCompact)}>
          {subtitle}
        </span>
      </Flexbox>
      {extra && (
        <Flexbox horizontal align="center" flex={'none'} gap={8}>
          {extra}
        </Flexbox>
      )}
    </Flexbox>
  );
});

CredItem.displayName = 'CredItem';

export default CredItem;
