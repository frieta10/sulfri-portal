"use server"

import { Document, Page, Text, View, StyleSheet, renderToBuffer, Image } from "@react-pdf/renderer"

interface ProposalPDFData {
  id: string
  contactName: string
  organisation: string
  email: string
  phone: string
  industrySector: string | null
  topicInterest: string
  groupSize: string
  deliveryMode: string
  preferredTimeline: string | null
  additionalNotes: string | null
  submittedAt: Date
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    backgroundColor: "#0f172a",
    padding: 30,
    margin: -40,
    marginBottom: 30,
  },
  headerTitle: {
    color: "#22c55e",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: "#22c55e",
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    width: 150,
    fontSize: 10,
    color: "#64748b",
    fontWeight: "bold",
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: "#0f172a",
  },
  notes: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
    marginTop: 5,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
  },
  badge: {
    backgroundColor: "#22c55e",
    color: "#ffffff",
    padding: "4 12",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
    alignSelf: "flex-start",
  },
  infoBox: {
    backgroundColor: "#f0fdf4",
    padding: 15,
    borderRadius: 4,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
  },
  infoText: {
    fontSize: 10,
    color: "#166534",
    lineHeight: 1.5,
  },
})

// Helper functions for labels
function getGroupSizeLabel(size: string): string {
  const labels: Record<string, string> = {
    UNDER_20: "Less than 20 participants",
    BETWEEN_20_50: "20 - 50 participants",
    BETWEEN_50_100: "50 - 100 participants",
    OVER_100: "100+ participants",
  }
  return labels[size] || size
}

function getDeliveryModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    ONLINE: "Online / Virtual",
    PHYSICAL: "Physical / In-Person",
    HYBRID: "Hybrid (Online + Physical)",
  }
  return labels[mode] || mode
}

function getTimelineLabel(timeline: string | null): string {
  if (!timeline) return "Not specified"
  const labels: Record<string, string> = {
    ASAP: "ASAP (Urgent)",
    ONE_MONTH: "Within 1 month",
    THREE_MONTHS: "Within 3 months",
    FLEXIBLE: "Flexible / TBD",
  }
  return labels[timeline] || timeline
}

function getIndustryLabel(industry: string | null): string {
  if (!industry) return "Not specified"
  const labels: Record<string, string> = {
    TECHNOLOGY: "Technology & IT",
    FINANCE: "Finance & Banking",
    HEALTHCARE: "Healthcare & Pharmaceuticals",
    MANUFACTURING: "Manufacturing & Engineering",
    EDUCATION: "Education & Training",
    GOVERNMENT: "Government & Public Sector",
    RETAIL: "Retail & Consumer Goods",
    ENERGY: "Energy & Utilities",
    CONSTRUCTION: "Construction & Real Estate",
    CONSULTING: "Consulting & Professional Services",
    TELECOMMUNICATIONS: "Telecommunications",
    TRANSPORTATION: "Transportation & Logistics",
    MEDIA: "Media & Entertainment",
    NONPROFIT: "Nonprofit & NGO",
    OTHER: "Other",
  }
  return labels[industry] || industry
}

// Proposal PDF Document Component
function ProposalDocument({ data }: { data: ProposalPDFData }) {
  const formattedDate = new Date(data.submittedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MSH CORPORATE TRAINER</Text>
          <Text style={styles.headerSubtitle}>Training Proposal Request</Text>
        </View>

        {/* Reference Badge */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <View style={styles.badge}>
            <Text>REF: {data.id.slice(-8).toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 10, color: "#64748b" }}>{formattedDate}</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Contact Name:</Text>
            <Text style={styles.value}>{data.contactName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Organisation:</Text>
            <Text style={styles.value}>{data.organisation}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{data.phone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Industry/Sector:</Text>
            <Text style={styles.value}>{getIndustryLabel(data.industrySector)}</Text>
          </View>
        </View>

        {/* Training Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Requirements</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Training Topic:</Text>
            <Text style={styles.value}>{data.topicInterest}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Group Size:</Text>
            <Text style={styles.value}>{getGroupSizeLabel(data.groupSize)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Mode:</Text>
            <Text style={styles.value}>{getDeliveryModeLabel(data.deliveryMode)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Preferred Timeline:</Text>
            <Text style={styles.value}>{getTimelineLabel(data.preferredTimeline)}</Text>
          </View>
        </View>

        {/* Additional Notes */}
        {data.additionalNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.notes}>{data.additionalNotes}</Text>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Thank you for your interest in our training services. We will review your requirements and prepare a customized proposal within 1-2 business days. For urgent inquiries, please contact us directly via WhatsApp or email.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            MSH Corporate Trainer | HRD Corp Certified Trainer | msulfri@gmail.com | www.msh-trainer.com{"\n"}
            © {new Date().getFullYear()} All rights reserved.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// Generate PDF buffer
export async function generateProposalPDF(data: ProposalPDFData): Promise<Buffer> {
  const buffer = await renderToBuffer(<ProposalDocument data={data} />)
  return buffer
}
