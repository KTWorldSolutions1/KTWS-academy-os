/**
 * Employee onboarding permission and workflow policy.
 *
 * Foundation only: this file does NOT issue invites, persist employee PII,
 * collect electronic signatures, or activate production access.
 * Keep the actual onboarding service disabled until security acceptance.
 */
export const ONBOARDING_INVITATION_CHANNELS = ['email', 'sms'] as const;
export const ONBOARDING_WORKFLOW = [
  'Draft', 'Invited', 'In progress', 'Employee submitted',
  'Corrections requested', 'HR review', 'HR verified', 'Complete',
  'Cancelled'
] as const;
export type OnboardingStatus = typeof ONBOARDING_WORKFLOW[number];
export type OnboardingActor = {
  role: string;
  campusIds: string[];
  /** True only after separate payroll/HR authorization, not based on role title. */
  hasRestrictedHrAccess?: boolean;
};
export const ONBOARDING_FILES = {
  personnel: ['emergency-contact', 'handbook-acknowledgement', 'policy-acknowledgement', 'role-credential'],
  payroll: ['federal-w4', 'nc4', 'nc4-ez', 'direct-deposit'],
  eligibility: ['i9-section-1', 'i9-section-2', 'i9-supplement']
} as const;

export type OnboardingFileGroup = keyof typeof ONBOARDING_FILES;
export function canReviewOnboarding(actor: OnboardingActor, campusId: string) {
  return (
    ['Campus manager', 'Regional admin', 'Owner'].includes(actor.role) ||
    (actor.role === 'Admin assistant' && actor.hasRestrictedHrAccess === true)
  ) && hasCampus(actor, campusId);
}
function hasCampus(actor: OnboardingActor, campusId: string) {
  if (!campusId) return false;
  return (actor.role === 'Owner' || actor.role === 'Regional admin')
    ? (actor.campusIds.length === 0 || actor.campusIds.includes(campusId))
    : actor.campusIds.includes(campusId);
}
/** User-confirmed: campus manager grants the final campus onboarding approval. */
export function canFinalizeOnboarding(actor: OnboardingActor, campusId: string) {
  return actor.role === 'Campus manager' && hasCampus(actor, campusId);
}
export function canReadOnboardingFile(actor: OnboardingActor, campusId: string, group: OnboardingFileGroup) {
  if (!hasCampus(actor, campusId)) return false;
  if (group === 'personnel') return canReviewOnboarding(actor, campusId);
  // No implicit payroll, SSN, bank or I-9 access for campus managers or owners.
  return actor.hasRestrictedHrAccess === true &&
    ['Owner','Regional admin','Campus manager','Admin assistant'].includes(actor.role);
}
export function allowedOnboardingTransition(from: OnboardingStatus, to: OnboardingStatus, actor: 'employee' | 'reviewer' | 'manager') {
  if (from === 'Cancelled' || from === 'Complete' || from === to) return false;
  if (to === 'Cancelled') return actor === 'manager';
  const transitions: Record<OnboardingStatus, Partial<Record<typeof actor, OnboardingStatus[]>>> = {
    'Draft': {manager:['Invited']},
    'Invited': {employee:['In progress'], manager:['Draft']},
    'In progress': {employee:['Employee submitted']},
    'Employee submitted': {reviewer:['HR review','Corrections requested']},
    'Corrections requested': {employee:['In progress']},
    'HR review': {reviewer:['HR verified','Corrections requested']},
    'HR verified': {manager:['Complete'], reviewer:['Corrections requested']},
    'Complete': {},
    'Cancelled': {}
  };
  return !!transitions[from]?.[actor]?.includes(to);
}
export type OnboardingGate = {
  acceptedOffer: boolean;
  employeeSubmitted: boolean;
  hrVerified: boolean;
  i9Section1Completed: boolean;
  i9Section2EmployerVerified: boolean;
  signingComplianceApproved: boolean;
  secureFilesApproved: boolean;
  encryptionRecoveryVerified: boolean;
  isolatedRestoreTestPassed: boolean;
  restrictedAccessTestPassed: boolean;
  managerFinalApproval: boolean;
};
/** None of these checks may be inferred from merely having uploaded a PDF. */
export function onboardingCompletionBlockers(gate: OnboardingGate): string[] {
  const checks: Array<[keyof OnboardingGate, string]> = [
    ['acceptedOffer','Accepted offer'],
    ['employeeSubmitted','Employee submission'],
    ['hrVerified','Authorized HR review'],
    ['i9Section1Completed','Employee I-9 Section 1'],
    ['i9Section2EmployerVerified','Employer I-9 Section 2'],
    ['signingComplianceApproved','Electronic signing compliance'],
    ['secureFilesApproved','Approved confidential file storage'],
    ['encryptionRecoveryVerified','Encryption key recovery'],
    ['isolatedRestoreTestPassed','Independent backup restore'],
    ['restrictedAccessTestPassed','Restricted HR/payroll access tests'],
    ['managerFinalApproval','Campus manager final approval']
  ];
  return checks.filter(([field]) => gate[field] !== true).map(([,label])=>label);
}
export function onboardingProductionEnabled(config: {
  onboardingEnabled?: string; fileUploadsEnabled?: string; acceptanceApproved?: string;
}) {
  return config.onboardingEnabled === 'true' &&
    config.fileUploadsEnabled === 'true' &&
    config.acceptanceApproved === 'true';
}
