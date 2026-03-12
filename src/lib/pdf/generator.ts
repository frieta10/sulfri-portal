/**
 * PDF Generator Utility - CR-04 Module A & C
 * 
 * Utility functions for generating PDFs using @react-pdf/renderer.
 * Provides server-side PDF generation for profile downloads and proposals.
 */

import { renderToBuffer, renderToStream } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import React from 'react';

import {
  ProfilePdfDocument,
  ProposalPdfDocument,
  type ProfilePdfData,
  type ProposalData,
} from '@/components/pdf';

// ============================================
// Types
// ============================================

export interface PdfGenerationOptions {
  /** Whether to return as buffer (default) or stream */
  asStream?: boolean;
}

export interface PdfGenerationResult {
  /** The generated PDF as a Buffer */
  buffer: Buffer;
  /** Content type header value */
  contentType: string;
  /** Suggested filename for download */
  filename: string;
  /** File size in bytes */
  size: number;
}

// ============================================
// Profile PDF Generation
// ============================================

/**
 * Generates a trainer profile PDF (executive summary).
 * 
 * @param data - Profile data including trainer info, certifications, expertise, and clients
 * @returns PDF generation result with buffer and metadata
 * 
 * @example
 * ```typescript
 * const result = await generateProfilePdf({
 *   trainerName: 'John Doe',
 *   headline: 'Senior Corporate Trainer',
 *   email: 'john@msh.training',
 *   topCertifications: [...],
 *   coreExpertise: [...],
 *   clientOrganizations: [...],
 * });
 * 
 * // Use with Next.js Response
 * return new Response(result.buffer, {
 *   headers: {
 *     'Content-Type': result.contentType,
 *     'Content-Disposition': `attachment; filename="${result.filename}"`,
 *   },
 * });
 * ```
 */
export async function generateProfilePdf(
  data: ProfilePdfData
): Promise<PdfGenerationResult> {
  const element = React.createElement(ProfilePdfDocument, { data }) as unknown as ReactElement;
  const buffer = await renderToBuffer(element);
  
  // Generate filename
  const sanitizedName = data.trainerName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  
  return {
    buffer,
    contentType: 'application/pdf',
    filename: `profile-${sanitizedName}-${dateStr}.pdf`,
    size: buffer.length,
  };
}

/**
 * Generates a profile PDF and returns as a readable stream.
 * Useful for streaming large PDFs directly to the client.
 * 
 * @param data - Profile data
 * @returns Node.js readable stream
 */
export async function generateProfilePdfStream(
  data: ProfilePdfData
): Promise<NodeJS.ReadableStream> {
  const element = React.createElement(ProfilePdfDocument, { data }) as unknown as ReactElement;
  return renderToStream(element);
}

// ============================================
// Proposal PDF Generation
// ============================================

/**
 * Generates a training proposal PDF.
 * 
 * @param data - Complete proposal data including client info, training details, pricing
 * @returns PDF generation result with buffer and metadata
 * 
 * @example
 * ```typescript
 * const result = await generateProposalPdf({
 *   proposalId: 'PROP-2024-001',
 *   clientName: 'ABC Corporation',
 *   organisation: 'ABC Corp Sdn Bhd',
 *   trainingTopic: 'Leadership Excellence',
 *   trainingModules: [...],
 *   deliveryOptions: [...],
 *   pricingTiers: [...],
 *   // ... other fields
 * });
 * 
 * // Save to storage or send via email
 * await uploadToStorage(result.buffer, result.filename);
 * ```
 */
export async function generateProposalPdf(
  data: ProposalData
): Promise<PdfGenerationResult> {
  const element = React.createElement(ProposalPdfDocument, { data }) as unknown as ReactElement;
  const buffer = await renderToBuffer(element);
  
  // Generate filename
  const sanitizedOrg = data.organisation
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 30);
  const dateStr = new Date().toISOString().split('T')[0];
  
  return {
    buffer,
    contentType: 'application/pdf',
    filename: `proposal-${sanitizedOrg}-${data.proposalId}-${dateStr}.pdf`,
    size: buffer.length,
  };
}

/**
 * Generates a proposal PDF and returns as a readable stream.
 * 
 * @param data - Proposal data
 * @returns Node.js readable stream
 */
export async function generateProposalPdfStream(
  data: ProposalData
): Promise<NodeJS.ReadableStream> {
  const element = React.createElement(ProposalPdfDocument, { data }) as unknown as ReactElement;
  return renderToStream(element);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Creates HTTP headers for PDF download response.
 * 
 * @param filename - The suggested filename for download
 * @param size - File size in bytes (optional)
 * @returns Headers object for Next.js Response
 */
export function createPdfDownloadHeaders(
  filename: string,
  size?: number
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
  };
  
  if (size !== undefined) {
    headers['Content-Length'] = String(size);
  }
  
  return headers;
}

/**
 * Creates HTTP headers for inline PDF viewing.
 * 
 * @param filename - The filename
 * @param size - File size in bytes (optional)
 * @returns Headers object
 */
export function createPdfViewHeaders(
  filename: string,
  size?: number
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${filename}"`,
  };
  
  if (size !== undefined) {
    headers['Content-Length'] = String(size);
  }
  
  return headers;
}

// ============================================
// Sample Data Generators (for testing)
// ============================================

/**
 * Returns sample profile data for testing PDF generation.
 */
export function getSampleProfileData(): ProfilePdfData {
  return {
    trainerName: 'Ahmad bin Abdullah',
    headline: 'Senior Corporate Trainer & Leadership Coach',
    profilePhotoUrl: undefined, // Will use placeholder
    email: 'ahmad@msh.training',
    phone: '+60 12-345 6789',
    location: 'Kuala Lumpur, Malaysia',
    linkedinUrl: 'https://linkedin.com/in/ahmadabdullah',
    bio: 'A seasoned corporate trainer with over 15 years of experience in leadership development, team building, and organizational transformation. Specialised in delivering high-impact training programmes for Fortune 500 companies across Southeast Asia. Certified in multiple internationally recognised frameworks and methodologies.',
    topCertifications: [
      { id: '1', title: 'Certified Professional Trainer (CPT)', issuer: 'International Training Board', issueDate: new Date('2020-03-15') },
      { id: '2', title: 'Leadership Excellence Certification', issuer: 'Center for Creative Leadership', issueDate: new Date('2021-06-20') },
      { id: '3', title: 'Advanced Facilitation Skills', issuer: 'Facilitation First', issueDate: new Date('2019-11-10') },
      { id: '4', title: 'Emotional Intelligence Practitioner', issuer: 'EQ-i 2.0', issueDate: new Date('2022-01-15') },
      { id: '5', title: 'Agile Leadership Certified', issuer: 'Scrum Alliance', issueDate: new Date('2021-09-05') },
    ],
    coreExpertise: [
      { id: '1', title: 'Leadership Development', description: 'Executive coaching and leadership programmes' },
      { id: '2', title: 'Team Building', description: 'High-performance team facilitation' },
      { id: '3', title: 'Change Management', description: 'Organizational transformation' },
      { id: '4', title: 'Communication Skills', description: 'Executive presence and influence' },
      { id: '5', title: 'Strategic Planning', description: 'Business strategy facilitation' },
    ],
    clientOrganizations: [
      { id: '1', name: 'Petronas' },
      { id: '2', name: 'Maybank' },
      { id: '3', name: 'CIMB Group' },
      { id: '4', name: 'Axiata' },
      { id: '5', name: 'AirAsia' },
      { id: '6', name: 'Sime Darby' },
      { id: '7', name: 'Tenaga Nasional' },
      { id: '8', name: 'Telekom Malaysia' },
    ],
    generatedAt: new Date(),
  };
}

/**
 * Returns sample proposal data for testing PDF generation.
 */
export function getSampleProposalData(): ProposalData {
  return {
    proposalId: 'PROP-2024-001',
    clientName: 'Sarah Chen',
    organisation: 'TechVentures Sdn Bhd',
    preparedFor: 'Sarah Chen, HR Director',
    proposalDate: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    trainingTopic: 'Leadership Excellence for Managers',
    trainingObjective: 'To equip managers with essential leadership skills including emotional intelligence, effective communication, conflict resolution, and team motivation strategies to drive organizational success.',
    targetAudience: 'Middle to Senior Managers',
    groupSize: 'Between 20-50',
    preferredDuration: '2 Days (16 hours)',
    trainerName: 'Ahmad bin Abdullah',
    trainerHeadline: 'Senior Corporate Trainer & Leadership Coach',
    trainerPhotoUrl: undefined,
    trainerBio: 'A seasoned corporate trainer with over 15 years of experience in leadership development and team building. Certified in multiple internationally recognised frameworks.',
    executiveSummary: 'This comprehensive 2-day Leadership Excellence programme is designed to transform your managers into inspirational leaders who can drive performance, foster innovation, and build high-performing teams. The programme combines cutting-edge leadership theory with practical, hands-on exercises tailored to your organizational context.',
    trainingModules: [
      { id: '1', title: 'Foundations of Modern Leadership', duration: '3 hours', description: 'Understanding leadership styles, emotional intelligence, and the transition from manager to leader.' },
      { id: '2', title: 'Effective Communication & Influence', duration: '4 hours', description: 'Mastering persuasive communication, active listening, and influencing techniques across organisational levels.' },
      { id: '3', title: 'Building & Leading High-Performance Teams', duration: '4 hours', description: 'Strategies for team formation, motivation, performance management, and creating a culture of excellence.' },
      { id: '4', title: 'Conflict Resolution & Difficult Conversations', duration: '3 hours', description: 'Frameworks for managing conflicts, delivering feedback, and navigating challenging interpersonal situations.' },
      { id: '5', title: 'Strategic Thinking & Decision Making', duration: '2 hours', description: 'Developing strategic mindset, data-driven decision making, and long-term planning capabilities.' },
    ],
    deliveryOptions: [
      {
        mode: 'PHYSICAL',
        description: 'In-person training at your premises or a venue of your choice.',
        features: [
          'Face-to-face interactive sessions',
          'Physical team-building activities',
          'Printed training materials',
          'On-site facilitation support',
        ],
      },
      {
        mode: 'ONLINE',
        description: 'Virtual training delivered via professional video conferencing platform.',
        features: [
          'Live interactive virtual sessions',
          'Digital breakout rooms',
          'Electronic materials and resources',
          'Session recordings for review',
        ],
      },
      {
        mode: 'HYBRID',
        description: 'Combination of in-person and virtual elements for maximum flexibility.',
        features: [
          'Blended learning approach',
          'Flexible attendance options',
          'Both physical and digital materials',
          'Best of both delivery methods',
        ],
      },
    ],
    certifications: [
      { id: '1', title: 'Certified Professional Trainer (CPT)', issuer: 'International Training Board' },
      { id: '2', title: 'Leadership Excellence Certification', issuer: 'Center for Creative Leadership' },
      { id: '3', title: 'Emotional Intelligence Practitioner', issuer: 'EQ-i 2.0' },
      { id: '4', title: 'Advanced Facilitation Skills', issuer: 'Facilitation First' },
    ],
    expertise: [
      { id: '1', title: 'Leadership Development' },
      { id: '2', title: 'Team Building & Facilitation' },
      { id: '3', title: 'Change Management' },
      { id: '4', title: 'Executive Coaching' },
    ],
    pricingTiers: [
      {
        name: 'Essential',
        priceRange: 'RM 15,000 - 20,000',
        description: 'Ideal for smaller groups up to 20 participants.',
        includes: [
          'Training delivery (2 days)',
          'Electronic training materials',
          'Certificate of completion',
          '1-hour post-training consultation',
        ],
      },
      {
        name: 'Professional',
        priceRange: 'RM 25,000 - 35,000',
        description: 'Comprehensive package for groups up to 40 participants.',
        includes: [
          'Everything in Essential',
          'Pre-training assessment',
          'Printed training materials',
          '3 months email support',
          'Training evaluation report',
        ],
      },
      {
        name: 'Enterprise',
        priceRange: 'Custom Quote',
        description: 'Tailored solution for larger organisations.',
        includes: [
          'Everything in Professional',
          'Customised content development',
          'Executive coaching sessions',
          '6 months ongoing support',
          'Train-the-trainer option',
        ],
      },
    ],
    additionalNotes: 'All prices are quoted in Malaysian Ringgit (MYR) and are exclusive of applicable taxes. Travel and accommodation expenses for outstation training will be charged separately. A 50% deposit is required upon confirmation, with the balance due upon completion of the training.',
    contactEmail: 'proposals@msh.training',
    contactPhone: '+60 3-1234 5678',
    contactWhatsapp: '+60 12-345 6789',
  };
}
