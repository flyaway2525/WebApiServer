const participantCapabilities = [
    'viewMembers',
    'viewRanking',
    'viewTransactions',
    'viewTransactionRequests',
    'createTransaction',
    'createTransactionRequest'
];
const hostCapabilities = [
    ...participantCapabilities,
    'resolveTransactionRequest',
    'manageSpaceState'
];
const bankCapabilities = [...hostCapabilities, 'mintPoints'];
const spectatorCapabilities = [
    'viewMembers',
    'viewRanking',
    'viewTransactions'
];
export function resolveRolePreset(kind, rolePreset) {
    if (kind === 'owner') {
        return 'owner-bank';
    }
    if (rolePreset === 'tournament-room') {
        return 'tournament-room';
    }
    return 'standard-room';
}
export function buildRoleDefinitions(kind, rolePreset) {
    const preset = resolveRolePreset(kind, rolePreset);
    if (preset === 'owner-bank') {
        return [
            {
                key: 'host',
                label: 'Host',
                description: '部屋設定と承認を管理する運営ロールです。',
                legacyRole: 'host',
                maxParticipants: 1,
                isSystem: true,
                capabilities: hostCapabilities
            },
            {
                key: 'bank',
                label: 'BANK',
                description: 'owner モード専用の発行主体です。',
                legacyRole: 'bank',
                maxParticipants: 1,
                isSystem: true,
                capabilities: bankCapabilities
            },
            {
                key: 'member',
                label: 'Member',
                description: '通常参加者としてポイント操作を行います。',
                legacyRole: 'member',
                capabilities: participantCapabilities
            }
        ];
    }
    if (preset === 'tournament-room') {
        return [
            {
                key: 'host',
                label: 'Host',
                description: '部屋設定と承認を管理する運営ロールです。',
                legacyRole: 'host',
                maxParticipants: 1,
                isSystem: true,
                capabilities: hostCapabilities
            },
            {
                key: 'player',
                label: 'Player',
                description: 'ポイント送受信と申請を行うプレイヤーです。',
                legacyRole: 'member',
                capabilities: participantCapabilities
            },
            {
                key: 'spectator',
                label: 'Spectator',
                description: 'ランキングと履歴を閲覧する観戦者です。',
                legacyRole: 'member',
                capabilities: spectatorCapabilities
            }
        ];
    }
    return [
        {
            key: 'host',
            label: 'Host',
            description: '部屋設定と承認を管理する運営ロールです。',
            legacyRole: 'host',
            maxParticipants: 1,
            isSystem: true,
            capabilities: hostCapabilities
        },
        {
            key: 'member',
            label: 'Member',
            description: '通常参加者としてポイント操作を行います。',
            legacyRole: 'member',
            capabilities: participantCapabilities
        }
    ];
}
export function getDefaultJoinRoleKey(kind, rolePreset) {
    const definitions = buildRoleDefinitions(kind, rolePreset).filter((definition) => !definition.isSystem);
    return definitions[0]?.key ?? 'member';
}
export function hasCapability(member, capability) {
    return member.capabilities.includes(capability);
}
