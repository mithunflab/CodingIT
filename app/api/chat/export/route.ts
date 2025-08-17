import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { ChatPersistence } from '@/lib/chat-persistence'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
          'Content-Disposition': `attachment; filename="chat-export-${user.id}-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvLines = ['Session ID,Timestamp,Role,Content,Model,Template']
      
      sessions.forEach(session => {
        const sessionMessages = messages[session.sessionId] || []
        sessionMessages.forEach(message => {
          const csvLine = [
            session.sessionId,
            message.timestamp,
            message.role,
            `"${message.content.replace(/"/g, '""')}"`, // Escape quotes
            message.model || '',
            message.template || ''
          ].join(',')
          csvLines.push(csvLine)
        })
      })

      const csvContent = csvLines.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="chat-export-${user.id}-${new Date().toISOString().split('T')[0]}.csv"`,
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