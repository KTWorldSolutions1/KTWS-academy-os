/**
 * E restriction removal: supplemental manual-transmission training track.
 * This track is not initial Class A/B ELDT and does not award automatic
 * authority to drive a manual-transmission CMV on public roads.
 * DMV permit/test details must be individually verified before scheduling.
 */
export const E_RESTRICTION_PROGRAM = {
 code: 'CDL-E-REMOVAL',
 title: 'CDL E Restriction Removal — Manual Transmission',
 kind: 'restriction-removal',
 requiresExistingCdl: true,
 initialEldtRequired: false,
 classroomHoursTarget: null,
 standardFiveWeekCohort: false,
 prerequisites: [
  'Verify the student holds a current CDL and that its E restriction is recorded.',
  'Review CDL class, medical certification applicability and any other restrictions.',
  'Confirm with NCDMV the applicable permit or authorization, waiting period and modified skills test.',
  'Confirm a suitable manual-transmission vehicle, instructor and insurance coverage.'
 ],
 enrollmentDocuments: [
  'CDL copy and restriction verification',
  'Contact and emergency contact information',
  'Restriction-removal enrollment and tuition/refund agreement',
  'Training/safety and vehicle-use acknowledgments',
  'Permit or legal driving authorization verification',
  'Instructor evaluation and dated skills/training logs',
  'DMV appointment and final outcome evidence'
 ],
 skills: [
  {id:'clutch',name:'Clutch and starting control',phase:'Yard'},
  {id:'upshift',name:'Progressive upshifting',phase:'Yard'},
  {id:'downshift',name:'Downshifting and gear selection',phase:'Yard'},
  {id:'stop-start',name:'Controlled starts, stops and grades',phase:'Yard'},
  {id:'road',name:'Safe manual-transmission road operation',phase:'Road'},
  {id:'readiness',name:'Final evaluation for DMV test',phase:'Road'}
 ],
 completionRequirements: [
  'Actual instructor-verified practice and evaluation recorded',
  'Applicable DMV skills test passed',
  'Updated CDL or official DMV confirmation of E removal verified'
 ]
} as const;
export type ERestrictionRecord = {
 cdlVerified:boolean;
 hasERestriction:boolean;
 dmvRequirementsVerified:boolean;
 drivingAuthorized:boolean;
 manualVehicleReady:boolean;
 instructorAssigned:boolean;
 skillsCompleted:ReadonlyArray<string>;
 dmvTestPassed:boolean;
 updatedCdlVerified:boolean;
};
export function eRestrictionReadiness(student:ERestrictionRecord){
 const blockers:string[]=[];
 if(!student.cdlVerified||!student.hasERestriction)blockers.push('Verify current CDL and E restriction.');
 if(!student.dmvRequirementsVerified)blockers.push('Confirm exact NCDMV permit and testing rules.');
 if(!student.drivingAuthorized)blockers.push('Verify lawful authorization before any public-road manual CMV operation.');
 if(!student.manualVehicleReady)blockers.push('Assign a roadworthy and insured manual-transmission training vehicle.');
 if(!student.instructorAssigned)blockers.push('Assign a qualified instructor.');
 return {readyForPublicRoadTraining:blockers.length===0,blockers};
}
export function eRestrictionCompletion(student:ERestrictionRecord){
 const skills=E_RESTRICTION_PROGRAM.skills.map(x=>x.id);
 const missing=skills.filter(id=>!student.skillsCompleted.includes(id));
 return {complete:missing.length===0&&student.dmvTestPassed&&student.updatedCdlVerified,
 missingSkills:missing,dmvTestPassed:student.dmvTestPassed,updatedCdlVerified:student.updatedCdlVerified};
}
