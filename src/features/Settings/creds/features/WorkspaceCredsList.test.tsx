import { type UserCredSummary } from '@lobechat/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type CredsApi } from './useCredsApi';
import WorkspaceCredsList from './WorkspaceCredsList';

vi.mock('@/layout/AuthProvider/MarketAuth', () => ({
  useMarketAuth: () => ({ session: { userInfo: { accountId: 1 } } }),
}));

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({ allowed: true, reason: '' }),
}));

vi.mock('@/libs/trpc/client', () => ({ lambdaClient: { market: { creds: {} } } }));

vi.mock('@/store/user', () => ({
  useUserStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { avatar: 'https://example.com/me.png', fullName: 'Me' } }),
}));

const createCredDetailModal = vi.hoisted(() => vi.fn());
vi.mock('./CredDetailModal', () => ({ createCredDetailModal }));

const cred = (overrides: Partial<UserCredSummary>): UserCredSummary =>
  ({
    createdAt: '2026-11-19T00:00:00.000Z',
    createdByAccountId: 1,
    id: 1,
    key: 'KEY',
    name: 'cred',
    ownerType: 'organization',
    type: 'kv-env',
    updatedAt: '2026-11-19T00:00:00.000Z',
    visibility: 'public',
    ...overrides,
  }) as UserCredSummary;

const credsApiWith = (rows: UserCredSummary[]) =>
  ({
    client: { delete: { mutate: vi.fn() } },
    query: {
      list: {
        useQuery: () => ({
          data: { data: rows },
          error: null,
          isLoading: false,
          refetch: vi.fn(),
        }),
      },
    },
    setVisibility: vi.fn(),
  }) as unknown as CredsApi;

describe('WorkspaceCredsList', () => {
  it('tags each row with who can use it', () => {
    render(
      <WorkspaceCredsList
        credsApi={credsApiWith([
          cred({ id: 1, name: 'Team token', visibility: 'public' }),
          cred({ id: 2, name: 'My token', visibility: 'private' }),
        ])}
      />,
    );

    expect(screen.getByTestId('cred-visibility-1')).toHaveTextContent('visibilityFilter.workspace');
    expect(screen.getByTestId('cred-visibility-2')).toHaveTextContent('visibilityFilter.private');
  });

  it('does not show the identifier agents look the credential up by', () => {
    render(<WorkspaceCredsList credsApi={credsApiWith([cred({ key: 'team-token-x7k2m9' })])} />);

    expect(screen.queryByText(/team-token-x7k2m9/)).toBeNull();
  });

  it('shows the author avatar only when the author is known', () => {
    render(
      <WorkspaceCredsList
        credsApi={credsApiWith([
          cred({ createdByAccountId: 1, id: 1, name: 'Mine' }),
          cred({ createdByAccountId: 2, id: 2, name: 'Someone else' }),
          cred({
            id: 3,
            name: 'Shared in',
            ownerAccountId: 9,
            ownerDisplayName: 'Alice',
            ownerType: 'user',
          }),
        ])}
      />,
    );

    expect(screen.getByTestId('cred-author-1')).toBeInTheDocument();
    expect(screen.queryByTestId('cred-author-2')).toBeNull();
    expect(screen.getByTestId('cred-author-3')).toBeInTheDocument();
  });

  it('opens the detail on row click, reading values back only when not write-only', () => {
    render(
      <WorkspaceCredsList
        credsApi={credsApiWith([
          cred({ id: 1, name: 'Team token', visibility: 'public' }),
          cred({ id: 2, name: 'My token', visibility: 'private' }),
        ])}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Team token' }));
    expect(createCredDetailModal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        canReadValues: false,
        valuesHint: 'creds.writeOnly.tooltip',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'My token' }));
    const props = createCredDetailModal.mock.lastCall![0];
    expect(props.canReadValues).toBe(true);
    expect(props.actions.map((a: { key: string }) => a.key)).toEqual(['publish']);
    expect(props.onEdit).toBeTypeOf('function');
    expect(props.onDelete).toBeTypeOf('function');
  });
});
