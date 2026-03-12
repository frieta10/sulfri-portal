/**
 * PDF Components Index - CR-04 Module A & C
 * 
 * React PDF components for generating branded trainer profile PDFs and training proposals.
 */

// Profile PDF Components
export { 
  ProfilePdfDocument,
  type ProfilePdfData,
  type Certification,
  type ExpertiseArea,
  type ClientOrg,
} from './profile-pdf';

// Proposal PDF Components
export { 
  ProposalPdfDocument,
  type ProposalData,
  type ProposalCertification,
  type ProposalExpertise,
  type TrainingModule,
  type DeliveryOption,
  type PricingTier,
} from './proposal-pdf';
