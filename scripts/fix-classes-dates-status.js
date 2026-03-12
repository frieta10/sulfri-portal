const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing class dates and statuses...\n')
  
  const now = new Date()
  const currentYear = now.getFullYear() // 2026
  
  // Get all classes
  const classes = await prisma.class.findMany({
    select: {
      id: true,
      title: true,
      startDatetime: true,
      endDatetime: true,
      status: true,
      clientName: true
    },
    orderBy: {
      startDatetime: 'asc'
    }
  })
  
  console.log(`Total classes: ${classes.length}\n`)
  
  let updatedDates = 0
  let updatedStatus = 0
  
  for (const cls of classes) {
    const startDate = new Date(cls.startDatetime)
    const endDate = new Date(cls.endDatetime)
    const startYear = startDate.getFullYear()
    
    let needsUpdate = false
    let newStartDate = startDate
    let newEndDate = endDate
    let newStatus = cls.status
    
    // Fix 1: If year is 2026, change to random 2019-2025
    if (startYear === 2026) {
      const randomYear = Math.floor(Math.random() * (2025 - 2019 + 1)) + 2019
      const randomMonth = Math.floor(Math.random() * 12)
      const randomDay = Math.floor(Math.random() * 28) + 1
      
      newStartDate = new Date(randomYear, randomMonth, randomDay)
      
      // End date is 1-3 days after start
      const duration = Math.floor(Math.random() * 3) + 1
      newEndDate = new Date(newStartDate)
      newEndDate.setDate(newEndDate.getDate() + duration)
      
      needsUpdate = true
      updatedDates++
      
      console.log(`  Date fix: "${cls.title}" ${startDate.toISOString().split('T')[0]} -> ${newStartDate.toISOString().split('T')[0]}`)
    }
    
    // Fix 2: Status logic - COMPLETED only if end date has passed
    const isPast = newEndDate < now
    const correctStatus = isPast ? 'COMPLETED' : (newStartDate > now ? 'UPCOMING' : 'ONGOING')
    
    if (cls.status !== correctStatus) {
      newStatus = correctStatus
      needsUpdate = true
      updatedStatus++
      console.log(`  Status fix: "${cls.title}" ${cls.status} -> ${correctStatus} (end: ${newEndDate.toISOString().split('T')[0]})`)
    }
    
    if (needsUpdate) {
      await prisma.class.update({
        where: { id: cls.id },
        data: {
          startDatetime: newStartDate,
          endDatetime: newEndDate,
          status: newStatus
        }
      })
    }
  }
  
  console.log(`\n✓ Updated ${updatedDates} class dates`)
  console.log(`✓ Updated ${updatedStatus} class statuses`)
  
  // Show new date range
  const updatedClasses = await prisma.class.findMany({
    select: { startDatetime: true },
    orderBy: { startDatetime: 'asc' }
  })
  
  if (updatedClasses.length > 0) {
    const dates = updatedClasses.map(c => new Date(c.startDatetime))
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))
    
    console.log(`\nNew date range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`)
  }
}

main()
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
