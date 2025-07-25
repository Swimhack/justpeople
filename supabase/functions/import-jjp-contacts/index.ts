import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactImportData {
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  location: string;
  notes: string;
  tags: string[];
  status: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // JJP Contacts data
    const contacts: ContactImportData[] = [
      {
        name: "Dr. Marino-Hewlette-Woodmere",
        email: "Unknown",
        phone: "5167924800",
        company: "Unknown Company",
        title: "",
        location: "Long Island, NY",
        notes: "Long Island area contact",
        tags: ["JJP", "Lead"],
        status: "Lead"
      },
      {
        name: "Upper Sandusky",
        email: "Unknown",
        phone: "4192942306",
        company: "Unknown Company",
        title: "",
        location: "Ohio",
        notes: "Ohio area contact",
        tags: ["JJP", "Lead"],
        status: "Lead"
      },
      {
        name: "Ryan Bona",
        email: "Unknown",
        phone: "9792095454",
        company: "Unknown Company",
        title: "",
        location: "College Station, TX",
        notes: "College Station area contact",
        tags: ["JJP", "Lead"],
        status: "Lead"
      },
      {
        name: "Bobby LaPenna",
        email: "Bobby.LaPenna@BedfordTX.gov",
        phone: "8179522405",
        company: "Bedford TX Government",
        title: "Deputy Chief of Police",
        location: "Bedford, TX",
        notes: "Law enforcement contact",
        tags: ["JJP", "Lead", "Law Enforcement"],
        status: "Lead"
      },
      {
        name: "Bryan Thigpin",
        email: "Unknown",
        phone: "9798452345",
        company: "University",
        title: "",
        location: "Bryan, TX",
        notes: "University contact",
        tags: ["JJP", "Lead", "University"],
        status: "Lead"
      },
      {
        name: "Dalton Nichols",
        email: "Unknown",
        phone: "9792608000",
        company: "Unknown Company",
        title: "",
        location: "Bryan, TX",
        notes: "Bryan area contact",
        tags: ["JJP", "Lead"],
        status: "Lead"
      },
      {
        name: "Marlo Kruse",
        email: "Unknown",
        phone: "9037575777",
        company: "Unknown Company",
        title: "",
        location: "Tyler, TX",
        notes: "Tyler area contact",
        tags: ["JJP", "Lead"],
        status: "Lead"
      },
      {
        name: "Keith Pheeney",
        email: "keith@swimmingpoolhq.com",
        phone: "4092569444",
        company: "Swimming Pool HQ",
        title: "CEO",
        location: "Bryan/College Station, TX",
        notes: "CEO of Swimming Pool HQ",
        tags: ["JJP", "Lead", "CEO"],
        status: "Lead"
      },
      {
        name: "James Seward",
        email: "james@swimhack.com",
        phone: "9796768798",
        company: "Swimhack",
        title: "President",
        location: "Bryan, TX",
        notes: "President of Swimhack",
        tags: ["JJP", "Lead", "President", "Technology"],
        status: "Lead"
      },
      {
        name: "Korey Kornoley",
        email: "Unknown",
        phone: "4084296464",
        company: "Unknown Company",
        title: "",
        location: "San Jose, CA",
        notes: "San Jose area contact",
        tags: ["JJP", "Lead"],
        status: "Lead"
      },
      {
        name: "Strickland James",
        email: "pjpstrickland@yahoo.com",
        phone: "9798455555",
        company: "Yahoo",
        title: "",
        location: "Unknown",
        notes: "Yahoo contact",
        tags: ["JJP", "Lead"],
        status: "Lead"
      },
      {
        name: "Chad Adcox",
        email: "Unknown",
        phone: "4094660024",
        company: "Unknown Company",
        title: "",
        location: "Beaumont, TX",
        notes: "Beaumont area contact",
        tags: ["JJP", "Lead"],
        status: "Lead"
      },
      {
        name: "Vance Green",
        email: "vance@agsim.com",
        phone: "4099391394",
        company: "AgSim",
        title: "",
        location: "Texas",
        notes: "AgSim company contact",
        tags: ["JJP", "Lead", "AgTech"],
        status: "Lead"
      },
      {
        name: "Steven Murphy",
        email: "Unknown",
        phone: "9794508000",
        company: "Car Dealership",
        title: "",
        location: "Bryan, TX",
        notes: "Car dealership contact",
        tags: ["JJP", "Lead", "Automotive"],
        status: "Lead"
      }
    ];

    let imported = 0;
    let failed = 0;
    let duplicates = 0;

    for (const contact of contacts) {
      try {
        // Handle contacts without email
        let email = contact.email;
        if (!email || email.toLowerCase() === 'unknown' || email.trim() === '') {
          if (!contact.phone) {
            failed++;
            continue;
          }
          email = `noemail+${contact.phone}@jjpsolutions.com`;
        }

        // Check for existing contact by email or phone
        const { data: existingContact } = await supabaseClient
          .from('contacts')
          .select('id')
          .or(`email.eq.${email},custom_fields->phone.eq.${contact.phone}`)
          .single();

        if (existingContact) {
          duplicates++;
          continue;
        }

        // Calculate lead score based on available information
        let leadScore = 50; // Base score
        if (contact.email && contact.email.toLowerCase() !== 'unknown') leadScore += 10;
        if (contact.title) {
          leadScore += 15;
          if (contact.title.toLowerCase().includes('ceo') || contact.title.toLowerCase().includes('president')) {
            leadScore += 20;
          }
        }
        if (contact.company && contact.company !== 'Unknown Company') leadScore += 10;

        // Insert into contacts table
        const { error: contactError } = await supabaseClient
          .from('contacts')
          .insert({
            name: contact.name,
            email: email,
            company: contact.company,
            subject: `Imported Contact - ${contact.title || 'Lead'}`,
            message: `Imported from Monday.com\n${contact.notes}\nLocation: ${contact.location}`,
            status: 'new',
            priority: leadScore > 70 ? 'high' : 'normal',
            tags: contact.tags,
            lead_score: leadScore,
            custom_fields: {
              phone: contact.phone,
              title: contact.title,
              location: contact.location,
              original_status: contact.status
            }
          });

        if (contactError) {
          console.error('Contact import error:', contactError);
          failed++;
          continue;
        }

        // Split name for leads table
        const nameParts = contact.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        // Also insert into leads table
        const { error: leadError } = await supabaseClient
          .from('leads')
          .insert({
            email: email,
            first_name: firstName,
            last_name: lastName,
            phone: contact.phone,
            company: contact.company,
            lead_status: 'new',
            qualification_status: leadScore > 70 ? 'qualified' : 'unqualified',
            lead_score: leadScore,
            tags: contact.tags,
            notes: `${contact.title ? `Title: ${contact.title}\n` : ''}${contact.location ? `Location: ${contact.location}\n` : ''}${contact.notes}`,
            custom_fields: {
              title: contact.title,
              location: contact.location,
              original_status: contact.status
            }
          });

        if (leadError) {
          console.error('Lead import error:', leadError);
          // Don't count as failed if contact was successful
        }

        imported++;
      } catch (error) {
        console.error('Import error for contact:', contact.name, error);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'JJP Contacts imported successfully',
        stats: {
          total: contacts.length,
          imported,
          duplicates,
          failed
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})