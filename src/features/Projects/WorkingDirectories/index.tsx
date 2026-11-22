import { Flexbox, Text } from '@lobehub/ui';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import AsyncError from '@/components/AsyncError';
import EnvironmentForm, {
  type EnvironmentFormValue,
} from '@/features/EnvironmentManager/EnvironmentForm';
import EnvironmentSummary from '@/features/EnvironmentManager/EnvironmentSummary';
import { EnvironmentListSkeleton } from '@/features/EnvironmentManager/Skeleton';
import type { SandboxEnvironmentSpecification } from '@/services/environment';
import {
  useProjectDirectories,
  useProjectDirectoryStore,
  useProjectEnvironments,
} from '@/store/projectWorkingDirectory';
import { useDensityTokens } from '@/styles/density';

import { LocalDirectories } from './LocalDirectories';
import { RepositoryCloudNotice } from './RepositoryCloudNotice';

interface ProjectWorkingDirectoriesProps {
  /** Whether the caller may change the project, and so its environment. */
  canManage?: boolean;
  projectId: string;
}

/** One of the two places a project conversation runs, with what it needs. */
const Group = ({ children, desc, title }: { children: ReactNode; desc: string; title: string }) => (
  <Flexbox gap={4}>
    <Flexbox gap={4}>
      <Text fontSize={16} weight={600}>
        {title}
      </Text>
      <Text type="secondary">{desc}</Text>
    </Flexbox>
    {children}
  </Flexbox>
);

/**
 * Where the project's conversations run, one place at a time, each with only
 * what it needs:
 *
 * - The cloud sandbox, where a new conversation starts by default: the
 *   project's environment — the repositories it clones, the setup that runs
 *   and the variables every command sees. Every project has exactly one,
 *   made with it, so there is nothing to link or pick, only to fill in.
 * - Devices: the project's folders on connected machines, where the
 *   repositories already are. Their order is the device priority a new
 *   conversation follows.
 *
 * A repository the cloud sandbox skips lives in the device folders only, so
 * it says so when the project has none.
 */
export function ProjectWorkingDirectories({
  canManage,
  projectId,
}: ProjectWorkingDirectoriesProps) {
  const { t } = useTranslation(['project', 'setting']);
  const { pageTitleFontSize } = useDensityTokens();
  const request = useProjectDirectoryStore((s) => s.useFetchEnvironments)(projectId);
  const updateEnvironment = useProjectDirectoryStore((s) => s.updateProjectEnvironment);
  const [environment] = useProjectEnvironments(projectId);
  const directoriesRequest = useProjectDirectoryStore((s) => s.useFetchDirectories)(projectId);
  const directories = useProjectDirectories(projectId);

  const save = async (changes: {
    configuration?: SandboxEnvironmentSpecification;
    description?: string;
  }) => {
    await updateEnvironment({
      projectId,
      ...(changes.configuration && { configuration: changes.configuration }),
      ...(changes.description !== undefined && { description: changes.description }),
    });
  };

  let cloud: ReactNode;
  if (request.error && !environment) {
    cloud = <AsyncError error={request.error} onRetry={() => request.revalidate()} />;
  } else if (!request.hasData || !environment) {
    cloud = <EnvironmentListSkeleton />;
  } else {
    const value: EnvironmentFormValue = environment;
    const renderRepositoryLocations = (source: { localOnly?: boolean }) =>
      source.localOnly && directoriesRequest.hasData && directories.length === 0 ? (
        <RepositoryCloudNotice />
      ) : null;
    cloud = canManage ? (
      <EnvironmentForm
        allowLocalOnly
        hideBasics
        environment={value}
        renderRepositoryLocations={renderRepositoryLocations}
        onSave={save}
      />
    ) : (
      <EnvironmentSummary
        environment={value}
        renderRepositoryLocations={renderRepositoryLocations}
      />
    );
  }

  return (
    <Flexbox gap={32}>
      <Flexbox gap={8}>
        <Text fontSize={pageTitleFontSize} weight={600}>
          {t('settings.environments')}
        </Text>
        <Text type="secondary">{t('settings.environmentIntro')}</Text>
      </Flexbox>
      <Group desc={t('settings.cloudSandboxGroupDesc')} title={t('settings.cloudSandboxGroup')}>
        {cloud}
      </Group>
      <Group desc={t('settings.devicesGroupDesc')} title={t('settings.devicesGroup')}>
        <LocalDirectories
          canManage={!!canManage}
          environmentId={environment?.id}
          projectId={projectId}
        />
      </Group>
    </Flexbox>
  );
}
