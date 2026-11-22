import { Text } from '@lobehub/ui';
import { useTranslation } from 'react-i18next';

/**
 * Said under a repository the cloud sandbox skips when the project has no
 * device folder either: nothing would check it out anywhere.
 */
export const RepositoryCloudNotice = () => {
  const { t } = useTranslation('project');

  return (
    <Text fontSize={12} type="warning">
      {t('settings.repositoryLocalOnlyWithoutFolder')}
    </Text>
  );
};
