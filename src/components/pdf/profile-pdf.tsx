/**
 * Profile PDF Component - CR-04 Module A
 * 
 * Generates a 1-page executive summary PDF for trainer profile download.
 * Uses @react-pdf/renderer for PDF generation.
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// ============================================
// Types
// ============================================

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issueDate?: Date;
}

export interface ExpertiseArea {
  id: string;
  title: string;
  description?: string;
}

export interface ClientOrg {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface ProfilePdfData {
  trainerName: string;
  headline?: string;
  profilePhotoUrl?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  bio?: string;
  topCertifications: Certification[];
  coreExpertise: ExpertiseArea[];
  clientOrganizations: ClientOrg[];
  generatedAt?: Date;
}

// ============================================
// Styles - MSH Branding
// ============================================

const MSH_COLORS = {
  // Primary blue (mapped from slate-900)
  primary: '#0f172a',
  primaryDark: '#020617',
  primaryLight: '#1e293b',
  
  // Green accent (from theme)
  accent: '#22c55e',
  accentDark: '#16a34a',
  accentLight: '#4ade80',
  
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
  // Page Layout
  page: {
    flexDirection: 'column',
    backgroundColor: MSH_COLORS.white,
    padding: 0,
    fontFamily: 'Helvetica',
  },
  
  // Header Section with Logo
  header: {
    backgroundColor: MSH_COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: MSH_COLORS.white,
    letterSpacing: 1,
  },
  logoAccent: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: MSH_COLORS.accent,
  },
  documentLabel: {
    fontSize: 10,
    color: MSH_COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  
  // Main Content Area
  content: {
    flex: 1,
    padding: 40,
    flexDirection: 'row',
  },
  
  // Left Column (Profile)
  leftColumn: {
    width: '35%',
    paddingRight: 24,
    borderRightWidth: 1,
    borderRightColor: MSH_COLORS.gray200,
    borderRightStyle: 'solid',
  },
  
  // Right Column (Details)
  rightColumn: {
    width: '65%',
    paddingLeft: 24,
  },
  
  // Profile Photo
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: MSH_COLORS.gray100,
    marginBottom: 16,
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: MSH_COLORS.accent,
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: MSH_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 36,
    color: MSH_COLORS.white,
    fontFamily: 'Helvetica-Bold',
  },
  
  // Contact Section
  contactSection: {
    marginTop: 16,
  },
  contactTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: MSH_COLORS.accentDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  contactItem: {
    fontSize: 9,
    color: MSH_COLORS.gray600,
    marginBottom: 4,
  },
  contactLabel: {
    fontFamily: 'Helvetica-Bold',
    color: MSH_COLORS.gray700,
  },
  
  // Section Headers
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: MSH_COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: MSH_COLORS.accent,
    borderBottomStyle: 'solid',
  },
  
  // Name and Headline
  name: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: MSH_COLORS.primary,
    marginBottom: 8,
  },
  headline: {
    fontSize: 14,
    color: MSH_COLORS.accentDark,
    fontFamily: 'Helvetica-Oblique',
    marginBottom: 16,
  },
  
  // Bio
  bio: {
    fontSize: 10,
    lineHeight: 1.6,
    color: MSH_COLORS.gray600,
    marginBottom: 20,
    textAlign: 'justify',
  },
  
  // Certifications
  certificationsList: {
    marginBottom: 20,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: MSH_COLORS.accent,
    borderLeftStyle: 'solid',
  },
  certNumber: {
    width: 20,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: MSH_COLORS.accentDark,
  },
  certContent: {
    flex: 1,
  },
  certTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: MSH_COLORS.gray800,
    marginBottom: 2,
  },
  certIssuer: {
    fontSize: 9,
    color: MSH_COLORS.gray500,
  },
  
  // Expertise Areas
  expertiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  expertiseItem: {
    backgroundColor: MSH_COLORS.gray50,
    borderWidth: 1,
    borderColor: MSH_COLORS.gray200,
    borderStyle: 'solid',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  expertiseText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: MSH_COLORS.gray700,
  },
  
  // Client Organizations
  clientsSection: {
    marginBottom: 16,
  },
  clientsHeader: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: MSH_COLORS.gray600,
    marginBottom: 8,
  },
  clientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  clientItem: {
    fontSize: 8,
    color: MSH_COLORS.gray500,
    backgroundColor: MSH_COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  
  // Footer
  footer: {
    backgroundColor: MSH_COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: MSH_COLORS.gray400,
  },
  footerAccent: {
    fontSize: 8,
    color: MSH_COLORS.accent,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: MSH_COLORS.gray200,
    marginVertical: 16,
  },
  
  // Accent Bar
  accentBar: {
    height: 4,
    backgroundColor: MSH_COLORS.accent,
  },
});

// ============================================
// Components
// ============================================

interface ProfilePhotoProps {
  photoUrl?: string;
  trainerName: string;
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({ photoUrl, trainerName }) => {
  const initials = trainerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (!photoUrl) {
    return (
      <View style={styles.photoContainer}>
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>{initials}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.photoContainer}>
      <Image src={photoUrl} style={styles.photo} />
    </View>
  );
};

interface CertificationItemProps {
  cert: Certification;
  index: number;
}

const CertificationItem: React.FC<CertificationItemProps> = ({ cert, index }) => (
  <View style={styles.certItem}>
    <Text style={styles.certNumber}>{index + 1}.</Text>
    <View style={styles.certContent}>
      <Text style={styles.certTitle}>{cert.title}</Text>
      <Text style={styles.certIssuer}>{cert.issuer}</Text>
    </View>
  </View>
);

interface ContactInfoProps {
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
}

const ContactInfo: React.FC<ContactInfoProps> = ({
  email,
  phone,
  location,
  linkedinUrl,
}) => (
  <View style={styles.contactSection}>
    <Text style={styles.contactTitle}>Contact</Text>
    {email && (
      <Text style={styles.contactItem}>
        <Text style={styles.contactLabel}>Email: </Text>
        {email}
      </Text>
    )}
    {phone && (
      <Text style={styles.contactItem}>
        <Text style={styles.contactLabel}>Phone: </Text>
        {phone}
      </Text>
    )}
    {location && (
      <Text style={styles.contactItem}>
        <Text style={styles.contactLabel}>Location: </Text>
        {location}
      </Text>
    )}
    {linkedinUrl && (
      <Text style={styles.contactItem}>
        <Text style={styles.contactLabel}>LinkedIn: </Text>
        linkedin.com/in/...
      </Text>
    )}
  </View>
);

// ============================================
// Main Document Component
// ============================================

export interface ProfilePdfDocumentProps {
  data: ProfilePdfData;
}

export const ProfilePdfDocument: React.FC<ProfilePdfDocumentProps> = ({ data }) => {
  const {
    trainerName,
    headline,
    profilePhotoUrl,
    email,
    phone,
    location,
    linkedinUrl,
    bio,
    topCertifications,
    coreExpertise,
    clientOrganizations,
    generatedAt = new Date(),
  } = data;

  // Limit to top 5 certifications
  const certifications = topCertifications.slice(0, 5);
  
  // Limit expertise areas
  const expertise = coreExpertise.slice(0, 6);
  
  // Limit client orgs for display
  const clients = clientOrganizations.slice(0, 10);

  return (
    <Document
      title={`${trainerName} - Professional Profile`}
      author="MSH Training"
      subject="Trainer Executive Summary"
      keywords="training, corporate, professional, certification"
      creator="MSH Trainer Portal"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page}>
        {/* Accent Bar */}
        <View style={styles.accentBar} />
        
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>MSH</Text>
            <Text style={styles.logoAccent}>.</Text>
          </View>
          <Text style={styles.documentLabel}>Executive Profile</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            <ProfilePhoto photoUrl={profilePhotoUrl} trainerName={trainerName} />
            
            <ContactInfo
              email={email}
              phone={phone}
              location={location}
              linkedinUrl={linkedinUrl}
            />
            
            {expertise.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.contactTitle}>Expertise</Text>
                <View style={styles.expertiseGrid}>
                  {expertise.map((item) => (
                    <View key={item.id} style={styles.expertiseItem}>
                      <Text style={styles.expertiseText}>{item.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            <Text style={styles.name}>{trainerName}</Text>
            {headline && <Text style={styles.headline}>{headline}</Text>}
            
            {bio && <Text style={styles.bio}>{bio}</Text>}
            
            <View style={styles.divider} />
            
            {certifications.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Top Certifications</Text>
                <View style={styles.certificationsList}>
                  {certifications.map((cert, index) => (
                    <CertificationItem key={cert.id} cert={cert} index={index} />
                  ))}
                </View>
              </>
            )}
            
            {clients.length > 0 && (
              <View style={styles.clientsSection}>
                <Text style={styles.sectionTitle}>Trusted By</Text>
                <Text style={styles.clientsHeader}>
                  Organizations that have benefited from our training programmes:
                </Text>
                <View style={styles.clientsList}>
                  {clients.map((client) => (
                    <Text key={client.id} style={styles.clientItem}>
                      {client.name}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {generatedAt.toLocaleDateString('en-MY', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.footerAccent}>www.msh.training</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProfilePdfDocument;
