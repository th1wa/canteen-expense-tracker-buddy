
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  type: 'summary' | 'user-detail'
  selectedMonth?: string
  userName?: string
}

serve(async (req) => {
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header found')
      throw new Error('Authorization required')
    }

    console.log('Creating Supabase client...')
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      throw new Error('Invalid authentication token')
    }

    console.log('User authenticated:', user.id)

    // Check user permissions
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      throw new Error('Failed to get user profile')
    }

    if (!profile || !['admin', 'hr'].includes(profile.role)) {
      console.error('Access denied for role:', profile?.role)
      throw new Error('Access denied. HR or Admin role required.')
    }

    console.log('User has valid role:', profile.role)

    // Parse request body
    let requestBody: ExportRequest
    try {
      const bodyText = await req.text()
      console.log('Request body received:', bodyText)
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body')
      }
      
      requestBody = JSON.parse(bodyText)
      console.log('Parsed request:', requestBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Invalid JSON in request body')
    }

    const { type, selectedMonth, userName } = requestBody

    if (!type) {
      throw new Error('Export type is required')
    }

    console.log('Processing export type:', type)

    if (type === 'summary') {
      return await generateSummaryExcel(supabaseClient, selectedMonth)
    } else if (type === 'user-detail' && userName) {
      return await generateUserDetailExcel(supabaseClient, userName, selectedMonth)
    } else {
      throw new Error('Invalid request parameters. For user-detail export, userName is required.')
    }

  } catch (error) {
    console.error('Excel export error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const statusCode = errorMessage.includes('Access denied') ? 403 : 
                      errorMessage.includes('Authorization required') || errorMessage.includes('Invalid authentication') ? 401 : 400

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateSummaryExcel(supabase: any, selectedMonth?: string) {
  try {
    const monthDate = selectedMonth ? new Date(selectedMonth + '-01') : new Date()
    
    console.log('Generating summary for month:', monthDate.toISOString().split('T')[0])
    
    const { data, error } = await supabase.rpc('get_user_expense_summary', {
      selected_month: monthDate.toISOString().split('T')[0]
    })

    if (error) {
      console.error('RPC error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('Retrieved data records:', data?.length || 0)

    if (!data || data.length === 0) {
      console.log('No data found for the selected month')
      const csvContent = `Canteen Summary Report - ${monthDate.toISOString().slice(0, 7)}\n\nNo data found for the selected month.`
      const filename = `canteen_summary_report_${monthDate.toISOString().slice(0, 7)}.csv`
      
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }

    // Group data by user for summary
    const userMap = new Map()
    
    data.forEach((record: any) => {
      if (!userMap.has(record.user_name)) {
        userMap.set(record.user_name, {
          user_name: record.user_name,
          total_expenses: 0,
          total_paid: 0,
          total_remainder: 0,
          last_payment_date: null,
          payment_count: 0
        })
      }
      
      const userSummary = userMap.get(record.user_name)
      userSummary.total_expenses += parseFloat(record.expense_amount?.toString() || '0')
      
      if (record.payment_made) {
        userSummary.total_paid += parseFloat(record.expense_amount?.toString() || '0')
        userSummary.payment_count++
        if (!userSummary.last_payment_date || record.payment_date > userSummary.last_payment_date) {
          userSummary.last_payment_date = record.payment_date
        }
      }
      
      userSummary.total_remainder += parseFloat(record.remainder_amount?.toString() || '0')
    })

    const summaryArray = Array.from(userMap.values())
    const csvContent = generateSummaryCSV(summaryArray, monthDate)
    const filename = `canteen_summary_report_${monthDate.toISOString().slice(0, 7)}.csv`
    
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error in generateSummaryExcel:', error)
    throw error
  }
}

async function generateUserDetailExcel(supabase: any, userName: string, selectedMonth?: string) {
  try {
    const monthDate = selectedMonth ? new Date(selectedMonth + '-01') : new Date()
    
    console.log('Generating user detail for:', userName, 'month:', monthDate.toISOString().split('T')[0])
    
    const { data, error } = await supabase.rpc('get_user_expense_summary', {
      selected_month: monthDate.toISOString().split('T')[0]
    })

    if (error) {
      console.error('RPC error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // Filter data for specific user
    const userRecords = data?.filter((record: any) => record.user_name === userName) || []
    
    console.log('Got user records:', userRecords.length)
    
    const csvContent = generateUserDetailCSV(userRecords, userName, monthDate)
    const filename = `canteen_user_report_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthDate.toISOString().slice(0, 7)}.csv`
    
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error in generateUserDetailExcel:', error)
    throw error
  }
}

function generateSummaryCSV(data: any[], monthDate: Date): string {
  const monthStr = monthDate.toISOString().slice(0, 7)
  const headers = ['User Name', 'Total Expenses (LKR)', 'Total Payments (LKR)', 'Balance (LKR)', 'Last Payment Date', 'Payment Count', 'Status']
  
  const rows = data.map(user => [
    `"${user.user_name}"`,
    user.total_expenses.toFixed(2),
    user.total_paid.toFixed(2),
    user.total_remainder.toFixed(2),
    user.last_payment_date || 'No payments',
    user.payment_count.toString(),
    user.total_remainder > 0 ? 'Pending' : 'Settled'
  ])
  
  const csvLines = [
    `Canteen Summary Report - ${monthStr}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ]
  
  return csvLines.join('\n')
}

function generateUserDetailCSV(data: any[], userName: string, monthDate: Date): string {
  const monthStr = monthDate.toISOString().slice(0, 7)
  const headers = ['Date', 'Expense Amount (LKR)', 'Payment Status', 'Paid On Date', 'Remainder (LKR)', 'Remarks']
  
  const rows = data.map(record => [
    record.expense_date,
    parseFloat(record.expense_amount?.toString() || '0').toFixed(2),
    record.payment_made ? 'Paid' : 'Pending',
    record.payment_date || 'Not paid',
    parseFloat(record.remainder_amount?.toString() || '0').toFixed(2),
    record.payment_made ? 'Payment completed' : 'Payment pending'
  ])
  
  const totalExpenses = data.reduce((sum, record) => sum + parseFloat(record.expense_amount?.toString() || '0'), 0)
  const totalPaid = data.filter(record => record.payment_made)
    .reduce((sum, record) => sum + parseFloat(record.expense_amount?.toString() || '0'), 0)
  
  const csvLines = [
    `User Detail Report - ${userName} (${monthStr})`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(',')),
    '',
    `Total Expenses,${totalExpenses.toFixed(2)},,,,`,
    `Total Paid,${totalPaid.toFixed(2)},,,,`,
    `Balance,${(totalExpenses - totalPaid).toFixed(2)},,,,`
  ]
  
  return csvLines.join('\n')
}
