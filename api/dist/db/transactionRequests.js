import { createSpaceTransaction } from './transactions.js';
import { getSpaceById, getTransactionRequestById, insertTransactionRequestEntry, listTransactionRequestsBySpaceId, resolveTransactionRequest } from './lookups.js';
import { assertTransactionRequestPermission, canResolveTransactionRequest, validateReferencedMembers } from './authorization.js';
export async function listSpaceTransactionRequests(spaceId) {
    return listTransactionRequestsBySpaceId(spaceId);
}
export async function createSpaceTransactionRequest(spaceId, input, sessionMember) {
    const space = await getSpaceById(spaceId);
    if (!space) {
        throw new Error('Space not found');
    }
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
        throw new Error('amount must be a positive integer');
    }
    const note = input.note?.trim() || undefined;
    const { sourceMember, targetMember } = await validateReferencedMembers(spaceId, input);
    if (input.kind === 'grant' && !targetMember) {
        throw new Error('targetMemberId is required for grant requests');
    }
    if ((input.kind === 'grant' || input.kind === 'transfer' || input.kind === 'consume') && !sourceMember) {
        throw new Error('sourceMemberId is required for this request');
    }
    assertTransactionRequestPermission(sessionMember, space, input);
    const requestId = await insertTransactionRequestEntry(spaceId, {
        kind: input.kind,
        requesterMemberId: sessionMember.id,
        sourceMemberId: sourceMember?.id,
        targetMemberId: targetMember?.id,
        amount: input.amount,
        note
    });
    const created = await getTransactionRequestById(requestId);
    if (!created) {
        throw new Error('Failed to load created transaction request');
    }
    return created;
}
export async function approveSpaceTransactionRequest(spaceId, requestId, sessionMember) {
    const space = await getSpaceById(spaceId);
    if (!space) {
        throw new Error('Space not found');
    }
    if (space.state !== 'active') {
        throw new Error('Space is not active');
    }
    const request = await getTransactionRequestById(requestId);
    if (!request || request.spaceId !== spaceId) {
        throw new Error('Transaction request not found');
    }
    if (request.status !== 'pending') {
        throw new Error('Only pending requests can be approved');
    }
    if (!canResolveTransactionRequest(sessionMember, request)) {
        throw new Error('You are not allowed to approve this request');
    }
    const transaction = await createSpaceTransaction(spaceId, {
        kind: request.kind,
        amount: request.amount,
        actorType: 'member',
        actorMemberId: sessionMember.id,
        sourceMemberId: request.sourceMemberId ?? undefined,
        targetMemberId: request.targetMemberId ?? undefined,
        note: request.note ?? `Approved request #${request.id}`
    });
    await resolveTransactionRequest(request.id, {
        status: 'approved',
        resolvedByMemberId: sessionMember.id,
        approvedTransactionId: transaction.id
    });
    const approved = await getTransactionRequestById(request.id);
    if (!approved) {
        throw new Error('Failed to load approved transaction request');
    }
    return approved;
}
export async function rejectSpaceTransactionRequest(spaceId, requestId, sessionMember, rejectionReason) {
    const request = await getTransactionRequestById(requestId);
    if (!request || request.spaceId !== spaceId) {
        throw new Error('Transaction request not found');
    }
    if (request.status !== 'pending') {
        throw new Error('Only pending requests can be rejected');
    }
    if (!canResolveTransactionRequest(sessionMember, request)) {
        throw new Error('You are not allowed to reject this request');
    }
    await resolveTransactionRequest(request.id, {
        status: 'rejected',
        resolvedByMemberId: sessionMember.id,
        rejectionReason: rejectionReason?.trim() || undefined
    });
    const rejected = await getTransactionRequestById(request.id);
    if (!rejected) {
        throw new Error('Failed to load rejected transaction request');
    }
    return rejected;
}
