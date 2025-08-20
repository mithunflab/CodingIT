import { NextRequest, NextResponse } from 'next/server'
import { ChatPersistence } from '@/lib/chat-persistence'
import { authenticateUser } from '@/lib/auth-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Supported formats: json, csv' },
        { status: 400 }
      )
    }

    // Export user's chat data
    const { sessions, messages } = await ChatPersistence.exportUserData(user.id)
    
    // Generate export date once for consistency
    const exportDate = new Date().toISOString().split('T')[0]

    if (format === 'json') {
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        totalSessions: sessions.length,
        totalMessages: Object.values(messages).reduce((sum, msgs) => sum + msgs.length, 0),
        sessions,
        messages,
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="chat-export-${user.id}-${exportDate}.json"`,
        },
      })
    }

    if (format === 'csv') {
      // Helper function to properly escape and quote CSV fields
      const escapeCsvField = (field: string): string => {
        if (!field) return '""'
        // Quote the field and escape any quotes within it
        return `"${field.replace(/"/g, '""')}"`
      }

      // Convert to CSV format
      const csvLines = ['Session ID,Timestamp,Role,Content,Model,Template']
      
      sessions.forEach(session => {
        const sessionMessages = messages[session.sessionId] || []
        sessionMessages.forEach(message => {
          const csvLine = [
            escapeCsvField(session.sessionId),
            escapeCsvField(message.timestamp),
            escapeCsvField(message.role),
            escapeCsvField(message.content),
            escapeCsvField(message.model || ''),
            escapeCsvField(message.template || '')
          ].join(',')
          csvLines.push(csvLine)
        })
      })

      const csvContent = csvLines.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="chat-export-${user.id}-${exportDate}.csv"`,
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid format specified' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error exporting chat data:', error)
    return NextResponse.json(
      { error: 'Failed to export chat data' },
      { status: 500 }
    )
  }
}