import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const signature = req.headers.get('x-paystack-signature')
    const body = await req.text()
    
    // Verify webhook signature
    const hash = await crypto.subtle.digest('SHA-512', 
      new TextEncoder().encode(Deno.env.get('PAYSTACK_SECRET_KEY') + body)
    )
    const expectedSignature = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    
    if (signature !== expectedSignature) {
      return new Response('Invalid signature', { status: 400 })
    }

    const event = JSON.parse(body)
    
    if (event.event === 'charge.success') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { metadata } = event.data
      if (metadata.purpose === 'wallet_funding') {
        await supabase.rpc('credit_wallet', {
          wallet_id_param: metadata.wallet_id,
          amount_param: event.data.amount / 100,
          description_param: 'Wallet funding via Paystack',
          reference_param: event.data.reference
        })
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    return new Response('Error', { status: 500 })
  }
})