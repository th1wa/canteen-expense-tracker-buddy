
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
      return await generateDetailedSummaryExcel(supabaseClient, selectedMonth)
    } else if (type === 'user-detail' && userName) {
      return await generateDetailedUserExcel(supabaseClient, userName, selectedMonth)
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

async function generateDetailedSummaryExcel(supabase: any, selectedMonth?: string) {
  try {
    const monthDate = selectedMonth ? new Date(selectedMonth + '-01') : new Date()
    
    console.log('Generating detailed summary for month:', monthDate.toISOString().split('T')[0])
    
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
      const csvContent = `Detailed Canteen Summary Report - ${monthDate.toISOString().slice(0, 7)}\n\nNo expense data found for the selected month.\n\nThis report would normally include:\n- Complete expense breakdown by user\n- Payment history and status\n- Outstanding balance details\n- Daily expense patterns\n- Financial summary statistics`
      const filename = `detailed_canteen_summary_report_${monthDate.toISOString().slice(0, 7)}.csv`
      
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }

    // Group data by user for detailed summary
    const userMap = new Map()
    
    data.forEach((record: any) => {
      if (!userMap.has(record.user_name)) {
        userMap.set(record.user_name, {
          user_name: record.user_name,
          total_expenses: 0,
          total_paid: 0,
          total_remainder: 0,
          expense_days: 0,
          payment_days: 0,
          last_expense_date: null,
          last_payment_date: null,
          average_daily_expense: 0,
          payment_completion_rate: 0,
          days_with_expenses: new Set(),
          days_with_payments: new Set(),
          largest_single_expense: 0,
          smallest_single_expense: Infinity
        })
      }
      
      const userSummary = userMap.get(record.user_name)
      const expenseAmount = parseFloat(record.expense_amount?.toString() || '0')
      
      userSummary.total_expenses += expenseAmount
      
      if (expenseAmount > 0) {
        userSummary.days_with_expenses.add(record.expense_date)
        userSummary.largest_single_expense = Math.max(userSummary.largest_single_expense, expenseAmount)
        userSummary.smallest_single_expense = Math.min(userSummary.smallest_single_expense, expenseAmount)
        if (!userSummary.last_expense_date || record.expense_date > userSummary.last_expense_date) {
          userSummary.last_expense_date = record.expense_date
        }
      }
      
      if (record.payment_made) {
        userSummary.total_paid += expenseAmount
        userSummary.days_with_payments.add(record.payment_date)
        if (!userSummary.last_payment_date || record.payment_date > userSummary.last_payment_date) {
          userSummary.last_payment_date = record.payment_date
        }
      }
      
      userSummary.total_remainder += parseFloat(record.remainder_amount?.toString() || '0')
    })

    // Calculate additional metrics
    userMap.forEach((userSummary, userName) => {
      userSummary.expense_days = userSummary.days_with_expenses.size
      userSummary.payment_days = userSummary.days_with_payments.size
      userSummary.average_daily_expense = userSummary.expense_days > 0 ? userSummary.total_expenses / userSummary.expense_days : 0
      userSummary.payment_completion_rate = userSummary.total_expenses > 0 ? (userSummary.total_paid / userSummary.total_expenses) * 100 : 0
      if (userSummary.smallest_single_expense === Infinity) userSummary.smallest_single_expense = 0
    })

    const summaryArray = Array.from(userMap.values())
    const csvContent = generateDetailedSummaryCSV(summaryArray, monthDate)
    const filename = `detailed_canteen_summary_report_${monthDate.toISOString().slice(0, 7)}.csv`
    
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error in generateDetailedSummaryExcel:', error)
    throw error
  }
}

async function generateDetailedUserExcel(supabase: any, userName: string, selectedMonth?: string) {
  try {
    const monthDate = selectedMonth ? new Date(selectedMonth + '-01') : new Date()
    
    console.log('Generating detailed user report for:', userName, 'month:', monthDate.toISOString().split('T')[0])
    
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
    
    const csvContent = generateDetailedUserCSV(userRecords, userName, monthDate)
    const filename = `detailed_user_expense_report_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthDate.toISOString().slice(0, 7)}.csv`
    
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error in generateDetailedUserExcel:', error)
    throw error
  }
}

function generateDetailedSummaryCSV(data: any[], monthDate: Date): string {
  const monthStr = monthDate.toISOString().slice(0, 7)
  
  // Calculate overall statistics
  const totalUsers = data.length
  const totalExpenses = data.reduce((sum, user) => sum + user.total_expenses, 0)
  const totalPaid = data.reduce((sum, user) => sum + user.total_paid, 0)
  const totalOutstanding = data.reduce((sum, user) => sum + user.total_remainder, 0)
  const averageExpensePerUser = totalUsers > 0 ? totalExpenses / totalUsers : 0
  const overallPaymentRate = totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0
  
  const headers = [
    'User Name',
    'Total Expenses (LKR)',
    'Total Payments (LKR)', 
    'Outstanding Balance (LKR)',
    'Payment Completion Rate (%)',
    'Days with Expenses',
    'Days with Payments',
    'Average Daily Expense (LKR)',
    'Last Expense Date',
    'Last Payment Date',
    'Largest Single Expense (LKR)',
    'Smallest Single Expense (LKR)',
    'Financial Status',
    'Payment Priority'
  ]
  
  const rows = data.map(user => {
    const paymentPriority = user.total_remainder > 1000 ? 'High' : 
                           user.total_remainder > 500 ? 'Medium' : 'Low'
    const financialStatus = user.total_remainder <= 0 ? 'Fully Settled' :
                           user.payment_completion_rate > 75 ? 'Good Standing' :
                           user.payment_completion_rate > 50 ? 'Needs Attention' : 'Critical'
    
    return [
      `"${user.user_name}"`,
      user.total_expenses.toFixed(2),
      user.total_paid.toFixed(2),
      user.total_remainder.toFixed(2),
      user.payment_completion_rate.toFixed(1),
      user.expense_days.toString(),
      user.payment_days.toString(),
      user.average_daily_expense.toFixed(2),
      user.last_expense_date || 'No expenses',
      user.last_payment_date || 'No payments',
      user.largest_single_expense.toFixed(2),
      user.smallest_single_expense.toFixed(2),
      financialStatus,
      paymentPriority
    ]
  })
  
  const csvLines = [
    `DETAILED CANTEEN SUMMARY REPORT - ${monthStr}`,
    `Generated on: ${new Date().toLocaleString()}`,
    '',
    '=== OVERALL STATISTICS ===',
    `Total Users,${totalUsers}`,
    `Total Expenses,LKR ${totalExpenses.toFixed(2)}`,
    `Total Payments,LKR ${totalPaid.toFixed(2)}`,
    `Total Outstanding,LKR ${totalOutstanding.toFixed(2)}`,
    `Average Expense per User,LKR ${averageExpensePerUser.toFixed(2)}`,
    `Overall Payment Rate,${overallPaymentRate.toFixed(1)}%`,
    '',
    '=== DETAILED USER BREAKDOWN ===',
    headers.join(','),
    ...rows.map(row => row.join(',')),
    '',
    '=== REPORT LEGEND ===',
    'Payment Priority: High (>1000 LKR outstanding), Medium (500-1000 LKR), Low (<500 LKR)',
    'Financial Status: Fully Settled (0 outstanding), Good Standing (>75% paid), Needs Attention (50-75% paid), Critical (<50% paid)',
    '',
    'This report provides comprehensive expense tracking and payment analysis for better financial management.'
  ]
  
  return csvLines.join('\n')
}

function generateDetailedUserCSV(data: any[], userName: string, monthDate: Date): string {
  const monthStr = monthDate.toISOString().slice(0, 7)
  
  const headers = [
    'Date',
    'Expense Amount (LKR)',
    'Payment Status',
    'Paid On Date',
    'Outstanding Amount (LKR)',
    'Days Since Expense',
    'Payment Delay (Days)',
    'Transaction Type',
    'Weekly Total Context',
    'Status Notes'
  ]
  
  // Sort data by date
  const sortedData = data.sort((a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime())
  
  const rows = sortedData.map((record, index) => {
    const expenseDate = new Date(record.expense_date)
    const today = new Date()
    const daysSinceExpense = Math.floor((today.getTime() - expenseDate.getTime()) / (1000 * 3600 * 24))
    
    let paymentDelay = 'N/A'
    if (record.payment_made && record.payment_date) {
      const paymentDate = new Date(record.payment_date)
      paymentDelay = Math.floor((paymentDate.getTime() - expenseDate.getTime()) / (1000 * 3600 * 24)).toString()
    }
    
    // Calculate weekly context
    const weekStart = new Date(expenseDate)
    weekStart.setDate(expenseDate.getDate() - expenseDate.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    const weeklyExpenses = sortedData.filter(r => {
      const rDate = new Date(r.expense_date)
      return rDate >= weekStart && rDate <= weekEnd
    })
    const weeklyTotal = weeklyExpenses.reduce((sum, r) => sum + parseFloat(r.expense_amount?.toString() || '0'), 0)
    
    const transactionType = parseFloat(record.expense_amount?.toString() || '0') > 500 ? 'Large Expense' : 'Regular Expense'
    
    let statusNotes = ''
    if (record.payment_made) {
      statusNotes = paymentDelay === '0' ? 'Paid same day' : 
                   parseInt(paymentDelay) <= 7 ? 'Paid within week' : 'Late payment'
    } else {
      statusNotes = daysSinceExpense > 30 ? 'Overdue payment' :
                   daysSinceExpense > 14 ? 'Payment due soon' : 'Recent expense'
    }
    
    return [
      record.expense_date,
      parseFloat(record.expense_amount?.toString() || '0').toFixed(2),
      record.payment_made ? 'PAID' : 'PENDING',
      record.payment_date || 'Not paid yet',
      parseFloat(record.remainder_amount?.toString() || '0').toFixed(2),
      daysSinceExpense.toString(),
      paymentDelay,
      transactionType,
      `Week total: LKR ${weeklyTotal.toFixed(2)}`,
      statusNotes
    ]
  })
  
  // Calculate comprehensive statistics
  const totalExpenses = data.reduce((sum, record) => sum + parseFloat(record.expense_amount?.toString() || '0'), 0)
  const totalPaid = data.filter(record => record.payment_made)
    .reduce((sum, record) => sum + parseFloat(record.expense_amount?.toString() || '0'), 0)
  const totalOutstanding = totalExpenses - totalPaid
  const paymentRate = totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0
  
  const paidRecords = data.filter(r => r.payment_made && r.payment_date)
  const averagePaymentDelay = paidRecords.length > 0 ? 
    paidRecords.reduce((sum, r) => {
      const expenseDate = new Date(r.expense_date)
      const paymentDate = new Date(r.payment_date)
      return sum + Math.floor((paymentDate.getTime() - expenseDate.getTime()) / (1000 * 3600 * 24))
    }, 0) / paidRecords.length : 0
  
  const uniqueDates = new Set(data.map(r => r.expense_date))
  const averageDailyExpense = uniqueDates.size > 0 ? totalExpenses / uniqueDates.size : 0
  
  const csvLines = [
    `DETAILED USER EXPENSE REPORT - ${userName} (${monthStr})`,
    `Generated on: ${new Date().toLocaleString()}`,
    '',
    '=== USER FINANCIAL SUMMARY ===',
    `Total Expenses,LKR ${totalExpenses.toFixed(2)}`,
    `Total Payments,LKR ${totalPaid.toFixed(2)}`,
    `Outstanding Balance,LKR ${totalOutstanding.toFixed(2)}`,
    `Payment Completion Rate,${paymentRate.toFixed(1)}%`,
    `Average Daily Expense,LKR ${averageDailyExpense.toFixed(2)}`,
    `Average Payment Delay,${averagePaymentDelay.toFixed(1)} days`,
    `Days with Expenses,${uniqueDates.size}`,
    `Total Transactions,${data.length}`,
    '',
    '=== DETAILED TRANSACTION HISTORY ===',
    headers.join(','),
    ...rows.map(row => row.join(',')),
    '',
    '=== FINANCIAL ANALYSIS ===',
    `Payment Behavior: ${paymentRate > 90 ? 'Excellent - Very reliable payer' : 
                        paymentRate > 75 ? 'Good - Generally pays on time' :
                        paymentRate > 50 ? 'Fair - Occasional delays' : 'Poor - Frequent payment issues'}`,
    `Outstanding Status: ${totalOutstanding <= 0 ? 'Fully settled - No pending payments' :
                          totalOutstanding < 500 ? 'Low outstanding - Manageable amount' :
                          totalOutstanding < 1000 ? 'Medium outstanding - Needs attention' : 
                          'High outstanding - Requires immediate action'}`,
    `Expense Pattern: ${averageDailyExpense > 200 ? 'High daily spender' :
                       averageDailyExpense > 100 ? 'Moderate daily spender' : 'Light daily spender'}`,
    '',
    'This detailed report helps track individual expense patterns and payment behavior for better financial planning.'
  ]
  
  return csvLines.join('\n')
}
