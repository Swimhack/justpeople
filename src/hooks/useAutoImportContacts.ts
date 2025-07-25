import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAutoImportContacts(user: any) {
  const [importAttempted, setImportAttempted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && !importAttempted) {
      setImportAttempted(true);
      checkAndImportContacts();
    }
  }, [user, importAttempted]);

  const checkAndImportContacts = async () => {
    try {
      // Check if auto-import has already been attempted for this user
      const importKey = `jjp_contacts_imported_${user?.id}`;
      const alreadyImported = localStorage.getItem(importKey);
      
      if (alreadyImported) {
        console.log('JJP contacts auto-import already attempted for this user');
        return;
      }

      // Check if contacts already exist
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .in('email', [
          'keith@swimmingpoolhq.com',
          'james@swimhack.com',
          'Bobby.LaPenna@BedfordTX.gov',
          'vance@agsim.com',
          'pjpstrickland@yahoo.com'
        ]);

      // Mark as attempted regardless of outcome
      localStorage.setItem(importKey, 'true');

      // If contacts already exist, don't import
      if (contactCount && contactCount > 0) {
        console.log('JJP contacts already exist, skipping auto-import');
        return;
      }

      // Import contacts automatically
      await importJJPContacts();
    } catch (error) {
      console.error('Auto-import check failed:', error);
      // Still mark as attempted to prevent infinite retries
      if (user?.id) {
        localStorage.setItem(`jjp_contacts_imported_${user.id}`, 'true');
      }
    }
  };

  const importJJPContacts = async () => {
    try {
      // JJP Contacts data
      const contacts = [
        {
          name: "Keith Pheeney",
          email: "keith@swimmingpoolhq.com",
          phone: "4092569444",
          company: "Swimming Pool HQ",
          title: "CEO",
          location: "Bryan/College Station, TX",
          notes: "CEO of Swimming Pool HQ",
          tags: ["JJP", "Lead", "CEO"],
          leadScore: 85
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
          leadScore: 90
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
          leadScore: 75
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
          leadScore: 70
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
          leadScore: 60
        },
        {
          name: "Dr. Marino-Hewlette-Woodmere",
          email: "noemail+5167924800@jjpsolutions.com",
          phone: "5167924800",
          company: "Unknown Company",
          title: "",
          location: "Long Island, NY",
          notes: "Long Island area contact",
          tags: ["JJP", "Lead"],
          leadScore: 50
        },
        {
          name: "Upper Sandusky",
          email: "noemail+4192942306@jjpsolutions.com",
          phone: "4192942306",
          company: "Unknown Company",
          title: "",
          location: "Ohio",
          notes: "Ohio area contact",
          tags: ["JJP", "Lead"],
          leadScore: 50
        },
        {
          name: "Ryan Bona",
          email: "noemail+9792095454@jjpsolutions.com",
          phone: "9792095454",
          company: "Unknown Company",
          title: "",
          location: "College Station, TX",
          notes: "College Station area contact",
          tags: ["JJP", "Lead"],
          leadScore: 50
        },
        {
          name: "Bryan Thigpin",
          email: "noemail+9798452345@jjpsolutions.com",
          phone: "9798452345",
          company: "University",
          title: "",
          location: "Bryan, TX",
          notes: "University contact",
          tags: ["JJP", "Lead", "University"],
          leadScore: 50
        },
        {
          name: "Dalton Nichols",
          email: "noemail+9792608000@jjpsolutions.com",
          phone: "9792608000",
          company: "Unknown Company",
          title: "",
          location: "Bryan, TX",
          notes: "Bryan area contact",
          tags: ["JJP", "Lead"],
          leadScore: 50
        },
        {
          name: "Marlo Kruse",
          email: "noemail+9037575777@jjpsolutions.com",
          phone: "9037575777",
          company: "Unknown Company",
          title: "",
          location: "Tyler, TX",
          notes: "Tyler area contact",
          tags: ["JJP", "Lead"],
          leadScore: 50
        },
        {
          name: "Korey Kornoley",
          email: "noemail+4084296464@jjpsolutions.com",
          phone: "4084296464",
          company: "Unknown Company",
          title: "",
          location: "San Jose, CA",
          notes: "San Jose area contact",
          tags: ["JJP", "Lead"],
          leadScore: 50
        },
        {
          name: "Chad Adcox",
          email: "noemail+4094660024@jjpsolutions.com",
          phone: "4094660024",
          company: "Unknown Company",
          title: "",
          location: "Beaumont, TX",
          notes: "Beaumont area contact",
          tags: ["JJP", "Lead"],
          leadScore: 50
        },
        {
          name: "Steven Murphy",
          email: "noemail+9794508000@jjpsolutions.com",
          phone: "9794508000",
          company: "Car Dealership",
          title: "",
          location: "Bryan, TX",
          notes: "Car dealership contact",
          tags: ["JJP", "Lead", "Automotive"],
          leadScore: 55
        }
      ];

      let imported = 0;

      // Import to contacts table
      for (const contact of contacts) {
        try {
          const { error: contactError } = await supabase
            .from('contacts')
            .insert({
              name: contact.name,
              email: contact.email,
              company: contact.company,
              subject: `Imported Contact - ${contact.title || 'Lead'}`,
              message: `Imported from Monday.com\n${contact.notes}\nLocation: ${contact.location}`,
              status: 'new',
              priority: contact.leadScore > 70 ? 'high' : 'normal',
              tags: contact.tags,
              lead_score: contact.leadScore,
              custom_fields: {
                phone: contact.phone,
                title: contact.title,
                location: contact.location,
                original_status: 'Lead'
              }
            });

          if (!contactError) {
            // Also import to leads table
            const nameParts = contact.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            await supabase
              .from('leads')
              .insert({
                email: contact.email,
                first_name: firstName,
                last_name: lastName,
                phone: contact.phone,
                company: contact.company,
                lead_status: 'new',
                qualification_status: contact.leadScore > 70 ? 'qualified' : 'unqualified',
                lead_score: contact.leadScore,
                tags: contact.tags,
                notes: `${contact.title ? `Title: ${contact.title}\n` : ''}${contact.location ? `Location: ${contact.location}\n` : ''}${contact.notes}`,
                custom_fields: {
                  title: contact.title,
                  location: contact.location,
                  original_status: 'Lead'
                }
              });

            imported++;
          }
        } catch (error) {
          console.error('Error importing contact:', contact.name, error);
        }
      }

      if (imported > 0) {
        toast({
          title: 'Welcome to JJP Solutions!',
          description: `Auto-imported ${imported} JJP contacts into your CRM`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Auto-import failed:', error);
    }
  };
}