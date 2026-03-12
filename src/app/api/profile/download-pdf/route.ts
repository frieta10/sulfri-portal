import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "summary"

    if (!["summary", "full"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    // Get request info for tracking
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown"
    const ipHash = ipAddress !== "unknown" 
      ? crypto.createHash("sha256").update(ipAddress).digest("hex")
      : null

    // Track download
    try {
      await prisma.pdfDownloadLog.create({
        data: {
          pdfType: type,
          referrerPage: request.headers.get("referer") || null,
          userAgent: request.headers.get("user-agent") || null,
          ipHash,
        },
      })
    } catch (e) { /* silent fail */ }

    // Fetch all profile data
    const profile = await prisma.profileSettings.findUnique({
      where: { id: "singleton" },
    })

    // Fetch additional data for full profile
    const badges = type === 'full' ? await prisma.badge.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: { displayOrder: "asc" },
      take: 10,
    }) : []

    const expertise = type === 'full' ? await prisma.expertiseNode.findMany({
      where: { visibility: "PUBLIC", parentId: null },
      orderBy: { displayOrder: "asc" },
    }) : []

    const classes = type === 'full' ? await prisma.class.findMany({
      where: { status: "COMPLETED", showOnPublicProfile: true },
      take: 20,
      orderBy: { startDatetime: "desc" },
    }) : []

    const clients = type === 'full' ? await prisma.class.groupBy({
      by: ["clientName", "clientType"],
      where: { status: "COMPLETED" },
      _count: { id: true },
    }) : []

    const displayName = profile?.displayName || "Mohd Sulfri Mohd Harris"
    const headline = profile?.headline || "Senior Corporate Trainer & Project Management Expert"
    const bio = profile?.bio || "Delivering high-impact training programmes for government agencies, GLCs, and multinational corporations."
    const email = profile?.email || "msulfri@gmail.com"
    const phone = profile?.phone || "+6017 382 1002"
    const location = profile?.locationBase || "Malaysia"
    const linkedin = profile?.linkedinUrl || ""

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayName} - Trainer Profile</title>
  <style>
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    .header { 
      background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
      color: white;
      padding: 40px;
      margin: -20px -20px 30px -20px;
      text-align: center;
    }
    .header h1 { 
      font-size: 36px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .header .headline { 
      font-size: 18px;
      opacity: 0.9;
      font-weight: 500;
    }
    .header .contact-bar {
      margin-top: 20px;
      font-size: 13px;
      opacity: 0.85;
    }
    .section { 
      margin-bottom: 30px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .section h2 { 
      color: #1e3a5f;
      font-size: 22px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .section p { 
      font-size: 14px;
      line-height: 1.8;
      color: #555;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-box {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .stat-box .number {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-box .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 5px;
    }
    .expertise-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 15px;
    }
    .expertise-item {
      padding: 12px;
      background: white;
      border-radius: 6px;
      font-size: 13px;
      border: 1px solid #e2e8f0;
    }
    .badge-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 15px;
    }
    .badge-item {
      padding: 10px;
      background: white;
      border-radius: 6px;
      font-size: 11px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .client-list {
      margin-top: 15px;
    }
    .client-item {
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
    }
    .certifications {
      background: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 15px;
    }
    .certifications h3 {
      color: #1e40af;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .cert-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .cert-item {
      font-size: 12px;
      color: #1e40af;
      background: white;
      padding: 6px 10px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
    .footer strong {
      color: #64748b;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .badge-list { grid-template-columns: repeat(2, 1fr); }
      .two-col { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>${displayName}</h1>
    <p class="headline">${headline}</p>
    <div class="contact-bar">
      📧 ${email} | 📱 ${phone} | 📍 ${location}
      ${linkedin ? `| <a href="${linkedin}" style="color:white;">LinkedIn</a>` : ''}
    </div>
  </div>

  <!-- About -->
  <div class="section">
    <h2>Professional Summary</h2>
    <p>${bio}</p>
    
    <div class="stats-grid">
      <div class="stat-box">
        <div class="number">150+</div>
        <div class="label">Classes Completed</div>
      </div>
      <div class="stat-box">
        <div class="number">2,500+</div>
        <div class="label">Training Hours</div>
      </div>
      <div class="stat-box">
        <div class="number">3,500+</div>
        <div class="label">Participants Trained</div>
      </div>
      <div class="stat-box">
        <div class="number">45+</div>
        <div class="label">Client Organizations</div>
      </div>
    </div>
  </div>

  ${type === 'full' ? `
  <!-- Expertise -->
  <div class="section">
    <h2>Areas of Expertise</h2>
    <div class="expertise-grid">
      <div class="expertise-item"><strong>Project Management</strong><br>Agile, Scrum, Waterfall methodologies</div>
      <div class="expertise-item"><strong>Digital Transformation</strong><br>Cloud computing, Microsoft 365, AI</div>
      <div class="expertise-item"><strong>Engineering Literacy</strong><br>Electrical & Civil systems for professionals</div>
      <div class="expertise-item"><strong>Workplace Culture</strong><br>Anti-bullying, ethics, leadership</div>
      <div class="expertise-item"><strong>Data & Analytics</strong><br>Power BI, data visualization</div>
      <div class="expertise-item"><strong>Cyber Security</strong><br>Security awareness, best practices</div>
    </div>
  </div>

  <!-- Certifications -->
  <div class="section">
    <h2>Professional Certifications</h2>
    <div class="certifications">
      <h3>HRD Corp Certified Trainer (#44523)</h3>
      <div class="cert-grid">
        <div class="cert-item">Microsoft Azure Administrator</div>
        <div class="cert-item">Microsoft Azure Security</div>
        <div class="cert-item">Google Cloud Digital Leader</div>
        <div class="cert-item">CompTIA Security+</div>
        <div class="cert-item">CompTIA A+</div>
        <div class="cert-item">Cisco CCNA</div>
        <div class="cert-item">Microsoft Power BI Analyst</div>
        <div class="cert-item">Certified Data Science Specialist</div>
      </div>
    </div>
    ${badges.length > 0 ? `
    <div class="badge-list">
      ${badges.slice(0, 9).map(b => `<div class="badge-item">${b.title}</div>`).join('')}
    </div>
    ` : ''}
  </div>

  <!-- Clients -->
  <div class="section">
    <h2>Notable Clients</h2>
    <div class="client-list">
      ${clients.slice(0, 10).map(c => `
        <div class="client-item">
          <span>${c.clientName}</span>
          <span style="color:#64748b;">${c._count.id} sessions</span>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Training Delivery -->
  <div class="section">
    <h2>Training Delivery Experience</h2>
    <p><strong>Delivery Modes:</strong> Online (Virtual), In-Person (Physical), Hybrid</p>
    <p style="margin-top:10px;"><strong>Sectors Served:</strong> Government Agencies, GLCs, Corporate, Higher Education</p>
    <p style="margin-top:10px;"><strong>Topics Delivered:</strong> Project Management, Digital Transformation, Engineering Literacy, Workplace Culture, Data Analytics, Cyber Security</p>
  </div>
  ` : ''}

  <!-- Contact -->
  <div class="section" style="background: #1e3a5f; color: white; border-left-color: white;">
    <h2 style="color: white;">Contact Information</h2>
    <div class="two-col">
      <div>
        <p><strong>Email:</strong><br>${email}</p>
        <p style="margin-top:10px;"><strong>Phone:</strong><br>${phone}</p>
      </div>
      <div>
        <p><strong>Location:</strong><br>${location}</p>
        <p style="margin-top:10px;"><strong>HRD Corp:</strong><br>Trainer #44523</p>
      </div>
    </div>
    ${linkedin ? `<p style="margin-top:15px;"><strong>LinkedIn:</strong> ${linkedin}</p>` : ''}
  </div>

  <div class="footer">
    <p><strong>${displayName}</strong> | ${headline}</p>
    <p style="margin-top:5px;">This profile was generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p style="margin-top:5px;">For the most up-to-date information, visit: https://sulfri-portal.vercel.app</p>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 1000);
    };
  </script>
</body>
</html>`

    const filename = `MSH_Trainer_Profile_${type}_${new Date().toISOString().split('T')[0]}.html`
    
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Failed to generate profile" },
      { status: 500 }
    )
  }
}
