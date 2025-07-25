-- Import JJP Contacts into the database
-- This script imports the contacts from JJP_CONTACTS_MONDAY_IMPORT.json

-- Insert contacts from the JSON data
-- Note: You'll need to be authenticated as a user to run this script

-- Dr. Marino-Hewlette-Woodmere
INSERT INTO public.contacts (name, email, company, subject, message, status, priority, tags, lead_score, custom_fields)
VALUES 
('Dr. Marino-Hewlette-Woodmere', 'noemail+5167924800@jjpsolutions.com', 'Unknown Company', 'Imported Contact - Lead', 'Imported from Monday.com
Long Island area contact
Location: Long Island, NY', 'new', 'normal', ARRAY['JJP', 'Lead'], 50, '{"phone": "5167924800", "title": "", "location": "Long Island, NY", "original_status": "Lead"}'),

-- Upper Sandusky
('Upper Sandusky', 'noemail+4192942306@jjpsolutions.com', 'Unknown Company', 'Imported Contact - Lead', 'Imported from Monday.com
Ohio area contact
Location: Ohio', 'new', 'normal', ARRAY['JJP', 'Lead'], 50, '{"phone": "4192942306", "title": "", "location": "Ohio", "original_status": "Lead"}'),

-- Ryan Bona
('Ryan Bona', 'noemail+9792095454@jjpsolutions.com', 'Unknown Company', 'Imported Contact - Lead', 'Imported from Monday.com
College Station area contact
Location: College Station, TX', 'new', 'normal', ARRAY['JJP', 'Lead'], 50, '{"phone": "9792095454", "title": "", "location": "College Station, TX", "original_status": "Lead"}'),

-- Bobby LaPenna
('Bobby LaPenna', 'Bobby.LaPenna@BedfordTX.gov', 'Bedford TX Government', 'Imported Contact - Deputy Chief of Police', 'Imported from Monday.com
Law enforcement contact
Location: Bedford, TX', 'new', 'normal', ARRAY['JJP', 'Lead', 'Law Enforcement'], 75, '{"phone": "8179522405", "title": "Deputy Chief of Police", "location": "Bedford, TX", "original_status": "Lead"}'),

-- Bryan Thigpin
('Bryan Thigpin', 'noemail+9798452345@jjpsolutions.com', 'University', 'Imported Contact - Lead', 'Imported from Monday.com
University contact
Location: Bryan, TX', 'new', 'normal', ARRAY['JJP', 'Lead', 'University'], 50, '{"phone": "9798452345", "title": "", "location": "Bryan, TX", "original_status": "Lead"}'),

-- Dalton Nichols
('Dalton Nichols', 'noemail+9792608000@jjpsolutions.com', 'Unknown Company', 'Imported Contact - Lead', 'Imported from Monday.com
Bryan area contact
Location: Bryan, TX', 'new', 'normal', ARRAY['JJP', 'Lead'], 50, '{"phone": "9792608000", "title": "", "location": "Bryan, TX", "original_status": "Lead"}'),

-- Marlo Kruse
('Marlo Kruse', 'noemail+9037575777@jjpsolutions.com', 'Unknown Company', 'Imported Contact - Lead', 'Imported from Monday.com
Tyler area contact
Location: Tyler, TX', 'new', 'normal', ARRAY['JJP', 'Lead'], 50, '{"phone": "9037575777", "title": "", "location": "Tyler, TX", "original_status": "Lead"}'),

-- Keith Pheeney
('Keith Pheeney', 'keith@swimmingpoolhq.com', 'Swimming Pool HQ', 'Imported Contact - CEO', 'Imported from Monday.com
CEO of Swimming Pool HQ
Location: Bryan/College Station, TX', 'new', 'high', ARRAY['JJP', 'Lead', 'CEO'], 85, '{"phone": "4092569444", "title": "CEO", "location": "Bryan/College Station, TX", "original_status": "Lead"}'),

-- James Seward
('James Seward', 'james@swimhack.com', 'Swimhack', 'Imported Contact - President', 'Imported from Monday.com
President of Swimhack
Location: Bryan, TX', 'new', 'high', ARRAY['JJP', 'Lead', 'President', 'Technology'], 90, '{"phone": "9796768798", "title": "President", "location": "Bryan, TX", "original_status": "Lead"}'),

-- Korey Kornoley
('Korey Kornoley', 'noemail+4084296464@jjpsolutions.com', 'Unknown Company', 'Imported Contact - Lead', 'Imported from Monday.com
San Jose area contact
Location: San Jose, CA', 'new', 'normal', ARRAY['JJP', 'Lead'], 50, '{"phone": "4084296464", "title": "", "location": "San Jose, CA", "original_status": "Lead"}'),

-- Strickland James
('Strickland James', 'pjpstrickland@yahoo.com', 'Yahoo', 'Imported Contact - Lead', 'Imported from Monday.com
Yahoo contact
Location: Unknown', 'new', 'normal', ARRAY['JJP', 'Lead'], 60, '{"phone": "9798455555", "title": "", "location": "Unknown", "original_status": "Lead"}'),

-- Chad Adcox
('Chad Adcox', 'noemail+4094660024@jjpsolutions.com', 'Unknown Company', 'Imported Contact - Lead', 'Imported from Monday.com
Beaumont area contact
Location: Beaumont, TX', 'new', 'normal', ARRAY['JJP', 'Lead'], 50, '{"phone": "4094660024", "title": "", "location": "Beaumont, TX", "original_status": "Lead"}'),

-- Vance Green
('Vance Green', 'vance@agsim.com', 'AgSim', 'Imported Contact - Lead', 'Imported from Monday.com
AgSim company contact
Location: Texas', 'new', 'normal', ARRAY['JJP', 'Lead', 'AgTech'], 70, '{"phone": "4099391394", "title": "", "location": "Texas", "original_status": "Lead"}'),

-- Steven Murphy
('Steven Murphy', 'noemail+9794508000@jjpsolutions.com', 'Car Dealership', 'Imported Contact - Lead', 'Imported from Monday.com
Car dealership contact
Location: Bryan, TX', 'new', 'normal', ARRAY['JJP', 'Lead', 'Automotive'], 55, '{"phone": "9794508000", "title": "", "location": "Bryan, TX", "original_status": "Lead"}');

-- Also insert into leads table for CRM functionality
INSERT INTO public.leads (email, first_name, last_name, phone, company, lead_status, qualification_status, lead_score, tags, notes, custom_fields)
VALUES 
-- Dr. Marino-Hewlette-Woodmere
('noemail+5167924800@jjpsolutions.com', 'Dr.', 'Marino-Hewlette-Woodmere', '5167924800', 'Unknown Company', 'new', 'unqualified', 50, ARRAY['JJP', 'Lead'], 'Title: 
Location: Long Island, NY
Long Island area contact', '{"title": "", "location": "Long Island, NY", "original_status": "Lead"}'),

-- Upper Sandusky
('noemail+4192942306@jjpsolutions.com', 'Upper', 'Sandusky', '4192942306', 'Unknown Company', 'new', 'unqualified', 50, ARRAY['JJP', 'Lead'], 'Title: 
Location: Ohio
Ohio area contact', '{"title": "", "location": "Ohio", "original_status": "Lead"}'),

-- Ryan Bona
('noemail+9792095454@jjpsolutions.com', 'Ryan', 'Bona', '9792095454', 'Unknown Company', 'new', 'unqualified', 50, ARRAY['JJP', 'Lead'], 'Title: 
Location: College Station, TX
College Station area contact', '{"title": "", "location": "College Station, TX", "original_status": "Lead"}'),

-- Bobby LaPenna
('Bobby.LaPenna@BedfordTX.gov', 'Bobby', 'LaPenna', '8179522405', 'Bedford TX Government', 'new', 'qualified', 75, ARRAY['JJP', 'Lead', 'Law Enforcement'], 'Title: Deputy Chief of Police
Location: Bedford, TX
Law enforcement contact', '{"title": "Deputy Chief of Police", "location": "Bedford, TX", "original_status": "Lead"}'),

-- Bryan Thigpin
('noemail+9798452345@jjpsolutions.com', 'Bryan', 'Thigpin', '9798452345', 'University', 'new', 'unqualified', 50, ARRAY['JJP', 'Lead', 'University'], 'Title: 
Location: Bryan, TX
University contact', '{"title": "", "location": "Bryan, TX", "original_status": "Lead"}'),

-- Dalton Nichols
('noemail+9792608000@jjpsolutions.com', 'Dalton', 'Nichols', '9792608000', 'Unknown Company', 'new', 'unqualified', 50, ARRAY['JJP', 'Lead'], 'Title: 
Location: Bryan, TX
Bryan area contact', '{"title": "", "location": "Bryan, TX", "original_status": "Lead"}'),

-- Marlo Kruse
('noemail+9037575777@jjpsolutions.com', 'Marlo', 'Kruse', '9037575777', 'Unknown Company', 'new', 'unqualified', 50, ARRAY['JJP', 'Lead'], 'Title: 
Location: Tyler, TX
Tyler area contact', '{"title": "", "location": "Tyler, TX", "original_status": "Lead"}'),

-- Keith Pheeney
('keith@swimmingpoolhq.com', 'Keith', 'Pheeney', '4092569444', 'Swimming Pool HQ', 'new', 'qualified', 85, ARRAY['JJP', 'Lead', 'CEO'], 'Title: CEO
Location: Bryan/College Station, TX
CEO of Swimming Pool HQ', '{"title": "CEO", "location": "Bryan/College Station, TX", "original_status": "Lead"}'),

-- James Seward
('james@swimhack.com', 'James', 'Seward', '9796768798', 'Swimhack', 'new', 'qualified', 90, ARRAY['JJP', 'Lead', 'President', 'Technology'], 'Title: President
Location: Bryan, TX
President of Swimhack', '{"title": "President", "location": "Bryan, TX", "original_status": "Lead"}'),

-- Korey Kornoley
('noemail+4084296464@jjpsolutions.com', 'Korey', 'Kornoley', '4084296464', 'Unknown Company', 'new', 'unqualified', 50, ARRAY['JJP', 'Lead'], 'Title: 
Location: San Jose, CA
San Jose area contact', '{"title": "", "location": "San Jose, CA", "original_status": "Lead"}'),

-- Strickland James
('pjpstrickland@yahoo.com', 'Strickland', 'James', '9798455555', 'Yahoo', 'new', 'unqualified', 60, ARRAY['JJP', 'Lead'], 'Title: 
Location: Unknown
Yahoo contact', '{"title": "", "location": "Unknown", "original_status": "Lead"}'),

-- Chad Adcox
('noemail+4094660024@jjpsolutions.com', 'Chad', 'Adcox', '4094660024', 'Unknown Company', 'new', 'unqualified', 50, ARRAY['JJP', 'Lead'], 'Title: 
Location: Beaumont, TX
Beaumont area contact', '{"title": "", "location": "Beaumont, TX", "original_status": "Lead"}'),

-- Vance Green
('vance@agsim.com', 'Vance', 'Green', '4099391394', 'AgSim', 'new', 'unqualified', 70, ARRAY['JJP', 'Lead', 'AgTech'], 'Title: 
Location: Texas
AgSim company contact', '{"title": "", "location": "Texas", "original_status": "Lead"}'),

-- Steven Murphy
('noemail+9794508000@jjpsolutions.com', 'Steven', 'Murphy', '9794508000', 'Car Dealership', 'new', 'unqualified', 55, ARRAY['JJP', 'Lead', 'Automotive'], 'Title: 
Location: Bryan, TX
Car dealership contact', '{"title": "", "location": "Bryan, TX", "original_status": "Lead"}');

-- Note: This script requires an authenticated user to run
-- For contacts without emails, we create placeholder emails using their phone numbers
-- All contacts are imported with appropriate lead scores based on their information