import type { DeviceListItem } from '@lobechat/types';
import {
  ActionIcon,
  Button,
  confirmModal,
  cssVar,
  Flexbox,
  Icon,
  Tag,
  Text,
  toast,
  Tooltip,
} from '@lobehub/ui';
import { FolderIcon, LinkIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import AsyncError from '@/components/AsyncError';
import { getDeviceIcon } from '@/features/DeviceManager/getDeviceIcon';
import { deviceSelectors, useDeviceStore } from '@/store/device';
import type { ProjectDirectory } from '@/store/projectWorkingDirectory';
import { useProjectDirectories, useProjectDirectoryStore } from '@/store/projectWorkingDirectory';

import { openAddDirectoryModal } from './AddDirectoryModal';
import { openBindDirectoryModal } from './BindDirectoryModal';
import { openEditDirectoryModal } from './EditDirectoryModal';

/**
 * Presence as a dot before the device's name — green online, gray offline —
 * with the word on hover. A device row restored from the persisted list
 * (`onlineUnknown`) has not been confirmed yet, so it shows no dot until
 * `listDevices` answers.
 */
const DevicePresence = ({ device }: { device?: DeviceListItem }) => {
  const { t } = useTranslation('project');
  if (device?.onlineUnknown) return null;
  const online = !!device?.online;
  return (
    <Tooltip title={t(online ? 'settings.deviceOnline' : 'settings.deviceOffline')}>
      <span
        aria-label={t(online ? 'settings.deviceOnline' : 'settings.deviceOffline')}
        role="img"
        style={{
          background: online ? cssVar.colorSuccess : cssVar.colorTextQuaternary,
          borderRadius: '50%',
          display: 'inline-block',
          flex: 'none',
          height: 8,
          width: 8,
        }}
      />
    </Tooltip>
  );
};

interface LocalDirectoriesProps {
  canManage: boolean;
  /** The project's environment, which a new folder is linked to. */
  environmentId?: string;
  projectId: string;
}

/**
 * The project's working directory on each device, device by device: where its
 * code already sits on that machine, so a conversation can run there. Every
 * connected device is listed, online ones first: one that has a folder shows
 * it, one that has none offers to set it. A folder on a device no longer in
 * the list stays, so it can still be changed or removed.
 */
export function LocalDirectories({ canManage, environmentId, projectId }: LocalDirectoriesProps) {
  const { t } = useTranslation('project');
  const directoriesRequest = useProjectDirectoryStore((s) => s.useFetchDirectories)(projectId);
  const directories = useProjectDirectories(projectId);
  const deviceRequest = useDeviceStore((s) => s.useFetchDevices)(true);
  const devices = useDeviceStore(deviceSelectors.deviceList);
  const isDeviceListLoaded = useDeviceStore(deviceSelectors.isDeviceListLoaded);
  const removeDirectory = useProjectDirectoryStore((s) => s.removeDirectory);
  const error = directoriesRequest.error || deviceRequest.error;

  const remove = (directory: ProjectDirectory) =>
    confirmModal({
      cancelText: t('cancel', { ns: 'common' }),
      content: t('settings.removeDirectoryConfirmDescription', {
        device: directory.deviceName || directory.deviceId,
        path: directory.path,
      }),
      okButtonProps: { danger: true },
      okText: t('settings.removeDirectory'),
      onOk: async () => {
        try {
          await removeDirectory(projectId, directory.id);
        } catch (error) {
          console.error('Failed to remove project directory', error);
          toast.error(t('settings.removeDirectoryFailed'));
        }
      },
      title: t('settings.removeDirectoryConfirmTitle', { name: directory.name }),
    });

  const setDirectory = (deviceId: string) =>
    openAddDirectoryModal(projectId, environmentId, { deviceId });

  /** One device: its name and presence, then what it holds for the project. */
  const row = (key: string, head: ReactNode, path: ReactNode, actions: ReactNode) => (
    <Flexbox
      horizontal
      align="center"
      gap={16}
      justify="space-between"
      key={key}
      paddingBlock={10}
      paddingInline={12}
      style={{ background: cssVar.colorFillQuaternary, borderRadius: cssVar.borderRadius }}
    >
      <Flexbox flex={1} gap={4} style={{ minWidth: 0 }}>
        <Flexbox horizontal align="center" gap={8} wrap="wrap">
          {head}
        </Flexbox>
        <Flexbox horizontal align="center" gap={6} style={{ minWidth: 0 }}>
          <Icon icon={FolderIcon} size={14} style={{ flex: 'none' }} />
          {path}
        </Flexbox>
      </Flexbox>
      <Flexbox horizontal align="center" gap={8}>
        {actions}
      </Flexbox>
    </Flexbox>
  );

  const deviceHead = (device: DeviceListItem | undefined, fallbackName: string) => (
    <>
      {getDeviceIcon(device?.platform, 16)}
      <Text weight={500}>{device?.friendlyName || device?.hostname || fallbackName}</Text>
      <DevicePresence device={device} />
    </>
  );
  // A folder not linked to the environment yet: a quiet badge after the name,
  // linking it one click away.
  const unlinkedBadge = (directory: ProjectDirectory) => (
    <Tooltip title={t('settings.enableDirectoryHint')}>
      <Tag
        icon={<Icon icon={LinkIcon} size={12} />}
        size="small"
        style={{ cursor: 'pointer' }}
        onClick={() =>
          openBindDirectoryModal({
            projectId,
            deviceId: directory.deviceId,
            path: directory.path,
          })
        }
      >
        {t('settings.enableDirectory')}
      </Tag>
    </Tooltip>
  );

  if (error)
    return (
      <AsyncError
        error={error}
        onRetry={() => Promise.all([directoriesRequest.revalidate(), deviceRequest.revalidate()])}
      />
    );
  if (!directoriesRequest.hasData || !isDeviceListLoaded)
    return <Text type="secondary">{t('loading', { ns: 'common' })}</Text>;

  const online = (deviceId: string) =>
    !!devices.find((device) => device.deviceId === deviceId)?.online;
  const withFolders = [...directories]
    .sort((a, b) => Number(online(b.deviceId)) - Number(online(a.deviceId)))
    .map((directory) => {
      const device = devices.find((d) => d.deviceId === directory.deviceId);
      return row(
        directory.id,
        <>
          {deviceHead(device, directory.deviceName || directory.deviceId)}
          {!directory.instanceId && unlinkedBadge(directory)}
        </>,
        <Text fontSize={12} style={{ overflowWrap: 'anywhere' }} type="secondary">
          {directory.path}
        </Text>,
        <>
          {canManage && (
            <ActionIcon
              icon={PencilIcon}
              size="small"
              title={t('settings.editDirectory')}
              onClick={() => openEditDirectoryModal(projectId, directory)}
            />
          )}
          {canManage && (
            <ActionIcon
              icon={Trash2Icon}
              size="small"
              title={t('settings.removeDirectory')}
              onClick={() => remove(directory)}
            />
          )}
        </>,
      );
    });

  const withoutFolder = devices
    .filter((device) => !directories.some((directory) => directory.deviceId === device.deviceId))
    .sort((a, b) => Number(!!b.online) - Number(!!a.online))
    .map((device) =>
      row(
        device.deviceId,
        deviceHead(device, device.deviceId),
        <Text fontSize={12} type="secondary">
          {t('settings.deviceNoDirectory')}
        </Text>,
        canManage ? (
          <Button size="small" onClick={() => setDirectory(device.deviceId)}>
            {t('settings.setDeviceDirectory')}
          </Button>
        ) : null,
      ),
    );

  return (
    <Flexbox gap={8} style={{ marginTop: 8 }}>
      {withFolders.length + withoutFolder.length === 0 ? (
        <Text fontSize={13} type="secondary">
          {t('settings.noDevices')}
        </Text>
      ) : (
        [...withFolders, ...withoutFolder]
      )}
    </Flexbox>
  );
}
