import assert from 'node:assert/strict';
import {
  canReviewOnboarding, canFinalizeOnboarding, canReadOnboardingFile,
  allowedOnboardingTransition, onboardingCompletionBlockers, onboardingProductionEnabled,
  ONBOARDING_INVITATION_CHANNELS
} from '../lib/employee-onboarding-policy.ts';
const manager={role:'Campus manager',campusIds:['greensboro']};
const hr={role:'Admin assistant',campusIds:['greensboro'],hasRestrictedHrAccess:true};
const owner={role:'Owner',campusIds:[]};
assert.deepEqual(ONBOARDING_INVITATION_CHANNELS,['email','sms']);
assert.equal(canReviewOnboarding(manager,'greensboro'),true);
assert.equal(canReviewOnboarding(manager,'dallas'),false);
assert.equal(canReviewOnboarding(hr,'greensboro'),true);
assert.equal(canFinalizeOnboarding(manager,'greensboro'),true);
assert.equal(canFinalizeOnboarding(manager,'dallas'),false);
assert.equal(canFinalizeOnboarding(hr,'greensboro'),false);
assert.equal(canFinalizeOnboarding(owner,'greensboro'),false);
assert.equal(canReadOnboardingFile(manager,'greensboro','personnel'),true);
assert.equal(canReadOnboardingFile(manager,'greensboro','payroll'),false);
assert.equal(canReadOnboardingFile(manager,'greensboro','eligibility'),false);
assert.equal(canReadOnboardingFile(hr,'greensboro','payroll'),true);
assert.equal(canReadOnboardingFile(hr,'dallas','payroll'),false);
assert.equal(canReadOnboardingFile(owner,'greensboro','payroll'),false);
assert.equal(allowedOnboardingTransition('Draft','Invited','manager'),true);
assert.equal(allowedOnboardingTransition('Draft','Complete','manager'),false);
assert.equal(allowedOnboardingTransition('Employee submitted','HR verified','manager'),false);
assert.equal(allowedOnboardingTransition('HR verified','Complete','manager'),true);
assert.equal(allowedOnboardingTransition('HR verified','Complete','reviewer'),false);
assert.equal(onboardingProductionEnabled({onboardingEnabled:'true',fileUploadsEnabled:'true',acceptanceApproved:'true'}),true);
assert.equal(onboardingProductionEnabled({onboardingEnabled:'true',fileUploadsEnabled:'false',acceptanceApproved:'true'}),false);
const all={acceptedOffer:true,employeeSubmitted:true,hrVerified:true,i9Section1Completed:true,
i9Section2EmployerVerified:true,signingComplianceApproved:true,secureFilesApproved:true,
encryptionRecoveryVerified:true,isolatedRestoreTestPassed:true,restrictedAccessTestPassed:true,
managerFinalApproval:true};
assert.deepEqual(onboardingCompletionBlockers(all),[]);
assert.deepEqual(onboardingCompletionBlockers({...all,i9Section2EmployerVerified:false,managerFinalApproval:false}),[
  'Employer I-9 Section 2','Campus manager final approval'
]);
console.log('Employee onboarding security policy tests passed');
