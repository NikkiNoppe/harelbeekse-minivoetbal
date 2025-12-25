-- Update alle Vlasschaard varianten naar standaard naam
UPDATE matches 
SET location = 'Bavikhove - Vlasschaard'
WHERE location IN ('De Vlasschaard', 'De Vlasschaard Bavikhove');

-- Update alle Dageraad varianten naar standaard naam
UPDATE matches 
SET location = 'Harelbeke - Dageraad'
WHERE location IN ('De Dageraad', 'De Dageraad Harelbeke');