
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { action, accessToken, filters } = await req.json()

    if (action === 'createBackup') {
      // Fetch all data
      const { data: expenses } = await supabaseClient
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: payments } = await supabaseClient
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters if provided
      let filteredExpenses = expenses || []
      let filteredPayments = payments || []

      if (filters?.dateFrom) {
        filteredExpenses = filteredExpenses.filter(e => e.expense_date >= filters.dateFrom)
        filteredPayments = filteredPayments.filter(p => p.payment_date >= filters.dateFrom)
      }

      if (filters?.dateTo) {
        filteredExpenses = filteredExpenses.filter(e => e.expense_date <= filters.dateTo)
        filteredPayments = filteredPayments.filter(p => p.payment_date <= filters.dateTo)
      }

      if (filters?.userName) {
        filteredExpenses = filteredExpenses.filter(e => e.user_name.includes(filters.userName))
        filteredPayments = filteredPayments.filter(p => p.user_name.includes(filters.userName))
      }

      // Create CSV content
      const expensesCSV = [
        'ID,User Name,Amount,Expense Date,Note,Created At',
        ...filteredExpenses.map(e => 
          `${e.id},"${e.user_name}",${e.amount},"${e.expense_date}","${e.note || ''}","${e.created_at}"`
        )
      ].join('\n')

      const paymentsCSV = [
        'ID,User Name,Amount,Payment Date,Created At',
        ...filteredPayments.map(p => 
          `${p.id},"${p.user_name}",${p.amount},"${p.payment_date}","${p.created_at}"`
        )
      ].join('\n')

      // Create backup summary
      const summary = {
        backupDate: new Date().toISOString(),
        totalExpenses: filteredExpenses.length,
        totalPayments: filteredPayments.length,
        totalExpenseAmount: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
        totalPaymentAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
        filters: filters || null
      }

      const summaryCSV = [
        'Backup Summary',
        `Backup Date,${summary.backupDate}`,
        `Total Expenses,${summary.totalExpenses}`,
        `Total Payments,${summary.totalPayments}`,
        `Total Expense Amount,${summary.totalExpenseAmount}`,
        `Total Payment Amount,${summary.totalPaymentAmount}`,
        '',
        'Expenses:',
        expensesCSV,
        '',
        'Payments:',
        paymentsCSV
      ].join('\n')

      // Create or find backup folder
      const folderName = 'Canteen Expense Backups'
      const findFolderResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )

      const folders = await findFolderResponse.json()
      let folderId = folders.files?.[0]?.id

      if (!folderId) {
        // Create folder
        const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
          })
        })
        const folder = await createFolderResponse.json()
        folderId = folder.id
      }

      // Upload backup file
      const timestamp = new Date().toISOString().split('T')[0]
      const fileName = `Canteen_Backup_${timestamp}_${Date.now()}.csv`

      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/related; boundary="backup_boundary"'
        },
        body: [
          '--backup_boundary',
          'Content-Type: application/json',
          '',
          JSON.stringify({
            name: fileName,
            parents: [folderId]
          }),
          '--backup_boundary',
          'Content-Type: text/csv',
          '',
          summaryCSV,
          '--backup_boundary--'
        ].join('\n')
      })

      const uploadResult = await uploadResponse.json()

      return new Response(
        JSON.stringify({ 
          success: true, 
          fileId: uploadResult.id,
          fileName,
          summary 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'listBackups') {
      const folderName = 'Canteen Expense Backups'
      const findFolderResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )

      const folders = await findFolderResponse.json()
      const folderId = folders.files?.[0]?.id

      if (!folderId) {
        return new Response(
          JSON.stringify({ backups: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const filesResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,size,createdTime,modifiedTime)`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )

      const files = await filesResponse.json()

      return new Response(
        JSON.stringify({ backups: files.files || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'deleteBackup') {
      const { fileId } = await req.json()
      
      const deleteResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      return new Response(
        JSON.stringify({ success: deleteResponse.ok }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'downloadBackup') {
      const { fileId } = await req.json()
      
      const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      const content = await downloadResponse.text()

      return new Response(
        JSON.stringify({ success: true, content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Google Drive backup error:', error)
    return new Response(
      JSON.stringify({ error: 'Backup operation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
