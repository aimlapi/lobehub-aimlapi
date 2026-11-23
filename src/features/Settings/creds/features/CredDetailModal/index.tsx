'use client';

import { createModal, type ModalInstance } from '@lobehub/ui';

import CredModalTitle from '../CredModalTitle';
import CredDetailModalContent, { type CredDetailModalContentProps } from './Content';

export type { CredDetailAction } from './Content';

export const createCredDetailModal = (props: CredDetailModalContentProps): ModalInstance =>
  createModal({
    content: <CredDetailModalContent {...props} />,
    footer: null,
    maskClosable: true,
    styles: {
      content: { paddingBlock: 16, paddingInline: 24 },
    },
    title: (
      <CredModalTitle
        avatar={props.cred.oauthAvatar}
        title={props.cred.name}
        type={props.cred.type}
      />
    ),
    width: 'min(90vw, 560px)',
  });
