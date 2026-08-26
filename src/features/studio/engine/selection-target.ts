export function shouldTargetWholeGroup(
  groupId: string | undefined,
  editScope: 'group' | 'layer',
  shiftKey: boolean
): boolean {
  return Boolean(groupId) && (editScope === 'group' || shiftKey)
}
