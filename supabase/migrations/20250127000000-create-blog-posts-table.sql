-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_url TEXT,
    category VARCHAR(100) DEFAULT 'Nieuws',
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    slug VARCHAR(255) UNIQUE,
    meta_description TEXT,
    featured BOOLEAN DEFAULT false
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Insert some sample blog posts
INSERT INTO blog_posts (title, content, excerpt, author, category, tags, is_published, slug) VALUES
(
    'Nieuw seizoen 2024-2025 officieel gestart!',
    'Het nieuwe seizoen van de Harelbeekse Minivoetbalcompetitie is officieel van start gegaan! Na een succesvolle zomer met recordaantallen inschrijvingen, zijn alle teams klaar voor een fantastisch seizoen vol spanning en sportiviteit.

We verwelkomen dit jaar 12 teams in de competitie, verdeeld over twee divisies. De nieuwe teams hebben zich uitstekend voorbereid en we verwachten spannende wedstrijden.

Belangrijke data voor dit seizoen:
- Competitie start: 5 september 2024
- Winterstop: 20 december 2024 - 10 januari 2025
- Play-offs: maart 2025
- Seizoensafsluiting: mei 2025

We wensen alle teams veel succes en fair play toe!',
    'Het nieuwe seizoen 2024-2025 is officieel van start gegaan met recordaantallen inschrijvingen. Alle teams zijn klaar voor een fantastisch seizoen vol spanning en sportiviteit.',
    'Admin Team',
    'Competitie',
    ARRAY['seizoen', 'start', 'teams'],
    true,
    'nieuw-seizoen-2024-2025-gestart'
),
(
    'Teambuilding activiteiten gepland voor komende maanden',
    'Naast de reguliere competitie organiseren we ook dit seizoen weer verschillende teambuilding evenementen en sociale activiteiten om de gemeenschap te versterken.

Geplande activiteiten:
- Oktober: Bowling avond voor alle teams
- November: Quiz night in het clubhuis
- December: Kerstfeest met prijsuitreiking
- Februari: Winter BBQ
- April: Seizoensafsluiting met live muziek

Deze activiteiten zijn niet alleen leuk, maar dragen ook bij aan de teamgeest en vriendschappen tussen de verschillende teams. Alle spelers en supporters zijn welkom!',
    'Naast de competitie organiseren we ook regelmatig teambuilding evenementen en sociale activiteiten om de gemeenschap te versterken.',
    'Event Team',
    'Event',
    ARRAY['teambuilding', 'activiteiten', 'gemeenschap'],
    true,
    'teambuilding-activiteiten-2024-2025'
),
(
    'Nieuwe spelregels voor seizoen 2024-2025',
    'Voor het nieuwe seizoen hebben we enkele belangrijke wijzigingen doorgevoerd in de spelregels om de competitie nog eerlijker en spannender te maken.

Belangrijkste wijzigingen:
- VAR-achtige video review voor twijfelachtige situaties
- Strictere handhaving van fair play regels
- Nieuwe penalty shootout regels
- Aangepaste speeltijden voor betere flow

Deze regels zijn in overleg met alle teamcaptains opgesteld en worden vanaf de eerste speeldag toegepast. Alle scheidsrechters zijn getraind in de nieuwe regels.',
    'Voor het nieuwe seizoen hebben we enkele belangrijke wijzigingen doorgevoerd in de spelregels om de competitie nog eerlijker en spannender te maken.',
    'Reglement Commissie',
    'Reglement',
    ARRAY['spelregels', 'wijzigingen', 'fairplay'],
    true,
    'nieuwe-spelregels-2024-2025'
),
(
    'Succesvolle zomerkampen afgerond',
    'De zomerkampen van dit jaar zijn succesvol afgerond! Meer dan 50 jonge spelers hebben deelgenomen aan onze intensieve trainingsprogramma''s.

De kampen waren verdeeld over drie leeftijdsgroepen:
- 8-12 jaar: Basis techniek en plezier
- 13-16 jaar: Gevorderde tactieken
- 17+: Elite training voor competitie

De feedback van deelnemers en ouders was overweldigend positief. Veel van deze jonge talenten stromen nu door naar onze jeugdteams of maken hun debuut in de seniorencompetitie.',
    'De zomerkampen van dit jaar zijn succesvol afgerond! Meer dan 50 jonge spelers hebben deelgenomen aan onze intensieve trainingsprogramma''s.',
    'Jeugd Trainer',
    'Jeugd',
    ARRAY['zomerkamp', 'jeugd', 'training'],
    true,
    'succesvolle-zomerkampen-2024'
);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public blog posts are viewable by everyone" ON blog_posts
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all blog posts" ON blog_posts
    FOR ALL USING (auth.role() = 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 