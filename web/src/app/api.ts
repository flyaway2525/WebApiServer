import {
  CreateSpaceResponse,
  JoinResponse,
  Space,
  SpaceForm,
  SpaceRoleDefinition,
  SpaceMember,
  SpaceSession,
  SpaceTransaction,
  SpaceTransactionRequest,
  apiBaseUrl
} from './types';

function createSessionHeaders(session: SpaceSession) {
  return {
    'Content-Type': 'application/json',
    'x-space-member-id': String(session.memberId),
    'x-space-session-token': session.token
  };
}

async function parseJsonResponse<T>(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? fallbackMessage);
  }

  return (await response.json()) as T;
}

export async function fetchSpaces(session?: SpaceSession | null) {
  const response = await fetch(`${apiBaseUrl}/api/spaces`, {
    headers: session ? createSessionHeaders(session) : undefined
  });
  return parseJsonResponse<{ items: Space[] }>(response, 'スペース一覧の取得に失敗しました。');
}

export async function fetchSpaceMembers(spaceId: number) {
  throw new Error('session is required');
}

export async function fetchAuthorizedSpaceMembers(spaceId: number, session: SpaceSession) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/members`, {
    headers: createSessionHeaders(session)
  });
  return parseJsonResponse<{ items: SpaceMember[] }>(response, 'メンバー一覧の取得に失敗しました。');
}

export async function fetchSpaceTransactions(spaceId: number) {
  throw new Error('session is required');
}

export async function fetchAuthorizedSpaceTransactions(spaceId: number, session: SpaceSession) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/transactions`, {
    headers: createSessionHeaders(session)
  });
  return parseJsonResponse<{ items: SpaceTransaction[] }>(response, '取引履歴の取得に失敗しました。');
}

export async function fetchSpaceTransactionRequests(spaceId: number) {
  throw new Error('session is required');
}

export async function fetchAuthorizedSpaceTransactionRequests(spaceId: number, session: SpaceSession) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/transaction-requests`, {
    headers: createSessionHeaders(session)
  });
  return parseJsonResponse<{ items: SpaceTransactionRequest[] }>(response, '承認待ち取引の取得に失敗しました。');
}

export async function createSpaceRequest(spaceForm: SpaceForm) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: spaceForm.name,
      kind: spaceForm.kind,
      visibility: spaceForm.visibility,
      rolePreset: spaceForm.rolePreset,
      initialPoints: Number(spaceForm.initialPoints),
      allowGuestJoin: spaceForm.allowGuestJoin,
      bankCanMint: spaceForm.kind === 'owner' ? spaceForm.bankCanMint : false,
      hostDisplayName: spaceForm.hostDisplayName
    })
  });

  return parseJsonResponse<CreateSpaceResponse>(response, 'スペースの作成に失敗しました。');
}

export async function joinSpaceRequest(code: string, displayName: string, roleKey?: string) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, displayName, roleKey })
  });

  return parseJsonResponse<JoinResponse>(response, 'スペースへの参加に失敗しました。');
}

export async function fetchSpaceRoleDefinitionsByCode(code: string, session?: SpaceSession | null) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/by-code/${encodeURIComponent(code)}/role-definitions`, {
    headers: session ? createSessionHeaders(session) : undefined
  });
  return parseJsonResponse<{ items: SpaceRoleDefinition[] }>(response, 'ロール一覧の取得に失敗しました。');
}

export async function createSpaceTransactionRequest(spaceId: number, payload: Record<string, unknown>) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<SpaceTransaction>(response, '取引の作成に失敗しました。');
}

export async function createAuthorizedSpaceTransactionRequest(
  spaceId: number,
  payload: Record<string, unknown>,
  session: SpaceSession
) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/transactions`, {
    method: 'POST',
    headers: createSessionHeaders(session),
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<SpaceTransaction>(response, '取引の作成に失敗しました。');
}

export async function createAuthorizedPendingTransactionRequest(
  spaceId: number,
  payload: Record<string, unknown>,
  session: SpaceSession
) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/transaction-requests`, {
    method: 'POST',
    headers: createSessionHeaders(session),
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<SpaceTransactionRequest>(response, '承認待ち取引の作成に失敗しました。');
}

export async function approveSpaceTransactionRequest(
  spaceId: number,
  requestId: number,
  session: SpaceSession
) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/transaction-requests/${requestId}/approve`, {
    method: 'POST',
    headers: createSessionHeaders(session)
  });

  return parseJsonResponse<SpaceTransactionRequest>(response, '承認待ち取引の承認に失敗しました。');
}

export async function rejectSpaceTransactionRequest(
  spaceId: number,
  requestId: number,
  session: SpaceSession,
  rejectionReason?: string
) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/transaction-requests/${requestId}/reject`, {
    method: 'POST',
    headers: createSessionHeaders(session),
    body: JSON.stringify(
      rejectionReason?.trim()
        ? { rejectionReason: rejectionReason.trim() }
        : {}
    )
  });

  return parseJsonResponse<SpaceTransactionRequest>(response, '承認待ち取引の却下に失敗しました。');
}