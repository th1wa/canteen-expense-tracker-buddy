
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Set the auth context
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Invalid token')
    }

    console.log('User authenticated:', user.id)

    // Check if user has HR or Admin role
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

    const { type, selectedMonth, userName }: ExportRequest = await req.json()

    if (type === 'summary') {
      return await generateSummaryExcel(supabaseClient, selectedMonth)
    } else if (type === 'user-detail' && userName) {
      return await generateUserDetailExcel(supabaseClient, userName, selectedMonth)
    } else {
      throw new Error('Invalid request parameters')
    }

  } catch (error) {
    console.error('Excel export error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateSummaryExcel(supabase: any, selectedMonth?: string) {
  const monthDate = selectedMonth ? new Date(selectedMonth + '-01') : new Date()
  
  console.log('Generating summary for month:', monthDate.toISOString().split('T')[0])
  
  const { data, error } = await supabase.rpc('get_user_expense_summary', {
    selected_month: monthDate.toISOString().split('T')[0]
  })

  if (error) {
    console.error('RPC error:', error)
    throw error
  }

  console.log('Got summary data:', data?.length, 'records')

  // Group data by user for summary
  const userMap = new Map()
  
  data?.forEach((record: any) => {
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
    userSummary.total_expenses += parseFloat(record.expense_amount.toString())
    
    if (record.payment_made) {
      userSummary.total_paid += parseFloat(record.expense_amount.toString())
      userSummary.payment_count++
      if (!userSummary.last_payment_date || record.payment_date > userSummary.last_payment_date) {
        userSummary.last_payment_date = record.payment_date
      }
    }
    
    userSummary.total_remainder += parseFloat(record.remainder_amount.toString())
  })

  // Create Excel workbook using a simple approach
  const summaryArray = Array.from(userMap.values())
  const csvContent = generateSummaryCSV(summaryArray, monthDate)
  
  const filename = `canteen_summary_report_${monthDate.toISOString().slice(0, 7)}.csv`
  
  return new Response(csvContent, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

async function generateUserDetailExcel(supabase: any, userName: string, selectedMonth?: string) {
  const monthDate = selectedMonth ? new Date(selectedMonth + '-01') : new Date()
  
  console.log('Generating user detail for:', userName, 'month:', monthDate.toISOString().split('T')[0])
  
  const { data, error } = await supabase.rpc('get_user_expense_summary', {
    selected_month: monthDate.toISOString().split('T')[0]
  })

  if (error) {
    console.error('RPC error:', error)
    throw error
  }

  // Filter data for specific user
  const userRecords = data?.filter((record: any) => record.user_name === userName) || []
  
  console.log('Got user records:', userRecords.length)
  
  const csvContent = generateUserDetailCSV(userRecords, userName)
  
  const filename = `canteen_user_report_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthDate.toISOString().slice(0, 10)}.csv`
  
  return new Response(csvContent, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

function generateSummaryCSV(data: any[], monthDate: Date) {
  const headers = ['User Name', 'Total Expenses (LKR)', 'Total Payments (LKR)', 'Balance (LKR)', 'Last Payment Date', 'Payment Count', 'Status']
  
  const rows = data.map(user => [
    user.user_name,
    user.total_expenses.toFixed(2),
    user.total_paid.toFixed(2),
    user.total_remainder.toFixed(2),
    user.last_payment_date || 'No payments',
    user.payment_count,
    user.total_remainder > 0 ? 'Pending' : 'Settled'
  ])
  
  const csvLines = [
    `Canteen Summary Report - ${monthDate.toISOString().slice(0, 7)}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ]
  
  return csvLines.join('\n')
}

function generateUserDetailCSV(data: any[], userName: string) {
  const headers = ['Date', 'Expense Amount (LKR)', 'Payment Status', 'Paid On Date', 'Remainder (LKR)', 'Remarks']
  
  const rows = data.map(record => [
    record.expense_date,
    parseFloat(record.expense_amount.toString()).toFixed(2),
    record.payment_made ? 'Paid' : 'Pending',
    record.payment_date || 'Not paid',
    parseFloat(record.remainder_amount.toString()).toFixed(2),
    record.payment_made ? 'Payment completed' : 'Payment pending'
  ])
  
  const totalExpenses = data.reduce((sum, record) => sum + parseFloat(record.expense_amount.toString()), 0)
  const totalPaid = data.filter(record => record.payment_made).reduce((sum, record) => sum + parseFloat(record.expense_amount.toString()), 0)
  
  const csvLines = [
    `User Detail Report - ${userName}`,
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
