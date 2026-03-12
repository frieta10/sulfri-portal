/**
 * Proposal PDF Component - CR-04 Module C
 * 
 * Generates a comprehensive training proposal PDF.
 * Includes cover page, executive overview, training programme details,
 * trainer profile, certifications, delivery options, pricing, and next steps.
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

// ============================================
// Types
// ============================================

export interface ProposalCertification {
  id: string;
  title: string;
  issuer: string;
  issueDate?: Date;
}

export interface ProposalExpertise {
  id: string;
  title: string;
  description?: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  duration: string;
  description: string;
}

export interface DeliveryOption {
  mode: 'ONLINE' | 'PHYSICAL' | 'HYBRID';
  description: string;
  features: string[];
}

export interface PricingTier {
  name: string;
  priceRange: string;
  description: string;
  includes: string[];
}

export interface ProposalData {
  // Client & Proposal Info
  proposalId: string;
  clientName: string;
  organisation: string;
  preparedFor: string;
  proposalDate: Date;
  validUntil: Date;
  
  // Training Details
  trainingTopic: string;
  trainingObjective?: string;
  targetAudience?: string;
  groupSize: string;
  preferredDuration?: string;
  
  // Trainer Info
  trainerName: string;
  trainerHeadline?: string;
  trainerPhotoUrl?: string;
  trainerBio?: string;
  
  // Content Sections
  executiveSummary?: string;
  trainingModules: TrainingModule[];
  deliveryOptions: DeliveryOption[];
  certifications: ProposalCertification[];
  expertise: ProposalExpertise[];
  
  // Pricing
  pricingTiers: PricingTier[];
  additionalNotes?: string;
  
  // Contact
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
}

// ============================================
// Styles - MSH Branding
// ============================================

const COLORS = {
  // Primary blues
  primary: '#0f172a',
  primaryDark: '#020617',
  primaryLight: '#1e293b',
  
  // Green accent
  accent: '#22c55e',
  accentDark: '#16a34a',
  accentLight: '#4ade80',
  accentBg: '#dcfce7',
  
  // Neutrals
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
};

const styles = StyleSheet.create({
  // Page Base
  page: {
    flexDirection: 'column',
    backgroundColor: COLORS.white,
    padding: 0,
    fontFamily: 'Helvetica',
  },
  
  // ============================================
  // Cover Page Styles
  // ============================================
  coverPage: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 60,
    justifyContent: 'space-between',
  },
  coverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverLogo: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  coverLogoAccent: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.accent,
  },
  coverContent: {
    flex: 1,
    justifyContent: 'center',
  },
  coverLabel: {
    fontSize: 12,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    marginBottom: 24,
    lineHeight: 1.3,
  },
  coverClient: {
    fontSize: 18,
    color: COLORS.gray300,
    marginBottom: 8,
  },
  coverPreparedFor: {
    fontSize: 14,
    color: COLORS.gray400,
    marginBottom: 40,
  },
  coverMeta: {
    flexDirection: 'row',
    gap: 40,
  },
  coverMetaItem: {
    flexDirection: 'column',
  },
  coverMetaLabel: {
    fontSize: 9,
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  coverMetaValue: {
    fontSize: 12,
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
  },
  coverFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray700,
    borderTopStyle: 'solid',
    paddingTop: 20,
  },
  coverFooterText: {
    fontSize: 10,
    color: COLORS.gray400,
  },
  coverFooterAccent: {
    fontSize: 10,
    color: COLORS.accent,
  },
  
  // ============================================
  // Section Page Styles
  // ============================================
  sectionPage: {
    padding: 50,
    paddingTop: 40,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    borderBottomStyle: 'solid',
  },
  pageHeaderTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  pageHeaderSubtitle: {
    fontSize: 9,
    color: COLORS.gray400,
  },
  
  // Section Headers
  sectionHeading: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 16,
    marginTop: 8,
  },
  subsectionHeading: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray700,
    marginBottom: 8,
    marginTop: 16,
  },
  
  // Text Styles
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.gray600,
    marginBottom: 12,
    textAlign: 'justify',
  },
  highlightBox: {
    backgroundColor: COLORS.accentBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    borderLeftStyle: 'solid',
    padding: 16,
    marginVertical: 16,
  },
  highlightText: {
    fontSize: 11,
    color: COLORS.gray700,
    fontFamily: 'Helvetica-Oblique',
    lineHeight: 1.5,
  },
  
  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginVertical: 16,
  },
  infoItem: {
    width: '47%',
    backgroundColor: COLORS.gray50,
    padding: 12,
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    color: COLORS.gray800,
    fontFamily: 'Helvetica-Bold',
  },
  
  // Training Modules
  moduleCard: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    flex: 1,
  },
  moduleDuration: {
    fontSize: 9,
    color: COLORS.accentDark,
    backgroundColor: COLORS.accentBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  moduleDescription: {
    fontSize: 10,
    color: COLORS.gray600,
    lineHeight: 1.5,
  },
  
  // Delivery Options
  deliveryCard: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryBadge: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 3,
    marginRight: 10,
    textTransform: 'uppercase',
  },
  deliveryTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray800,
  },
  deliveryDescription: {
    fontSize: 10,
    color: COLORS.gray600,
    marginBottom: 8,
    lineHeight: 1.5,
  },
  featureList: {
    marginLeft: 8,
  },
  featureItem: {
    fontSize: 9,
    color: COLORS.gray500,
    marginBottom: 2,
  },
  
  // Trainer Profile Section
  trainerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray50,
    borderRadius: 4,
    padding: 20,
    marginVertical: 16,
  },
  trainerPhotoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    marginRight: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  trainerPhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  trainerPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainerPhotoPlaceholderText: {
    fontSize: 24,
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  trainerHeadline: {
    fontSize: 11,
    color: COLORS.accentDark,
    fontFamily: 'Helvetica-Oblique',
    marginBottom: 8,
  },
  trainerBio: {
    fontSize: 9,
    color: COLORS.gray600,
    lineHeight: 1.5,
  },
  
  // Certifications List
  certGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  certCard: {
    width: '48%',
    backgroundColor: COLORS.gray50,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    borderLeftStyle: 'solid',
    padding: 10,
    marginBottom: 6,
  },
  certTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray800,
    marginBottom: 2,
  },
  certIssuer: {
    fontSize: 8,
    color: COLORS.gray500,
  },
  
  // Pricing Section
  pricingGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  pricingCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 16,
  },
  pricingCardFeatured: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 16,
    backgroundColor: COLORS.accentBg,
  },
  pricingName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  pricingRange: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  pricingDescription: {
    fontSize: 9,
    color: COLORS.gray500,
    marginBottom: 12,
    lineHeight: 1.4,
  },
  pricingIncludes: {
    fontSize: 8,
    color: COLORS.gray600,
    marginBottom: 2,
  },
  
  // Timeline
  timeline: {
    marginVertical: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineNumber: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray800,
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 9,
    color: COLORS.gray500,
    lineHeight: 1.4,
  },
  
  // Next Steps & Contact
  contactSection: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    padding: 24,
    marginTop: 20,
  },
  contactTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 30,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 9,
    color: COLORS.gray400,
    marginRight: 8,
  },
  contactValue: {
    fontSize: 10,
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    borderTopStyle: 'solid',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.gray400,
  },
  footerPage: {
    fontSize: 8,
    color: COLORS.gray400,
  },
  
  // Two Column Layout
  twoColumn: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
});

// ============================================
// Helper Components
// ============================================

interface TrainerPhotoProps {
  photoUrl?: string;
  trainerName: string;
}

const TrainerPhoto: React.FC<TrainerPhotoProps> = ({ photoUrl, trainerName }) => {
  const initials = trainerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (!photoUrl) {
    return (
      <View style={styles.trainerPhotoContainer}>
        <View style={styles.trainerPhotoPlaceholder}>
          <Text style={styles.trainerPhotoPlaceholderText}>{initials}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.trainerPhotoContainer}>
      <Image src={photoUrl} style={styles.trainerPhoto} />
    </View>
  );
};

interface PageHeaderProps {
  title: string;
  proposalId: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, proposalId }) => (
  <View style={styles.pageHeader}>
    <Text style={styles.pageHeaderTitle}>{title}</Text>
    <Text style={styles.pageHeaderSubtitle}>Proposal #{proposalId}</Text>
  </View>
);

// ============================================
// Main Document Component
// ============================================

export interface ProposalPdfDocumentProps {
  data: ProposalData;
}

export const ProposalPdfDocument: React.FC<ProposalPdfDocumentProps> = ({ data }) => {
  const {
    proposalId,
    clientName,
    organisation,
    preparedFor,
    proposalDate,
    validUntil,
    trainingTopic,
    trainingObjective,
    targetAudience,
    groupSize,
    preferredDuration,
    trainerName,
    trainerHeadline,
    trainerPhotoUrl,
    trainerBio,
    executiveSummary,
    trainingModules,
    deliveryOptions,
    certifications,
    expertise,
    pricingTiers,
    additionalNotes,
    contactEmail,
    contactPhone,
    contactWhatsapp,
  } = data;

  // Format dates
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <Document
      title={`Training Proposal - ${clientName}`}
      author="MSH Training"
      subject={`${trainingTopic} - Training Proposal`}
      keywords="training, proposal, corporate, professional development"
      creator="MSH Trainer Portal"
      producer="@react-pdf/renderer"
    >
      {/* ============================================
          PAGE 1: Cover Page
      ============================================ */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverHeader}>
          <Text style={styles.coverLogo}>MSH</Text>
          <Text style={styles.coverLogoAccent}>.</Text>
        </View>

        <View style={styles.coverContent}>
          <Text style={styles.coverLabel}>Training Proposal</Text>
          <Text style={styles.coverTitle}>{trainingTopic}</Text>
          <Text style={styles.coverClient}>{organisation}</Text>
          <Text style={styles.coverPreparedFor}>Prepared for: {preparedFor || clientName}</Text>
          
          <View style={styles.coverMeta}>
            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Proposal Date</Text>
              <Text style={styles.coverMetaValue}>{formatDate(proposalDate)}</Text>
            </View>
            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Valid Until</Text>
              <Text style={styles.coverMetaValue}>{formatDate(validUntil)}</Text>
            </View>
            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>Proposal #</Text>
              <Text style={styles.coverMetaValue}>{proposalId}</Text>
            </View>
          </View>
        </View>

        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>
            {trainerName} • Professional Corporate Trainer
          </Text>
          <Text style={styles.coverFooterAccent}>www.msh.training</Text>
        </View>
      </Page>

      {/* ============================================
          PAGE 2: Executive Overview & Training Programme
      ============================================ */}
      <Page size="A4" style={styles.sectionPage}>
        <PageHeader title="Executive Overview" proposalId={proposalId} />
        
        {executiveSummary ? (
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>{executiveSummary}</Text>
          </View>
        ) : (
          <Text style={styles.paragraph}>
            Thank you for considering MSH Training for your professional development needs. 
            This proposal outlines a comprehensive training programme designed specifically for {organisation}, 
            focusing on {trainingTopic.toLowerCase()}. Our approach combines industry best practices with 
            interactive learning methodologies to ensure maximum knowledge retention and practical application.
          </Text>
        )}

        <Text style={styles.sectionHeading}>Programme Details</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Training Topic</Text>
            <Text style={styles.infoValue}>{trainingTopic}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Target Group Size</Text>
            <Text style={styles.infoValue}>{groupSize}</Text>
          </View>
          {targetAudience && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Target Audience</Text>
              <Text style={styles.infoValue}>{targetAudience}</Text>
            </View>
          )}
          {preferredDuration && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{preferredDuration}</Text>
            </View>
          )}
        </View>

        {trainingObjective && (
          <>
            <Text style={styles.subsectionHeading}>Training Objectives</Text>
            <Text style={styles.paragraph}>{trainingObjective}</Text>
          </>
        )}

        <Text style={styles.sectionHeading}>Proposed Training Modules</Text>
        
        {trainingModules.map((module, index) => (
          <View key={module.id} style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleTitle}>
                {index + 1}. {module.title}
              </Text>
              <Text style={styles.moduleDuration}>{module.duration}</Text>
            </View>
            <Text style={styles.moduleDescription}>{module.description}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>MSH Training • Professional Corporate Training</Text>
          <Text style={styles.footerPage}>Page 2</Text>
        </View>
      </Page>

      {/* ============================================
          PAGE 3: Trainer Profile & Certifications
      ============================================ */}
      <Page size="A4" style={styles.sectionPage}>
        <PageHeader title="About Your Trainer" proposalId={proposalId} />

        <View style={styles.trainerCard}>
          <TrainerPhoto photoUrl={trainerPhotoUrl} trainerName={trainerName} />
          <View style={styles.trainerInfo}>
            <Text style={styles.trainerName}>{trainerName}</Text>
            {trainerHeadline && (
              <Text style={styles.trainerHeadline}>{trainerHeadline}</Text>
            )}
            {trainerBio && <Text style={styles.trainerBio}>{trainerBio}</Text>}
          </View>
        </View>

        {expertise.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Areas of Expertise</Text>
            <View style={styles.infoGrid}>
              {expertise.map((item) => (
                <View key={item.id} style={styles.infoItem}>
                  <Text style={styles.infoValue}>{item.title}</Text>
                  {item.description && (
                    <Text style={{ fontSize: 8, color: COLORS.gray500, marginTop: 2 }}>
                      {item.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {certifications.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Professional Certifications</Text>
            <View style={styles.certGrid}>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certCard}>
                  <Text style={styles.certTitle}>{cert.title}</Text>
                  <Text style={styles.certIssuer}>{cert.issuer}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>MSH Training • Professional Corporate Training</Text>
          <Text style={styles.footerPage}>Page 3</Text>
        </View>
      </Page>

      {/* ============================================
          PAGE 4: Delivery Options & Timeline
      ============================================ */}
      <Page size="A4" style={styles.sectionPage}>
        <PageHeader title="Delivery Options & Timeline" proposalId={proposalId} />

        <Text style={styles.sectionHeading}>Delivery Modes Available</Text>
        
        {deliveryOptions.map((option, index) => (
          <View key={index} style={styles.deliveryCard}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryBadge}>{option.mode}</Text>
            </View>
            <Text style={styles.deliveryDescription}>{option.description}</Text>
            <View style={styles.featureList}>
              {option.features.map((feature, fIndex) => (
                <Text key={fIndex} style={styles.featureItem}>• {feature}</Text>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.sectionHeading}>Proposed Timeline</Text>
        
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineMarker}>
              <Text style={styles.timelineNumber}>1</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Confirmation & Agreement</Text>
              <Text style={styles.timelineDescription}>
                Review and sign the training agreement. Confirm dates, venue, and participant details.
              </Text>
            </View>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineMarker}>
              <Text style={styles.timelineNumber}>2</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Pre-Training Assessment</Text>
              <Text style={styles.timelineDescription}>
                Conduct needs assessment and customise training materials to your specific requirements.
              </Text>
            </View>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineMarker}>
              <Text style={styles.timelineNumber}>3</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Training Delivery</Text>
              <Text style={styles.timelineDescription}>
                Execute the training programme with interactive sessions, case studies, and hands-on activities.
              </Text>
            </View>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineMarker}>
              <Text style={styles.timelineNumber}>4</Text>
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Post-Training Support</Text>
              <Text style={styles.timelineDescription}>
                Provide post-training resources, evaluation reports, and follow-up consultation as needed.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>MSH Training • Professional Corporate Training</Text>
          <Text style={styles.footerPage}>Page 4</Text>
        </View>
      </Page>

      {/* ============================================
          PAGE 5: Investment & Next Steps
      ============================================ */}
      <Page size="A4" style={styles.sectionPage}>
        <PageHeader title="Investment & Next Steps" proposalId={proposalId} />

        <Text style={styles.sectionHeading}>Pricing Overview</Text>
        <Text style={styles.paragraph}>
          The following pricing tiers are tailored based on your group size and delivery preferences. 
          All prices are quoted in Malaysian Ringgit (MYR) and are subject to prevailing tax regulations.
        </Text>

        <View style={styles.pricingGrid}>
          {pricingTiers.map((tier, index) => (
            <View
              key={index}
              style={index === 1 ? styles.pricingCardFeatured : styles.pricingCard}
            >
              <Text style={styles.pricingName}>{tier.name}</Text>
              <Text style={styles.pricingRange}>{tier.priceRange}</Text>
              <Text style={styles.pricingDescription}>{tier.description}</Text>
              {tier.includes.map((item, iIndex) => (
                <Text key={iIndex} style={styles.pricingIncludes}>✓ {item}</Text>
              ))}
            </View>
          ))}
        </View>

        {additionalNotes && (
          <>
            <Text style={styles.subsectionHeading}>Additional Notes</Text>
            <Text style={styles.paragraph}>{additionalNotes}</Text>
          </>
        )}

        <Text style={styles.sectionHeading}>Next Steps</Text>
        <Text style={styles.paragraph}>
          To proceed with this training programme, please review the proposal and contact us to discuss 
          any customisations or questions you may have. We are committed to delivering a training experience 
          that exceeds your expectations and drives tangible results for your organisation.
        </Text>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contact Information</Text>
          <View style={styles.contactGrid}>
            {contactEmail && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Email:</Text>
                <Text style={styles.contactValue}>{contactEmail}</Text>
              </View>
            )}
            {contactPhone && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Phone:</Text>
                <Text style={styles.contactValue}>{contactPhone}</Text>
              </View>
            )}
            {contactWhatsapp && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>WhatsApp:</Text>
                <Text style={styles.contactValue}>{contactWhatsapp}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ marginTop: 30, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: COLORS.gray500, fontFamily: 'Helvetica-Oblique' }}>
            We look forward to partnering with {organisation} on this journey of professional excellence.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>MSH Training • Professional Corporate Training</Text>
          <Text style={styles.footerPage}>Page 5</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProposalPdfDocument;
