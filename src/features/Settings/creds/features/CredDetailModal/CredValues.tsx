'use client';

import { type UserCredSummary } from '@lobechat/types';
import { Alert, Button, CopyButton, Flexbox, Text } from '@lobehub/ui';
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ArticleSkeleton } from '@/components/Skeleton';
import { densityTokens } from '@/styles/density.stylex';

import { type CredsApi } from '../useCredsApi';

const styles = stylex.create({
  kvKey: {
    minWidth: '140px',
    paddingBlock: '8px',
    paddingInline: densityTokens['--lobe-density-content-gap'],
    borderTopLeftRadius: cssVar.borderRadius,
    borderTopRightRadius: '0',
    borderBottomRightRadius: '0',
    borderBottomLeftRadius: cssVar.borderRadius,
    fontFamily: cssVar.fontFamilyCode,
    fontSize: '13px',
    color: cssVar.colorTextSecondary,
    backgroundColor: cssVar.colorFillQuaternary,
    backgroundImage: 'none',
  },
  kvRow: {
    display: 'flex',
    alignItems: 'stretch',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: cssVar.colorBorderSecondary,
    borderRadius: cssVar.borderRadius,
    marginBlockEnd: { 'default': null, ':not(:last-child)': '8px' },
  },
  kvValue: {
    display: 'flex',
    flex: '1',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBlock: '8px',
    paddingInline: densityTokens['--lobe-density-content-gap'],
    borderTopLeftRadius: '0',
    borderTopRightRadius: cssVar.borderRadius,
    borderBottomRightRadius: cssVar.borderRadius,
    borderBottomLeftRadius: '0',
    fontFamily: cssVar.fontFamilyCode,
    fontSize: '13px',
    backgroundColor: cssVar.colorBgContainer,
    backgroundImage: 'none',
  },
  maskedValue: { color: cssVar.colorTextQuaternary, letterSpacing: '2px' },
  toggleBtn: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: cssVar.borderRadiusSM,
    color: { 'default': cssVar.colorTextTertiary, ':hover': cssVar.colorText },
    transition: 'all 0.2s',
    backgroundColor: { 'default': null, ':hover': cssVar.colorFillSecondary },
    backgroundImage: { 'default': null, ':hover': 'none' },
  },
});

const maskValue = (value: string): string => {
  if (value.length <= 4) return '••••••••';
  return '••••••••' + value.slice(-4);
};

interface KVRowProps {
  keyName: string;
  value: string;
}

const KVRow: FC<KVRowProps> = ({ keyName, value }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div {...stylex.props(styles.kvRow)}>
      <div {...stylex.props(styles.kvKey)}>{keyName}</div>
      <div {...stylex.props(styles.kvValue)}>
        <Text
          as={'span'}
          className={stylex.props(!visible && styles.maskedValue).className}
          style={{
            flex: 1,
            fontFamily: cssVar.fontFamilyCode,
            fontSize: 13,
            wordBreak: 'break-all',
          }}
        >
          {visible ? value : maskValue(value)}
        </Text>
        <Flexbox horizontal align={'center'} gap={4}>
          <div {...stylex.props(styles.toggleBtn)} onClick={() => setVisible(!visible)}>
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </div>
          <CopyButton content={value} size={'small'} />
        </Flexbox>
      </div>
    </div>
  );
};

interface CredValuesProps {
  cred: UserCredSummary;
  credsApi: CredsApi;
}

/**
 * The decrypted key/value pairs of an environment-variable or header
 * credential, each masked until revealed. Only rendered for a credential
 * the viewer may read back (see `isWriteOnlyCredRow`). Nothing is decrypted
 * until the viewer asks: opening the detail just to edit, share or delete
 * must not pull the plaintext into the browser.
 */
const CredValues: FC<CredValuesProps> = ({ cred, credsApi }) => {
  const { t } = useTranslation('setting');
  const [requested, setRequested] = useState(false);

  const { data, isLoading, error } = useQuery({
    enabled: requested,
    // Not kept once the modal closes.
    gcTime: 0,
    queryFn: () => credsApi.client.get.query({ decrypt: true, id: cred.id }),
    queryKey: ['cred-plaintext', cred.id],
  });

  if (!requested) {
    return (
      <Button size={'small'} onClick={() => setRequested(true)}>
        {t('creds.view.show')}
      </Button>
    );
  }

  if (isLoading) return <ArticleSkeleton rows={2} />;

  if (error) {
    return (
      <Alert
        showIcon
        description={(error as Error).message}
        message={t('creds.view.error')}
        type={'error'}
      />
    );
  }

  const valueEntries = Object.entries(
    (data as { plaintext?: Record<string, string> } | undefined)?.plaintext ?? {},
  );

  if (valueEntries.length === 0) return <Text type={'secondary'}>{t('creds.view.noValues')}</Text>;

  return (
    <div>
      {valueEntries.map(([key, value]) => (
        <KVRow key={key} keyName={key} value={String(value)} />
      ))}
    </div>
  );
};

export default CredValues;
