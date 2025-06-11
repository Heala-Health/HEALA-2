const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and Anon Key must be set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const agentsData = [
  { name: 'Mrs. Boluwatife', phoneNumber: '+234 901 468 2944', location: 'Veritas University Bwari Abuja' },
  { name: 'Mr. Isaac', phoneNumber: '+234 901 468 2944', location: 'Bwari Market' },
  { name: 'Mr. Damian', phoneNumber: '+234 814 971 1240', location: 'Viva Hospital Bwari' },
  { name: 'Miss Stephaine', phoneNumber: '+234 913 221 5717', location: 'Kogo 2 Mosque, Zago Ave' },
  { name: 'Mr. Ayomide', phoneNumber: '+234 913 221 5717', location: 'Kogo Phase 1 Extension' },
  { name: 'Miss Sarah', phoneNumber: '+234 707 039 0108', location: 'Unity College of Nursing Science Bwari' },
  { name: 'Miss Abayomi', phoneNumber: '+234 906 709 4071', location: 'De Rock Hospital and Diagnostics Centre, Bwari' },
];

async function insertAgents() {
  console.log('Starting agent data insertion...');
  for (const agent of agentsData) {
    const nameParts = agent.name.split(' ');
    let firstName = nameParts[0];
    let lastName = nameParts.slice(1).join(' ');

    // Handle titles like Mrs., Mr., Miss
    if (['Mrs.', 'Mr.', 'Miss'].includes(firstName)) {
      firstName = nameParts[1] || '';
      lastName = nameParts.slice(2).join(' ');
    }

    try {
      // Check if agent already exists by phone number or a combination of first/last name
      const { data: existingAgent, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .or(`phone.eq.${agent.phoneNumber},and(first_name.eq.${firstName},last_name.eq.${lastName})`)
        .eq('role', 'agent')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw fetchError;
      }

      if (existingAgent) {
        console.log(`Agent ${agent.name} already exists (ID: ${existingAgent.id}). Skipping insertion.`);
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            first_name: firstName,
            last_name: lastName,
            phone: agent.phoneNumber,
            location: agent.location, // Assuming 'location' column exists or can be added
            role: 'agent',
            // You might need to add a default email or generate one if it's a required field
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase() || 'agent'}@heala.com`, // Placeholder email
            is_active: true, // Assuming agents are active by default
          });

        if (error) throw error;
        console.log(`Successfully inserted agent: ${agent.name}`);
      }
    } catch (error) {
      console.error(`Error processing agent ${agent.name}:`, error.message);
    }
  }
  console.log('Agent data insertion complete.');
}

insertAgents();
