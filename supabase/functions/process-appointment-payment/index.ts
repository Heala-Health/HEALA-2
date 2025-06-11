import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log('Hello from Functions!');

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const { amount, patient_id, appointment_details } = await req.json();

    if (!amount || !patient_id) {
      return new Response(JSON.stringify({ error: 'Missing amount or patient_id' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      },
    );

    // Fetch patient email
    const { data: patientProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', patient_id)
      .single();

    if (profileError || !patientProfile) {
      console.error('Error fetching patient profile:', profileError);
      throw new Error('Patient email not found.');
    }

    const patientEmail = patientProfile.email;

    const paystackSecretKey = Deno.env.get('sk_live_4ec03224c55b3e31eb3721219cbce4b000197d6d');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured.');
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Paystack expects amount in kobo
        email: patientEmail,
        metadata: {
          patient_id: patient_id,
          appointment_details: appointment_details, // Pass appointment details for tracking
        },
      }),
    });

    const paystackData = await response.json();
    console.log('Paystack response:', paystackData);

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Paystack initialization failed');
    }

    return new Response(JSON.stringify({ status: 'success', message: 'Payment initiated', data: paystackData.data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
