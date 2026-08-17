export type ApplicationStatusCode =
  | 'draft'
  | 'submitted'
  | 'initial_review'
  | 'information_required'
  | 'document_verification'
  | 'eligibility_review'
  | 'ready_for_committee'
  | 'committee_review'
  | 'pending'
  | 'approved'
  | 'not_approved'
  | 'withdrawn'
  | 'closed'

export type UserRoleCode =
  'applicant' | 'grants_officer' | 'committee_member' | 'administrator'
