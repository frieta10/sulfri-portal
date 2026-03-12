const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Checking current class dates...\n')
  
  // Get all classes
  const classes = await prisma.class.findMany({
    select: {
      id: true,
      title: true,
      startDatetime: true,
      endDatetime: true,
      clientName: true
    },
    orderBy: {
      startDatetime: 'asc'
    }
  })
  
  console.log(`Total classes: ${classes.length}\n`)
  
  // Show date range
  if (classes.length > 0) {
    const dates = classes.map(c => new Date(c.startDatetime))
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))
    
    console.log('Current date range:')
    console.log(`  Earliest: ${minDate.toISOString().split('T')[0]}`)
    console.log(`  Latest: ${maxDate.toISOString().split('T')[0]}\n`)
  }
  
  // Find classes with year 2000 (old default dates)
  const oldClasses = classes.filter(c => {
    const year = new Date(c.startDatetime).getFullYear()
    return year < 2019
  })
  
  console.log(`Classes with dates before 2019: ${oldClasses.length}\n`)
  
  if (oldClasses.length > 0) {
    console.log('Sample old classes:')
    oldClasses.slice(0, 5).forEach(c => {
      console.log(`  - ${c.title} (${c.clientName}): ${c.startDatetime.toISOString().split('T')[0]}`)
    })
    console.log('')
    
    // Generate random dates between 2019 and now
    const now = new Date()
    const startYear = 2019
    
    console.log('Updating old classes with random dates (2019-2026)...\n')
    
    let updated = 0
    
    for (const cls of oldClasses) {
      // Generate random date between 2019 and now
      const randomYear = Math.floor(Math.random() * (now.getFullYear() - startYear + 1)) + startYear
      const randomMonth = Math.floor(Math.random() * 12)
      const randomDay = Math.floor(Math.random() * 28) + 1 // Avoid month-end issues
      
      const newStartDate = new Date(randomYear, randomMonth, randomDay)
      
      // End date is 1-3 days after start
      const duration = Math.floor(Math.random() * 3) + 1
      const newEndDate = new Date(newStartDate)
      newEndDate.setDate(newEndDate.getDate() + duration)
      
      await prisma.class.update({
        where: { id: cls.id },
        data: {
          startDatetime: newStartDate,
          endDatetime: newEndDate
        }
      })
      
      updated++
      if (updated % 10 === 0) {
        console.log(`  Updated ${updated}/${oldClasses.length} classes...`)
      }
    }
    
    console.log(`\n✓ Updated ${updated} classes with new random dates (2019-2026)`)
  } else {
    console.log('No old classes found that need updating.')
  }
  
  // Show summary after update
  const updatedClasses = await prisma.class.findMany({
    select: {
      title: true,
      startDatetime: true,
      clientName: true
    },
    orderBy: {
      startDatetime: 'asc'
    }
  })
  
  const newDates = updatedClasses.map(c => new Date(c.startDatetime))
  const newMinDate = new Date(Math.min(...newDates))
  const newMaxDate = new Date(Math.max(...newDates))
  
  console.log('\nNew date range:')
  console.log(`  Earliest: ${newMinDate.toISOString().split('T')[0]}`)
  console.log(`  Latest: ${newMaxDate.toISOString().split('T')[0]}`)
}

main()
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
