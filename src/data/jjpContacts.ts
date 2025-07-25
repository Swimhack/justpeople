export const JJP_CONTACTS = [
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

export interface JJPContact {
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  location: string;
  notes: string;
  tags: string[];
  leadScore: number;
}