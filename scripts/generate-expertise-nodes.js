const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Domain mapping from CR-05
const DOMAIN_MAP = {
  management: {
    name: "Management & Leadership",
    topics: ["leadership", "Management", "Agile / Scrum", "Project Management", "Process Improvement", "Career Development", "Professional Skills"]
  },
  technology: {
    name: "Technology & Engineering",
    topics: ["Programming", "Cloud Computing", "Emerging Technology", "Digital Transformation", "Automation / RPA"]
  },
  cybersecurity: {
    name: "Cybersecurity",
    topics: ["Cybersecurity"]
  },
  data: {
    name: "Data & AI",
    topics: ["Data Analytics & Visualization", "Data Analytics & AI", "Data Management", "AI / Automation", "AI / Prompt Engineering", "AI Fundamentals"]
  },
  productivity: {
    name: "Productivity & Collaboration",
    topics: ["Microsoft Office Productivity", "Productivity / Collaboration"]
  }
}

function getDomainForTopic(topic) {
  const topicLower = topic.toLowerCase()
  for (const [key, domain] of Object.entries(DOMAIN_MAP)) {
    if (domain.topics.some(t => topicLower.includes(t.toLowerCase()))) {
      return { id: key, ...domain }
    }
  }
  // Default to management if no match
  return { id: "management", ...DOMAIN_MAP.management }
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function main() {
  console.log('Generating expertise nodes from classes...\n')
  
  // Get all unique topic categories from classes
  const classes = await prisma.class.findMany({
    select: { topicCategory: true }
  })
  
  const uniqueTopics = [...new Set(classes.map(c => c.topicCategory).filter(Boolean))]
  console.log(`Found ${uniqueTopics.length} unique topics:\n`)
  uniqueTopics.forEach(t => console.log(`  - ${t}`))
  console.log()
  
  // Group topics by domain
  const topicsByDomain = {}
  uniqueTopics.forEach(topic => {
    const domain = getDomainForTopic(topic)
    if (!topicsByDomain[domain.id]) {
      topicsByDomain[domain.id] = { ...domain, topics: [] }
    }
    topicsByDomain[domain.id].topics.push(topic)
  })
  
  console.log('Grouped by domain:')
  Object.entries(topicsByDomain).forEach(([key, data]) => {
    console.log(`\n  ${data.name}:`)
    data.topics.forEach(t => console.log(`    - ${t}`))
  })
  console.log()
  
  // Create domain nodes and topic nodes
  let createdNodes = 0
  let createdMappings = 0
  
  for (const [domainId, domainData] of Object.entries(topicsByDomain)) {
    console.log(`\nProcessing domain: ${domainData.name}`)
    
    // Check if domain node exists
    let domainNode = await prisma.expertiseNode.findUnique({
      where: { slug: domainId }
    })
    
    if (!domainNode) {
      domainNode = await prisma.expertiseNode.create({
        data: {
          title: domainData.name,
          slug: domainId,
          description: `Training expertise in ${domainData.name.toLowerCase()}`,
          domain: domainData.name,
          depth: 1,
          displayOrder: Object.keys(DOMAIN_MAP).indexOf(domainId)
        }
      })
      createdNodes++
      console.log(`  ✓ Created domain node: ${domainNode.title}`)
    } else {
      console.log(`  ✓ Domain node exists: ${domainNode.title}`)
    }
    
    // Create topic nodes under this domain
    for (const topic of domainData.topics) {
      const topicSlug = slugify(topic)
      
      // Check if topic node exists
      let topicNode = await prisma.expertiseNode.findUnique({
        where: { slug: topicSlug }
      })
      
      if (!topicNode) {
        topicNode = await prisma.expertiseNode.create({
          data: {
            title: topic,
            slug: topicSlug,
            description: `Training classes in ${topic}`,
            domain: domainData.name,
            parentId: domainNode.id,
            depth: 2,
            displayOrder: 0
          }
        })
        createdNodes++
        console.log(`    ✓ Created topic node: ${topicNode.title}`)
      } else {
        console.log(`    ✓ Topic node exists: ${topicNode.title}`)
      }
      
      // Get classes for this topic
      const topicClasses = await prisma.class.findMany({
        where: { topicCategory: topic }
      })
      
      // Get badges that might relate to this topic
      const badges = await prisma.badge.findMany({
        where: {
          title: {
            contains: topic.split(' ')[0],
            mode: 'insensitive'
          }
        }
      })
      
      // Create badge mappings
      for (const badge of badges) {
        const existingMapping = await prisma.badgeExpertiseMap.findFirst({
          where: {
            badgeId: badge.id,
            expertiseNodeId: topicNode.id
          }
        })
        
        if (!existingMapping) {
          await prisma.badgeExpertiseMap.create({
            data: {
              badgeId: badge.id,
              expertiseNodeId: topicNode.id,
              mappingSource: 'SUGGESTED'
            }
          })
          createdMappings++
        }
      }
    }
  }
  
  console.log(`\n\n✅ Summary:`)
  console.log(`  - Created ${createdNodes} new expertise nodes`)
  console.log(`  - Created ${createdMappings} badge-expertise mappings`)
  console.log(`  - Total domains: ${Object.keys(topicsByDomain).length}`)
  console.log(`  - Total topics: ${uniqueTopics.length}`)
}

main()
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
