'use client';

import { type UserCredSummary } from '@lobechat/types';
import {
  Button,
  confirmModal,
  Descriptions,
  type DescriptionsItem,
  Flexbox,
  Text,
  useModalContext,
} from '@lobehub/ui';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';

import CredFormFooter from '../CredFormFooter';
import { type CredsApi } from '../useCredsApi';
import CredValues from './CredValues';

export interface CredDetailAction {
  danger?: boolean;
  key: string;
  label: string;
  /** Runs after the detail modal closes; it may open its own confirmation. */
  onClick: () => void;
}

export interface CredDetailModalContentProps {
  /** Secondary footer buttons beside Edit, e.g. publish / make private / share. */
  actions?: CredDetailAction[];
  /** Whether the viewer may read the values back; KV credentials only. */
  canReadValues?: boolean;
  cred: UserCredSummary;
  credsApi: CredsApi;
  /** Rows after type and account, e.g. visibility and author in a workspace. */
  extraItems?: DescriptionsItem[];
  /** Omit to hide Remove. Called after the user confirms. */
  onDelete?: () => void;
  /** Omit to hide Edit. Runs after the detail modal closes. */
  onEdit?: () => void;
  /** Shown in place of the values when they exist but cannot be read back. */
  valuesHint?: string;
}

/**
 * Everything about one credential and everything that can be done with it:
 * the list row only opens this. The identifier agents look the credential up
 * by is deliberately absent — it is generated and never typed by the user.
 */
const CredDetailModalContent: FC<CredDetailModalContentProps> = ({
  actions = [],
  canReadValues,
  cred,
  credsApi,
  extraItems = [],
  onDelete,
  onEdit,
  valuesHint,
}) => {
  const { t } = useTranslation('setting');
  const { close } = useModalContext();

  const isKV = cred.type === 'kv-env' || cred.type === 'kv-header';

  const items: DescriptionsItem[] = [
    { children: t(`creds.types.${cred.type}`), key: 'type', label: t('creds.table.type') },
    ...(cred.oauthUsername
      ? [{ children: cred.oauthUsername, key: 'account', label: t('creds.detail.account') }]
      : []),
    ...(cred.fileName
      ? [{ children: cred.fileName, key: 'file', label: t('creds.form.selectedFile') }]
      : []),
    ...extraItems,
    ...(cred.description
      ? [
          {
            children: <span style={{ whiteSpace: 'pre-wrap' }}>{cred.description}</span>,
            key: 'description',
            label: t('creds.form.description'),
          },
        ]
      : []),
    ...(isKV && (canReadValues || valuesHint)
      ? [
          {
            children: canReadValues ? (
              <CredValues cred={cred} credsApi={credsApi} />
            ) : (
              <Text type={'secondary'}>{valuesHint}</Text>
            ),
            key: 'values',
            label: t('creds.view.values'),
          },
        ]
      : []),
  ];

  const runAfterClose = (run: () => void) => () => {
    close();
    run();
  };

  const handleDelete = () =>
    confirmModal({
      content: t('creds.actions.deleteConfirm.content'),
      okButtonProps: { danger: true },
      okText: t('creds.actions.deleteConfirm.ok'),
      onOk: () => {
        close();
        onDelete?.();
      },
      title: t('creds.actions.deleteConfirm.title'),
    });

  return (
    <>
      <Descriptions bordered column={1} items={items} styles={{ label: { width: 120 } }} />
      <CredFormFooter>
        <Flexbox horizontal align={'center'} gap={8} justify={'space-between'} width={'100%'}>
          <div>
            {onDelete && (
              <Button danger onClick={handleDelete}>
                {t('creds.actions.delete')}
              </Button>
            )}
          </div>
          <Flexbox horizontal align={'center'} gap={8} wrap={'wrap'}>
            {actions.map((action) => (
              <Button
                danger={action.danger}
                key={action.key}
                onClick={runAfterClose(action.onClick)}
              >
                {action.label}
              </Button>
            ))}
            {onEdit && <Button onClick={runAfterClose(onEdit)}>{t('creds.actions.edit')}</Button>}
            <Button type={'primary'} onClick={close}>
              {t('creds.detail.done')}
            </Button>
          </Flexbox>
        </Flexbox>
      </CredFormFooter>
    </>
  );
};

export default CredDetailModalContent;
