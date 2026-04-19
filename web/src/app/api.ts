import {
  JoinResponse,
  Space,
  SpaceForm,
  SpaceMember,
  SpaceTransaction,
  apiBaseUrl
} from './types';

async function parseJsonResponse<T>(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? fallbackMessage);
  }

  return (await response.json()) as T;
}

export async function fetchSpaces() {
  const response = await fetch(`${apiBaseUrl}/api/spaces`);
  return parseJsonResponse<{ items: Space[] }>(response, 'スペース一覧の取得に失敗しました。');
}

export async function fetchSpaceMembers(spaceId: number) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/members`);
  return parseJsonResponse<{ items: SpaceMember[] }>(response, 'メンバー一覧の取得に失敗しました。');
}

export async function fetchSpaceTransactions(spaceId: number) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/transactions`);
  return parseJsonResponse<{ items: SpaceTransaction[] }>(response, '取引履歴の取得に失敗しました。');
}

export async function createSpaceRequest(spaceForm: SpaceForm) {
  const response = await fetch(`${apiBaseUrl}/api/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: spaceForm.name,
      kind: spaceForm.kind,
      visibility: spaceForm.visibility,
      initialPoints: Number(spaceForm.initialPoints),
      allowGuestJoin: spaceForm.allowGuestJoin,
      bankCanMint: spaceForm.kind === 'owner' ? spaceForm.bankCanMint : false,
      hostDisplayName: spaceForm.hostDisplayName
    })
  });

  return parseJsonResponse<Space>(response, 'スペースの作成に失敗しました。');
}

export async function joinSpaceRequest(code: string, displayName: string) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, displayName })
  });

  return parseJsonResponse<JoinResponse>(response, 'スペースへの参加に失敗しました。');
}

export async function createSpaceTransactionRequest(spaceId: number, payload: Record<string, unknown>) {
  const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<SpaceTransaction>(response, '取引の作成に失敗しました。');
}