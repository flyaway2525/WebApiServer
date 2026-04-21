import { RoleCapabilityKey, SpaceMember } from './types';

export function hasCapability(member: Pick<SpaceMember, 'capabilities'> | null, capability: RoleCapabilityKey) {
  return member?.capabilities.includes(capability) ?? false;
}