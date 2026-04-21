import { getSpaceMemberById } from './lookups.js';
import { hasCapability } from './roleDefinitions.js';
export function assertReadPermission(sessionMember, capability) {
    if (!hasCapability(sessionMember, capability)) {
        throw new Error('You are not allowed to view this resource');
    }
}
function requireActiveSpace(space) {
    if (space.state !== 'active') {
        throw new Error('Space is not active');
    }
}
function ensureSameSpace(member, spaceId, fieldName) {
    if (member && member.spaceId !== spaceId) {
        throw new Error(`${fieldName} must belong to the selected space`);
    }
}
export async function validateReferencedMembers(spaceId, input) {
    const sourceMember = input.sourceMemberId == null ? null : await getSpaceMemberById(input.sourceMemberId);
    const targetMember = input.targetMemberId == null ? null : await getSpaceMemberById(input.targetMemberId);
    ensureSameSpace(sourceMember, spaceId, 'sourceMemberId');
    ensureSameSpace(targetMember, spaceId, 'targetMemberId');
    return {
        sourceMember,
        targetMember
    };
}
export function assertTransactionPermission(sessionMember, space, input) {
    requireActiveSpace(space);
    if ((input.actorType ?? 'member') !== 'member') {
        throw new Error('Authenticated transaction actors must use actorType=member');
    }
    if (input.actorMemberId !== sessionMember.id) {
        throw new Error('actorMemberId must match the authenticated member');
    }
    if (!hasCapability(sessionMember, 'createTransaction')) {
        throw new Error('You are not allowed to create direct transactions');
    }
    if (hasCapability(sessionMember, 'manageSpaceState')) {
        return;
    }
    if (input.kind === 'grant') {
        if (input.targetMemberId == null) {
            throw new Error('targetMemberId is required for grant');
        }
        if (input.sourceMemberId == null) {
            if (!(sessionMember.role === 'bank' && space.kind === 'owner' && space.bankCanMint)) {
                throw new Error('Only BANK can mint points without a source member');
            }
            return;
        }
        if (input.sourceMemberId !== sessionMember.id) {
            throw new Error('You can only grant points from your own balance');
        }
        return;
    }
    if (input.kind === 'transfer') {
        if (input.sourceMemberId !== sessionMember.id) {
            throw new Error('You can only transfer points from your own balance');
        }
        return;
    }
    if (input.sourceMemberId !== sessionMember.id) {
        throw new Error('You can only consume points from your own balance');
    }
}
export function assertTransactionRequestPermission(sessionMember, space, input) {
    requireActiveSpace(space);
    if (!hasCapability(sessionMember, 'createTransactionRequest')) {
        throw new Error('You are not allowed to create transaction requests');
    }
    if (input.kind === 'grant') {
        if (input.sourceMemberId == null || input.targetMemberId == null) {
            throw new Error('grant requests require both sourceMemberId and targetMemberId');
        }
    }
    if (input.kind === 'transfer') {
        if (input.sourceMemberId == null || input.targetMemberId == null) {
            throw new Error('transfer requests require both sourceMemberId and targetMemberId');
        }
        if (input.sourceMemberId === input.targetMemberId) {
            throw new Error('sourceMemberId and targetMemberId must be different');
        }
    }
    if (input.kind === 'consume' && input.sourceMemberId == null) {
        throw new Error('consume requests require sourceMemberId');
    }
    if (input.sourceMemberId === sessionMember.id && sessionMember.role !== 'host') {
        throw new Error('Use a direct transaction when spending your own balance');
    }
}
export function canResolveTransactionRequest(sessionMember, request) {
    if (hasCapability(sessionMember, 'resolveTransactionRequest')) {
        return true;
    }
    return request.sourceMemberId === sessionMember.id;
}
export function canUpdateSpaceState(sessionMember, space, nextState) {
    const isPrivileged = hasCapability(sessionMember, 'manageSpaceState');
    if (!isPrivileged) {
        throw new Error('Only privileged members can change the space state');
    }
    if (space.state === 'archived' && nextState !== 'archived') {
        throw new Error('Archived spaces cannot be reopened');
    }
    if (nextState === 'archived' && space.state !== 'closed') {
        throw new Error('Only closed spaces can be archived');
    }
}
