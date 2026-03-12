/**
 * PDF Library Index
 * 
 * Server-side PDF generation utilities for trainer profiles and training proposals.
 */

export {
  // Generation functions
  generateProfilePdf,
  generateProfilePdfStream,
  generateProposalPdf,
  generateProposalPdfStream,
  
  // Helper functions
  createPdfDownloadHeaders,
  createPdfViewHeaders,
  
  // Sample data for testing
  getSampleProfileData,
  getSampleProposalData,
} from './generator';

export type {
  PdfGenerationOptions,
  PdfGenerationResult,
} from './generator';
