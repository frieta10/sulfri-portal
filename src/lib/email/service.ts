import { prisma } from "@/lib/prisma"

interface ProposalEmailData {
  proposal: {
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
  pdfUrl: string | null
}

interface EmailResult {
  success: boolean
  error?: string
}

// Get email configuration from environment
function getEmailConfig() {
  return {
    resendApiKey: process.env.RESEND_API_KEY || "",
    sendgridApiKey: process.env.SENDGRID_API_KEY || "",
    fromEmail: process.env.FROM_EMAIL || "noreply@msh-trainer.com",
    fromName: process.env.FROM_NAME || "MSH Corporate Trainer",
    adminEmail: process.env.ADMIN_EMAIL || "msulfri@gmail.com",
  }
}

// Send proposal-related emails
export async function sendProposalEmails(data: ProposalEmailData): Promise<{
  clientEmail: EmailResult
  adminEmail: EmailResult
}> {
  const [clientEmail, adminEmail] = await Promise.all([
    sendClientConfirmationEmail(data),
    sendAdminNotificationEmail(data),
  ])

  return { clientEmail, adminEmail }
}

// Send confirmation email to client
async function sendClientConfirmationEmail(data: ProposalEmailData): Promise<EmailResult> {
  const config = getEmailConfig()
  
  try {
    const settings = await prisma.portalSettings.findUnique({
      where: { id: "singleton" },
    })

    const subject = settings?.emailConfirmationSubject || "Thank you for your training inquiry"
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">MSH Corporate Trainer</h1>
          <p style="color: #94a3b8; margin: 10px 0 0 0;">Professional Training & Consulting</p>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #1e3a5f; margin-top: 0;">Hello ${data.proposal.contactName},</h2>
          
          <p style="color: #334155; line-height: 1.6;">
            Thank you for your interest in our training services. We have received your proposal request and will review it shortly.
          </p>
          
          <div style="background: #f8fafc; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e3a5f; margin-top: 0; font-size: 16px;">Your Request Summary:</h3>
            <table style="width: 100%; color: #334155;">
              <tr>
                <td style="padding: 5px 0; width: 40%;"><strong>Organisation:</strong></td>
                <td style="padding: 5px 0;">${data.proposal.organisation}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Training Topic:</strong></td>
                <td style="padding: 5px 0;">${data.proposal.topicInterest}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Group Size:</strong></td>
                <td style="padding: 5px 0;">${getGroupSizeLabel(data.proposal.groupSize)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Delivery Mode:</strong></td>
                <td style="padding: 5px 0;">${getDeliveryModeLabel(data.proposal.deliveryMode)}</td>
              </tr>
              ${data.proposal.preferredTimeline ? `
              <tr>
                <td style="padding: 5px 0;"><strong>Preferred Timeline:</strong></td>
                <td style="padding: 5px 0;">${getTimelineLabel(data.proposal.preferredTimeline)}</td>
              </tr>
              ` : ""}
            </table>
          </div>
          
          <p style="color: #334155; line-height: 1.6;">
            ${settings?.emailConfirmationBody || "We will get back to you within 1-2 business days with a customized training proposal tailored to your needs."}
          </p>
          
          <div style="margin: 30px 0; padding: 20px; background: #f0fdf4; border-radius: 8px; text-align: center;">
            <p style="color: #166534; margin: 0; font-weight: 600;">
              Need to reach us sooner?
            </p>
            <p style="color: #166534; margin: 10px 0 0 0;">
              WhatsApp: +60 12-345 6789<br>
              Email: msulfri@gmail.com
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            <strong style="color: #1e3a5f;">MSH Corporate Trainer</strong>
          </p>
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>© ${new Date().getFullYear()} MSH Corporate Trainer. All rights reserved.</p>
        </div>
      </div>
    `

    // Try Resend first, then SendGrid
    if (config.resendApiKey) {
      await sendViaResend({
        to: data.proposal.email,
        subject,
        html: htmlBody,
        from: `${config.fromName} <${config.fromEmail}>`,
      })
    } else if (config.sendgridApiKey) {
      await sendViaSendGrid({
        to: data.proposal.email,
        subject,
        html: htmlBody,
        from: config.fromEmail,
        fromName: config.fromName,
      })
    } else {
      // No email service configured - log for development
      console.log("No email service configured. Client confirmation email:", {
        to: data.proposal.email,
        subject,
      })
    }

    // Log successful email
    await logEmail({
      recipientEmail: data.proposal.email,
      subject,
      templateName: "proposal_confirmation",
      status: "SENT",
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error sending client confirmation email:", error)
    
    // Log failed email
    await logEmail({
      recipientEmail: data.proposal.email,
      subject: "Proposal Confirmation",
      templateName: "proposal_confirmation",
      status: "FAILED",
      errorMessage: error.message,
    })

    return { success: false, error: error.message }
  }
}

// Send notification email to admin
async function sendAdminNotificationEmail(data: ProposalEmailData): Promise<EmailResult> {
  const config = getEmailConfig()
  
  try {
    const subject = `New Proposal Request: ${data.proposal.organisation}`
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #22c55e; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">New Proposal Request Received</h1>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <p style="color: #334155;">A new training proposal request has been submitted:</p>
          
          <table style="width: 100%; color: #334155; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; width: 35%;"><strong>Contact Name:</strong></td>
              <td style="padding: 10px 0;">${data.proposal.contactName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0;"><strong>Organisation:</strong></td>
              <td style="padding: 10px 0;">${data.proposal.organisation}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0;"><strong>Email:</strong></td>
              <td style="padding: 10px 0;"><a href="mailto:${data.proposal.email}">${data.proposal.email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0;"><strong>Phone:</strong></td>
              <td style="padding: 10px 0;"><a href="tel:${data.proposal.phone}">${data.proposal.phone}</a></td>
            </tr>
            ${data.proposal.industrySector ? `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0;"><strong>Industry:</strong></td>
              <td style="padding: 10px 0;">${data.proposal.industrySector}</td>
            </tr>
            ` : ""}
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0;"><strong>Training Topic:</strong></td>
              <td style="padding: 10px 0;">${data.proposal.topicInterest}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0;"><strong>Group Size:</strong></td>
              <td style="padding: 10px 0;">${getGroupSizeLabel(data.proposal.groupSize)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0;"><strong>Delivery Mode:</strong></td>
              <td style="padding: 10px 0;">${getDeliveryModeLabel(data.proposal.deliveryMode)}</td>
            </tr>
            ${data.proposal.preferredTimeline ? `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0;"><strong>Timeline:</strong></td>
              <td style="padding: 10px 0;">${getTimelineLabel(data.proposal.preferredTimeline)}</td>
            </tr>
            ` : ""}
            ${data.proposal.additionalNotes ? `
            <tr>
              <td style="padding: 10px 0; vertical-align: top;"><strong>Additional Notes:</strong></td>
              <td style="padding: 10px 0;">${data.proposal.additionalNotes.replace(/\n/g, "<br>")}</td>
            </tr>
            ` : ""}
          </table>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/admin/proposals/${data.proposal.id}" 
               style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View in Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    `

    // Try Resend first, then SendGrid
    if (config.resendApiKey) {
      await sendViaResend({
        to: config.adminEmail,
        subject,
        html: htmlBody,
        from: `${config.fromName} <${config.fromEmail}>`,
      })
    } else if (config.sendgridApiKey) {
      await sendViaSendGrid({
        to: config.adminEmail,
        subject,
        html: htmlBody,
        from: config.fromEmail,
        fromName: config.fromName,
      })
    } else {
      // No email service configured - log for development
      console.log("No email service configured. Admin notification email:", {
        to: config.adminEmail,
        subject,
      })
    }

    // Log successful email
    await logEmail({
      recipientEmail: config.adminEmail,
      subject,
      templateName: "proposal_admin_notification",
      status: "SENT",
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error sending admin notification email:", error)
    
    // Log failed email
    await logEmail({
      recipientEmail: config.adminEmail,
      subject: "New Proposal Request",
      templateName: "proposal_admin_notification",
      status: "FAILED",
      errorMessage: error.message,
    })

    return { success: false, error: error.message }
  }
}

// Send follow-up email
export async function sendFollowUpEmail(
  proposalId: string,
  customMessage?: string
): Promise<EmailResult> {
  const config = getEmailConfig()
  
  try {
    const proposal = await prisma.proposalRequest.findUnique({
      where: { id: proposalId },
    })

    if (!proposal) {
      return { success: false, error: "Proposal not found" }
    }

    const settings = await prisma.portalSettings.findUnique({
      where: { id: "singleton" },
    })

    const subject = settings?.emailFollowupSubject || "Following up on your training inquiry"
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">MSH Corporate Trainer</h1>
        </div>
        
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #1e3a5f; margin-top: 0;">Hello ${proposal.contactName},</h2>
          
          <p style="color: #334155; line-height: 1.6;">
            ${customMessage || settings?.emailFollowupBody || "I hope this email finds you well. I wanted to follow up on your recent inquiry about our training services."}
          </p>
          
          <p style="color: #334155; line-height: 1.6;">
            Please let me know if you have any questions or if there's anything specific you'd like to discuss regarding the training for ${proposal.organisation}.
          </p>
          
          <div style="margin: 30px 0; padding: 20px; background: #f0fdf4; border-radius: 8px; text-align: center;">
            <p style="color: #166534; margin: 0; font-weight: 600;">
              Ready to discuss your training needs?
            </p>
            <p style="color: #166534; margin: 10px 0 0 0;">
              <a href="https://wa.me/60123456789" style="color: #166534; text-decoration: underline;">Chat on WhatsApp</a> | 
              <a href="mailto:msulfri@gmail.com" style="color: #166534; text-decoration: underline;">Email Me</a>
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            <strong style="color: #1e3a5f;">MSH Corporate Trainer</strong>
          </p>
        </div>
      </div>
    `

    if (config.resendApiKey) {
      await sendViaResend({
        to: proposal.email,
        subject,
        html: htmlBody,
        from: `${config.fromName} <${config.fromEmail}>`,
      })
    } else if (config.sendgridApiKey) {
      await sendViaSendGrid({
        to: proposal.email,
        subject,
        html: htmlBody,
        from: config.fromEmail,
        fromName: config.fromName,
      })
    } else {
      console.log("No email service configured. Follow-up email:", {
        to: proposal.email,
        subject,
      })
    }

    // Update proposal status to FOLLOWED_UP
    await prisma.proposalRequest.update({
      where: { id: proposalId },
      data: { status: "FOLLOWED_UP" },
    })

    await logEmail({
      recipientEmail: proposal.email,
      subject,
      templateName: "proposal_followup",
      status: "SENT",
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error sending follow-up email:", error)
    await logEmail({
      recipientEmail: config.adminEmail,
      subject: "Follow-up Email",
      templateName: "proposal_followup",
      status: "FAILED",
      errorMessage: error.message,
    })
    return { success: false, error: error.message }
  }
}

// Send via Resend API
async function sendViaResend({
  to,
  subject,
  html,
  from,
}: {
  to: string
  subject: string
  html: string
  from: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured")
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to send email via Resend")
  }
}

// Send via SendGrid API
async function sendViaSendGrid({
  to,
  subject,
  html,
  from,
  fromName,
}: {
  to: string
  subject: string
  html: string
  from: string
  fromName: string
}): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY not configured")
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: fromName },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || "Failed to send email via SendGrid")
  }
}

// Log email to database
async function logEmail({
  recipientEmail,
  subject,
  templateName,
  status,
  errorMessage,
}: {
  recipientEmail: string
  subject: string
  templateName: string
  status: "SENT" | "FAILED" | "RETRYING"
  errorMessage?: string
}): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        recipientEmail,
        subject,
        templateName,
        status,
        sentAt: status === "SENT" ? new Date() : null,
        errorMessage,
      },
    })
  } catch (error) {
    console.error("Error logging email:", error)
    // Non-critical - don't throw
  }
}

// Helper functions
function getGroupSizeLabel(size: string): string {
  const labels: Record<string, string> = {
    UNDER_20: "Less than 20",
    BETWEEN_20_50: "20 - 50",
    BETWEEN_50_100: "50 - 100",
    OVER_100: "100+",
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
